interface StatusMessageProps {
  type: 'success' | 'error' | 'info'
  message: string
}

export default function StatusMessage({ type, message }: StatusMessageProps) {
  const styles = {
    success: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300',
    error: 'bg-red-500/20 border-red-400/50 text-red-300',
    info: 'bg-blue-500/20 border-blue-400/50 text-blue-300',
  }

  return (
    <div className={`border rounded-xl p-3 text-sm text-center ${styles[type]}`}>
      {message}
    </div>
  )
}