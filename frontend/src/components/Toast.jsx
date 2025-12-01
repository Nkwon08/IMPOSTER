import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const typeStyles = {
    success: {
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      icon: '✓'
    },
    error: {
      background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
      icon: '✕'
    },
    info: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: 'ℹ'
    }
  }

  const style = typeStyles[type] || typeStyles.info

  return (
    <div
      className="toast"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: style.background,
        color: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        animation: duration > 0 ? 'toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'toastFadeOut 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '250px',
        maxWidth: '400px',
        cursor: 'pointer',
        transformStyle: 'preserve-3d',
      }}
      onClick={onClose}
    >
      <span style={{ fontSize: '1.5rem' }}>{style.icon}</span>
      <span style={{ flex: 1, fontWeight: '500' }}>{message}</span>
    </div>
  )
}

