import { ArrowUp, X, Image } from 'lucide-react'

/**
 * Chat input component for DeliveryIQ assistant
 * Handles text input and image upload with dark theme styling
 */
const ChatInput = ({
  inputValue,
  setInputValue,
  selectedImage,
  isLoading,
  onSend,
  onImageSelect,
  onRemoveImage,
  fileInputRef,
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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onImageSelect(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />

      {/* Image Preview */}
      {selectedImage && (
        <ImagePreview
          image={selectedImage}
          onRemove={onRemoveImage}
          isFloating={isFloating}
        />
      )}

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
            onImageClick={() => fileInputRef.current?.click()}
            selectedImage={selectedImage}
          />
        ) : (
          <CompactInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            onKeyDown={handleKeyDown}
            onSend={onSend}
            onImageClick={() => fileInputRef.current?.click()}
            selectedImage={selectedImage}
          />
        )}
      </div>
    </div>
  )
}

const ImagePreview = ({ image, onRemove, isFloating }) => (
  <div className={`mb-3 flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 ${
    isFloating ? 'rounded-2xl shadow-lg' : 'rounded-xl'
  }`}>
    <div className="relative">
      <img
        src={image.preview}
        alt="Selected"
        className="w-20 h-20 object-cover rounded-xl border border-slate-600"
      />
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-200">{image.file.name}</p>
      <p className="text-xs text-slate-400">{(image.file.size / 1024).toFixed(1)} KB</p>
    </div>
  </div>
)

const FloatingInput = ({ inputValue, setInputValue, isLoading, onKeyDown, onSend, onImageClick, selectedImage }) => (
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
    <div className="flex items-center justify-between px-4 pb-4">
      <button
        onClick={onImageClick}
        disabled={isLoading}
        className={`p-2 rounded-xl transition-all ${
          selectedImage
            ? 'bg-primary-500/20 text-primary-400'
            : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
        } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        title="Add image"
      >
        <Image className="w-5 h-5" />
      </button>
      <button
        onClick={onSend}
        disabled={isLoading || (!inputValue.trim() && !selectedImage)}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isLoading || (!inputValue.trim() && !selectedImage)
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-500 to-accent-purple text-white cursor-pointer hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  </>
)

const CompactInput = ({ inputValue, setInputValue, isLoading, onKeyDown, onSend, onImageClick, selectedImage }) => (
  <div className="flex items-center gap-3 px-3 py-2">
    <button
      onClick={onImageClick}
      disabled={isLoading}
      className={`p-2 rounded-xl transition-all ${
        selectedImage
          ? 'bg-primary-500/20 text-primary-400'
          : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
      } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      title="Add image"
    >
      <Image className="w-5 h-5" />
    </button>

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
      disabled={isLoading || (!inputValue.trim() && !selectedImage)}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isLoading || (!inputValue.trim() && !selectedImage)
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-primary-500 to-accent-purple text-white cursor-pointer hover:shadow-lg hover:shadow-primary-500/30'
      }`}
    >
      <ArrowUp className="w-4.5 h-4.5" />
    </button>
  </div>
)

export default ChatInput
