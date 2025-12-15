import { useState, useRef, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { startAnalysis, sendChatMessage, generateThreadId, getToolLabel } from '../services/api'
import {
  injectStyles,
  ChatInput,
  MessageList,
  AgentDashboard
} from './chat'

const ChatInterface = ({ showDashboard = true }) => {
  // Core state
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Session state
  const [threadId, setThreadId] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isFirstMessage, setIsFirstMessage] = useState(true)

  // Agent status (for showing spinner when analytical agent is working)
  const [analyticalAgentWorking, setAnalyticalAgentWorking] = useState(false)

  // Scroll management refs
  const messagesEndRef = useRef(null)
  const lastMessageRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const shouldAutoScroll = useRef(true)
  const prevMessageCount = useRef(0)

  // Inject CSS animations on mount
  useEffect(() => { injectStyles() }, [])

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCount.current && shouldAutoScroll.current) {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    prevMessageCount.current = messages.length
  }, [messages])

  // Handle manual scrolling
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Load session from localStorage on mount
  useEffect(() => {
    const savedThreadId = localStorage.getItem('deliveryiq_thread_id')
    const savedResult = localStorage.getItem('deliveryiq_result')
    const savedMessages = localStorage.getItem('deliveryiq_messages')
    const savedIsFirst = localStorage.getItem('deliveryiq_is_first')

    if (savedThreadId) setThreadId(savedThreadId)
    if (savedResult) {
      try {
        setAnalysisResult(JSON.parse(savedResult))
      } catch (e) { console.error('Error parsing saved result:', e) }
    }
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages))
      } catch (e) { console.error('Error parsing saved messages:', e) }
    }
    if (savedIsFirst !== null) {
      setIsFirstMessage(savedIsFirst === 'true')
    }
  }, [])

  // Save session state whenever it changes
  useEffect(() => {
    if (threadId) localStorage.setItem('deliveryiq_thread_id', threadId)
    if (analysisResult) localStorage.setItem('deliveryiq_result', JSON.stringify(analysisResult))
    if (messages.length > 0) localStorage.setItem('deliveryiq_messages', JSON.stringify(messages))
    localStorage.setItem('deliveryiq_is_first', String(isFirstMessage))
  }, [threadId, analysisResult, messages, isFirstMessage])

  // Clear session data
  const clearSession = () => {
    console.log('[Chat] Clearing session')
    localStorage.removeItem('deliveryiq_thread_id')
    localStorage.removeItem('deliveryiq_result')
    localStorage.removeItem('deliveryiq_messages')
    localStorage.removeItem('deliveryiq_is_first')
    setThreadId(null)
    setAnalysisResult(null)
    setMessages([])
    setIsFirstMessage(true)
  }

  // Handle first message - start new analysis with streaming
  const handleFirstMessage = async (userMessage) => {
    try {
      const newThreadId = generateThreadId()
      setThreadId(newThreadId)

      // Track tool calls to avoid duplicates
      const reportedTools = new Set()

      const result = await startAnalysis(
        { user_query: userMessage },
        newThreadId,
        (event) => {
          // Stream ended - finalize all messages
          if (event.type === 'stream_end') {
            setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m))
            return
          }

          // Message was closed (tool is about to be called)
          if (event.type === 'message_closed') {
            setMessages(prev => prev.map(m =>
              m.id === event.messageId && m.isStreaming
                ? { ...m, isStreaming: false }
                : m
            ))
            return
          }

          // Tool call - add tool bubble
          if (event.type === 'tool_call' && event.tool) {
            const toolKey = `${event.messageId}-${event.tool}`
            if (!reportedTools.has(toolKey)) {
              reportedTools.add(toolKey)

              // Start spinner when analytical agent is called
              if (event.tool === 'message_analytical_agent') {
                setAnalyticalAgentWorking(true)
              }

              setMessages(prev => [...prev, {
                type: 'tool',
                id: `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                content: getToolLabel(event.tool)
              }])
            }
            return
          }

          // Text content - update or create message bubble
          if (event.type === 'text' && event.messageId) {
            setMessages(prev => {
              const existingIndex = prev.findIndex(m => m.id === event.messageId)

              if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  content: event.text,
                  isStreaming: event.isStreaming
                }
                return updated
              } else {
                return [...prev, {
                  type: 'assistant',
                  id: event.messageId,
                  content: event.text,
                  isStreaming: event.isStreaming
                }]
              }
            })
            return
          }

          // Message complete - mark as not streaming
          if (event.type === 'complete') {
            setMessages(prev => prev.map(m =>
              m.id === event.messageId
                ? { ...m, isStreaming: false }
                : m
            ))
            return
          }

          // Result update - update the analysis result (sidebar)
          if (event.type === 'result_update' && event.result) {
            console.log('[Chat] First msg result update:', event.result)
            console.log('[Chat] Visualizations:', event.result.visualizations)
            // Stop spinner when visualizations arrive
            if (event.result.visualizations?.length > 0) {
              setAnalyticalAgentWorking(false)
            }
            setAnalysisResult(prev => ({ ...prev, ...event.result }))
            return
          }

          // Agent status - only use to start spinner, not stop (we stop when visualizations arrive)
          if (event.type === 'agent_status') {
            if (event.agent === 'analytical' && event.status === 'working') {
              setAnalyticalAgentWorking(true)
            }
            return
          }
        }
      )

      // Final safety: ensure no messages stuck in streaming state
      setAnalyticalAgentWorking(false)  // Reset agent status
      setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m))

      // Handle result
      if (result) {
        console.log('[Chat] Final result:', result)
        setAnalysisResult(prev => ({ ...prev, ...result }))
        setIsFirstMessage(false)
      }

    } catch (error) {
      console.error('[Chat] Error:', error)
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      }])
    }
  }

  // Handle follow-up messages
  const handleChatMessage = async (userMessage) => {
    try {
      // Track tool calls to avoid duplicates
      const reportedTools = new Set()

      const result = await sendChatMessage(threadId, userMessage, null, (event) => {
        // Stream ended - finalize all messages
        if (event.type === 'stream_end') {
          setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m))
          return
        }

        // Message was closed (tool is about to be called)
        if (event.type === 'message_closed') {
          setMessages(prev => prev.map(m =>
            m.id === event.messageId && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          ))
          return
        }

        // Tool call - add tool bubble
        if (event.type === 'tool_call' && event.tool) {
          const toolKey = `${event.messageId}-${event.tool}`
          if (!reportedTools.has(toolKey)) {
            reportedTools.add(toolKey)

            // Start spinner when analytical agent is called
            if (event.tool === 'message_analytical_agent') {
              setAnalyticalAgentWorking(true)
            }

            setMessages(prev => [...prev, {
              type: 'tool',
              id: `tool-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              content: getToolLabel(event.tool)
            }])
          }
          return
        }

        // Text content - update or create message bubble
        if (event.type === 'text' && event.messageId) {
          setMessages(prev => {
            const existingIndex = prev.findIndex(m => m.id === event.messageId)

            if (existingIndex >= 0) {
              // Update existing message
              const updated = [...prev]
              updated[existingIndex] = {
                ...updated[existingIndex],
                content: event.text,
                isStreaming: event.isStreaming
              }
              return updated
            } else {
              // Create new message bubble
              return [...prev, {
                type: 'assistant',
                id: event.messageId,
                content: event.text,
                isStreaming: event.isStreaming
              }]
            }
          })
          return
        }

        // Message complete - mark as not streaming
        if (event.type === 'complete') {
          setMessages(prev => prev.map(m =>
            m.id === event.messageId
              ? { ...m, isStreaming: false }
              : m
          ))
          return
        }

        // Result update - update the analysis result (sidebar)
        if (event.type === 'result_update' && event.result) {
          console.log('[Chat] Received result update:', event.result)
          console.log('[Chat] Visualizations:', event.result.visualizations)
          // Stop spinner when visualizations arrive
          if (event.result.visualizations?.length > 0) {
            setAnalyticalAgentWorking(false)
          }
          setAnalysisResult(prev => ({
            ...prev,
            ...event.result
          }))
          return
        }

        // Agent status - only use to start spinner, not stop (we stop when visualizations arrive)
        if (event.type === 'agent_status') {
          if (event.agent === 'analytical' && event.status === 'working') {
            setAnalyticalAgentWorking(true)
          }
          return
        }
      })

      // Final safety: ensure no messages stuck in streaming state
      setAnalyticalAgentWorking(false)  // Reset agent status
      setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m))

      // Check if we got a valid response
      if (result && result.success === false) {
        console.warn('[Chat] Error from server:', result.error)
        if (result.error === 'session_expired' || result.error === 'session_not_found') {
          clearSession()
          setMessages(prev => [...prev, {
            type: 'assistant',
            content: result.message || 'Your session has expired. Please start a new conversation.'
          }])
        }
      }

    } catch (error) {
      console.error('[Chat] Error:', error)
      if (error.message?.includes('404') || error.message?.includes('no existing state')) {
        clearSession()
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Your previous session has expired. Please start a new conversation.'
        }])
      } else {
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }])
      }
    }
  }

  // Send message handler
  const sendMessage = async () => {
    const userMessage = inputValue.trim()
    if (!userMessage) return

    setIsLoading(true)
    setInputValue('')
    shouldAutoScroll.current = true

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage
    }])

    try {
      if (isFirstMessage || !threadId) {
        await handleFirstMessage(userMessage)
      } else {
        await handleChatMessage(userMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Render Chat Interface
  return (
    <div className="flex flex-col h-full bg-midnight-950">
      {/* Empty State */}
      {messages.length === 0 ? (
        <EmptyState
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          onSend={sendMessage}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="hide-scrollbar flex-1 overflow-y-auto"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className={`mx-auto p-6 ${showDashboard ? 'max-w-full' : 'max-w-4xl'}`}>
                <MessageList
                  messages={messages}
                  lastMessageRef={lastMessageRef}
                  hasArtifact={showDashboard}
                />
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700/50">
              <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                isLoading={isLoading}
                onSend={sendMessage}
                variant="default"
              />
            </div>
          </div>

          {/* Agent Dashboard */}
          {showDashboard && (
            <AgentDashboard
              analysisResult={analysisResult}
              isAnalyticalWorking={analyticalAgentWorking}
            />
          )}
        </div>
      )}
    </div>
  )
}

// Empty State Component
const EmptyState = ({
  inputValue,
  setInputValue,
  isLoading,
  onSend
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="text-center mb-12 z-10" style={{ animation: 'fadeIn 0.3s ease' }}>
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-4 tracking-tight">
          DeliveryIQ Agent
        </h2>
        <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
          Ask me about <span className="text-primary-400 font-medium">delivery risks</span>, lane performance, carrier recommendations, or any logistics questions.
        </p>
      </div>

      {/* Suggested prompts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 z-10 max-w-3xl">
        {[
          'Analyze risk for Chicago to Miami lane',
          'Which carrier has best on-time rate?',
          'What causes delays in December?'
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setInputValue(prompt)}
            className="p-3 text-sm text-left text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-primary-500/50 rounded-xl transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="z-10 w-full max-w-2xl">
        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          isLoading={isLoading}
          onSend={onSend}
          variant="floating"
        />
      </div>
    </div>
  )
}

export default ChatInterface
