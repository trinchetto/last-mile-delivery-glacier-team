/**
 * CSS animation keyframes injected into document
 */
export const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('chat-animations')) {
    const style = document.createElement('style')
    style.id = 'chat-animations'
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
    document.head.appendChild(style)
  }
}
