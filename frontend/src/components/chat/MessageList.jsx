import { CheckCircle, Search } from 'lucide-react'
import { parseMarkdown } from './parseMarkdown'

/**
 * Message list component for DeliveryIQ chat interface
 * Renders user messages, assistant responses, and tool call indicators
 */
const MessageList = ({ messages, lastMessageRef, hasArtifact }) => {
  return (
    <>
      {messages.map((message, index) => (
        <div key={message.id || index}>
          <div
            ref={index === messages.length - 1 ? lastMessageRef : null}
            className={`mb-6 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
          >
            {message.type === 'user' ? (
              <UserMessage message={message} />
            ) : message.type === 'assistant' ? (
              <AssistantMessage message={message} hasArtifact={hasArtifact} />
            ) : message.type === 'tool' ? (
              <ToolMessage message={message} />
            ) : null}
          </div>
        </div>
      ))}
    </>
  )
}

const UserMessage = ({ message }) => (
  <div className="inline-block max-w-lg">
    {message.image && (
      <div className="mb-2 rounded-2xl overflow-hidden shadow-lg">
        <img
          src={message.image}
          alt={message.imageName || 'Uploaded image'}
          className="max-w-full max-h-72 block object-contain bg-slate-800"
        />
      </div>
    )}
    <div className="bg-gradient-to-r from-primary-500 to-accent-purple text-white px-6 py-3.5 rounded-[20px] rounded-br-sm text-sm shadow-lg shadow-primary-500/30 text-left">
      {message.content}
    </div>
  </div>
)

const AssistantMessage = ({ message, hasArtifact }) => (
  <div className={`inline-block ${hasArtifact ? 'max-w-[95%]' : 'max-w-lg'}`}>
    {message.toolActivities && message.toolActivities.length > 0 && (
      <div className="mb-2 flex flex-col gap-1">
        {message.toolActivities.map((activity, idx) => (
          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 rounded-xl text-xs text-primary-400 border border-primary-500/20">
            <CheckCircle className="w-3 h-3" />
            <span>{activity.message}</span>
          </div>
        ))}
      </div>
    )}

    {message.isStreaming && !message.content && (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl text-sm text-slate-400">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
        <span>Thinking...</span>
      </div>
    )}

    {message.content && (
      <div className="bg-slate-700/50 text-slate-200 px-6 py-3.5 rounded-[20px] rounded-bl-sm text-sm border border-slate-600/50 shadow-lg leading-relaxed">
        {parseMarkdown(message.content)}
      </div>
    )}
  </div>
)

const ToolMessage = ({ message }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-xl text-sm text-primary-400 border border-primary-500/20">
    <Search className="w-3.5 h-3.5" />
    <span>{message.content}</span>
  </div>
)

export default MessageList
