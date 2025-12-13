/**
 * Markdown parser for DeliveryIQ chat messages
 * Supports: bold, italic, bullet points, numbered lists, horizontal rules
 */
export const parseMarkdown = (text) => {
  if (!text) return null

  const lines = text.split('\n')
  const elements = []
  let key = 0

  lines.forEach((line, lineIndex) => {
    // Parse inline formatting: **bold** and *italic*
    const parseLine = (str) => {
      const processItalics = (text, startKey) => {
        const result = []
        let lastIndex = 0
        const italicRegex = /\*([^*]+?)\*/g
        let match

        while ((match = italicRegex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index))
          }
          result.push(
            <em key={`italic-${startKey++}`} className="italic text-slate-400">
              {match[1]}
            </em>
          )
          lastIndex = match.index + match[0].length
        }

        if (lastIndex < text.length) {
          result.push(text.slice(lastIndex))
        }

        return result.length > 0 ? result : [text]
      }

      const result = []
      let lastIndex = 0
      const boldRegex = /\*\*(.+?)\*\*/g
      let match

      while ((match = boldRegex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          result.push(...processItalics(str.slice(lastIndex, match.index), key))
          key += 10
        }
        result.push(
          <strong key={`bold-${key++}`} className="font-semibold text-slate-100">
            {match[1]}
          </strong>
        )
        lastIndex = match.index + match[0].length
      }

      if (lastIndex < str.length) {
        result.push(...processItalics(str.slice(lastIndex), key))
        key += 10
      }

      return result.length > 0 ? result : str
    }

    // Horizontal rule: ---
    if (line.trim() === '---') {
      elements.push(
        <div key={`line-${lineIndex}`} className="h-px bg-slate-600 my-3" />
      )
    }
    // Bullet points: • or -
    else if (line.startsWith('• ') || line.startsWith('- ')) {
      elements.push(
        <div key={`line-${lineIndex}`} className="flex items-start mb-1 pl-2">
          <span className="text-primary-400 mr-2">•</span>
          <span>{parseLine(line.slice(2))}</span>
        </div>
      )
    }
    // Numbered lists: 1. 2. 3.
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1]
      elements.push(
        <div key={`line-${lineIndex}`} className="flex items-start mb-1 pl-2">
          <span className="text-primary-400 mr-2 font-semibold min-w-[1.25rem]">{num}.</span>
          <span>{parseLine(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      )
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={`line-${lineIndex}`} className="h-2" />)
    }
    // Regular text
    else {
      elements.push(
        <div key={`line-${lineIndex}`} className="mb-1">
          {parseLine(line)}
        </div>
      )
    }
  })

  return elements
}
