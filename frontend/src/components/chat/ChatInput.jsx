import { ArrowUp } from 'lucide-react'

/**
 * Chat input component for DeliveryIQ assistant
 * Handles text input with dark theme styling
 */
const ChatInput = ({
  inputValue,
  setInputValue,
  isLoading,
  onSend,
  variant = 'default' // 'default' or 'floating'
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const isFloating = variant === 'floating'

  return (
    <div className={`w-full mx-auto ${isFloating ? 'max-w-3xl' : 'max-w-4xl'}`}>
      {/* Input Container */}
      <div className={`bg-slate-800/50 backdrop-blur-md border border-slate-700 overflow-hidden ${
        isFloating ? 'rounded-3xl shadow-2xl' : 'rounded-2xl shadow-lg'
      }`}>
        {isFloating ? (
          <FloatingInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            onKeyDown={handleKeyDown}
            onSend={onSend}
          />
        ) : (
          <CompactInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            onKeyDown={handleKeyDown}
            onSend={onSend}
          />
        )}
      </div>
    </div>
  )
}

const FloatingInput = ({ inputValue, setInputValue, isLoading, onKeyDown, onSend }) => (
  <>
    <textarea
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Ask about delivery risks, lane performance, carriers..."
      rows={3}
      className="w-full px-6 pt-5 pb-2 bg-transparent text-slate-100 placeholder-slate-500 text-base outline-none resize-none font-inherit leading-relaxed"
      disabled={isLoading}
    />
    <div className="flex items-center justify-end px-4 pb-4">
      <button
        onClick={onSend}
        disabled={isLoading || !inputValue.trim()}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isLoading || !inputValue.trim()
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-500 to-accent-purple text-white cursor-pointer hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  </>
)

const CompactInput = ({ inputValue, setInputValue, isLoading, onKeyDown, onSend }) => (
  <div className="flex items-center gap-3 px-4 py-2">
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Ask about deliveries, lanes, carriers..."
      className="flex-1 py-3 px-2 bg-transparent text-slate-100 placeholder-slate-500 text-sm outline-none font-inherit"
      disabled={isLoading}
    />

    <button
      onClick={onSend}
      disabled={isLoading || !inputValue.trim()}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isLoading || !inputValue.trim()
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-primary-500 to-accent-purple text-white cursor-pointer hover:shadow-lg hover:shadow-primary-500/30'
      }`}
    >
      <ArrowUp className="w-4.5 h-4.5" />
    </button>
  </div>
)

export default ChatInput
