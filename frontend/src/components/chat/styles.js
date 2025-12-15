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
      @keyframes fadeOutScale {
        from {
          opacity: 1;
          transform: scale(1);
        }
        to {
          opacity: 0;
          transform: scale(0.98);
        }
      }
      @keyframes slideInFromBottom {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .view-transition-exit {
        animation: fadeOutScale 0.3s ease-out forwards;
      }
      .view-transition-enter {
        animation: slideInFromBottom 0.4s ease-out forwards;
      }
    `
    document.head.appendChild(style)
  }
}
