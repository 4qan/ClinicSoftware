interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  onClose: (id: string) => void
}

const bgColors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
}

export function Toast({ id, type, message, onClose }: ToastProps) {
  return (
    <div
      role="alert"
      className={`${bgColors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-72 max-w-md animate-slide-in`}
    >
      <span className="flex-1 text-sm">{message}</span>
      <button
        onClick={() => onClose(id)}
        aria-label="Close"
        className="text-white/80 hover:text-white font-bold text-lg leading-none shrink-0"
      >
        &times;
      </button>
    </div>
  )
}
