/**
 * LangGraph Streaming API for DeliveryIQ
 * Handles SSE streaming for delivery risk analysis, lane performance, and carrier recommendations.
 */

const LANGGRAPH_API_URL = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024';
const ASSISTANT_ID = 'delivery'; // Matches backend graph name

const log = {
  event: (type, data) => console.log(`[Stream] ${type}:`, data),
  state: (msg) => console.log(`[State] ${msg}`),
  error: (msg, err) => console.error(`[Error] ${msg}:`, err),
};

export const generateThreadId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper: extract text from message content
const extractText = (content) => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter(item => item?.type === 'text' && item.text)
      .map(item => item.text)
      .join('');
  }
  return '';
};

// Helper: extract tool names from content
const extractToolNames = (content) => {
  if (!Array.isArray(content)) return [];
  return content
    .filter(item => item.type === 'tool_use' && item.name)
    .map(item => item.name);
};

/**
 * Process message stream - shared logic for both startAnalysis and sendChatMessage
 */
async function processMessageStream(response, onStreamCallback) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const state = {
    currentMessageId: null,
    messageContent: new Map(),
    closedMessages: new Set(),
    reportedTools: new Set(),
    turnCounter: 0,
  };

  let currentEvent = '';

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('event:')) {
          currentEvent = trimmedLine.slice(6).trim();
          continue;
        }

        if (!trimmedLine.startsWith('data:')) continue;
        const dataStr = trimmedLine.slice(5).trim();
        if (!dataStr) continue;

        try {
          const data = JSON.parse(dataStr);

          // ERROR
          if (currentEvent === 'error' && data.error) {
            log.error('Server error', data);
            return { success: false, error: data.error, message: data.message };
          }

          // MESSAGES/PARTIAL: Stream tokens
          if (currentEvent === 'messages/partial' && Array.isArray(data) && data[0]) {
            const msg = data[0];
            const msgId = msg.id || 'default';

            if (msg.type === 'AIMessageChunk' || msg.type === 'ai') {
              const textChunk = extractText(msg.content);
              const tools = extractToolNames(msg.content);

              // Handle tool calls
              if (tools.length > 0) {
                for (const toolName of tools) {
                  const toolKey = `${msgId}-${toolName}`;
                  if (!state.reportedTools.has(toolKey)) {
                    state.reportedTools.add(toolKey);

                    if (state.currentMessageId && !state.closedMessages.has(state.currentMessageId)) {
                      state.closedMessages.add(state.currentMessageId);
                      onStreamCallback?.({ messageId: state.currentMessageId, type: 'message_closed' });
                    }

                    log.event('tool_call', toolName);
                    onStreamCallback?.({ messageId: msgId, tool: toolName, type: 'tool_call' });
                  }
                }
              }

              // Stream text
              if (textChunk) {
                if (state.closedMessages.has(msgId)) {
                  const newMsgId = `${msgId}-turn-${++state.turnCounter}`;
                  state.currentMessageId = newMsgId;
                  const accumulated = (state.messageContent.get(newMsgId) || '') + textChunk;
                  state.messageContent.set(newMsgId, accumulated);
                  onStreamCallback?.({ messageId: newMsgId, text: accumulated, isStreaming: true, type: 'text' });
                } else {
                  state.currentMessageId = msgId;
                  const accumulated = (state.messageContent.get(msgId) || '') + textChunk;
                  state.messageContent.set(msgId, accumulated);
                  onStreamCallback?.({ messageId: msgId, text: accumulated, isStreaming: true, type: 'text' });
                }
              }
            }

            // Tool Result
            if (msg.type === 'tool') {
              const toolKey = `result-${msg.name}-${msgId}`;
              if (!state.reportedTools.has(toolKey)) {
                state.reportedTools.add(toolKey);
                onStreamCallback?.({ messageId: msgId, tool: msg.name, type: 'tool_result' });
              }
            }
          }

          // AGENT STATUS - track when analytical agent is working
          if (currentEvent === 'agent_status' && data.agent && data.status) {
            log.event('agent_status', `${data.agent}: ${data.status}`);
            onStreamCallback?.({ type: 'agent_status', agent: data.agent, status: data.status });
          }

          // UPDATES - handle both direct result and node output (e.g., data.chat.result)
          if (currentEvent === 'updates') {
            // Direct result
            if (data.result) {
              onStreamCallback?.({ type: 'result_update', result: data.result });
            }
            // Node output with chat response (first message case)
            const nodeData = data.chat || data.human_input;
            if (nodeData?.chat_response && !state.messageContent.size) {
              // First message - display the complete response
              const msgId = `first-${Date.now()}`;
              state.messageContent.set(msgId, nodeData.chat_response);
              onStreamCallback?.({ messageId: msgId, text: nodeData.chat_response, isStreaming: false, type: 'text' });
              if (nodeData.result) {
                onStreamCallback?.({ type: 'result_update', result: nodeData.result });
              }
            }
          }

          // MESSAGES/COMPLETE
          else if (currentEvent === 'messages/complete' && Array.isArray(data) && data[0]) {
            const msg = data[0];
            const msgId = msg.id || 'default';

            if (msg.type === 'AIMessageChunk' || msg.type === 'ai') {
              const completedKey = `completed-${msgId}`;
              if (!state.reportedTools.has(completedKey)) {
                state.reportedTools.add(completedKey);

                const alreadyStreamed = state.messageContent.has(msgId);
                const isFinalMessage = msgId.includes('-final') || msgId.includes('chat-');
                const hasOtherContent = state.messageContent.size > 0;

                if (!alreadyStreamed && !(isFinalMessage && hasOtherContent)) {
                  const finalText = extractText(msg.content);
                  if (finalText) {
                    state.messageContent.set(msgId, finalText);
                    onStreamCallback?.({ messageId: msgId, text: finalText, isStreaming: false, type: 'text' });
                  }
                }

                onStreamCallback?.({ messageId: msgId, type: 'complete' });
              }
            }
          }

        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  onStreamCallback?.({ type: 'stream_end' });
  return { success: true };
}

/**
 * Start a delivery analysis workflow
 */
export async function startAnalysis(input, threadId, onStreamCallback) {
  log.state(`Starting analysis for thread ${threadId}`);

  const response = await fetch(`${LANGGRAPH_API_URL}/threads/${threadId}/runs/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
      input: { user_query: input.user_query || '' },
      stream_mode: 'messages',
      if_not_exists: 'create',
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return processMessageStream(response, onStreamCallback);
}

/**
 * Send a follow-up chat message
 */
export async function sendChatMessage(threadId, message, imageData, onStreamCallback) {
  log.state(`Chat message to thread ${threadId}`);

  let resumeContent = message;
  if (imageData) {
    resumeContent = [
      { type: 'text', text: message || '' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${imageData}` } }
    ];
  }

  const response = await fetch(`${LANGGRAPH_API_URL}/threads/${threadId}/runs/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID,
      command: { resume: resumeContent },
      stream_mode: 'messages',
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return processMessageStream(response, onStreamCallback);
}

// Tool labels for friendly display
export const TOOL_LABELS = {
  'analyze_delivery_risk': 'Analyzing delivery risk...',
  'get_lane_performance': 'Getting lane performance data...',
  'search_carriers': 'Searching carriers...',
  'get_carrier_details': 'Getting carrier details...',
  'get_delivery_window_recommendation': 'Calculating delivery window...',
  'message_analytical_agent': 'Creating visualizations...',
};

export const getToolLabel = (toolName) => TOOL_LABELS[toolName] || `Using ${toolName}...`;
