import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X, AlertCircle } from 'lucide-react'

export default function Toast ({
  message,
  type = 'success',
  onClose,
  duration = 4000
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(() => {
        setIsVisible(false)
        onClose()
      }, 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const icons = {
    success: <CheckCircle size={28} className='drop-shadow' />,
    error: <XCircle size={28} className='drop-shadow' />,
    warning: <AlertCircle size={28} className='drop-shadow' />
  }

  const colors = {
    success: 'from-green-600 to-emerald-600',
    error: 'from-red-600 to-rose-600',
    warning: 'from-amber-500 to-orange-500'
  }

  return (
    <div className='fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4'>
      <div
        className={`rounded-xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-300
          bg-gradient-to-r ${colors[type]} text-white
          ${isExiting ? 'animate-toastSlideUp' : 'animate-toastSlideDown'}`}
      >
        <div className='flex items-start p-4'>
          <div className='mr-3 mt-0.5 flex-shrink-0'>{icons[type]}</div>

          <div className='flex-1'>
            <p className='text-sm leading-snug font-medium pr-6'>{message}</p>
          </div>

          <button
            onClick={() => {
              setIsExiting(true)
              setTimeout(() => {
                setIsVisible(false)
                onClose()
              }, 300)
            }}
            className='text-white/70 hover:text-white transition-colors -mt-1 -mr-1 p-1'
          >
            <X size={18} />
          </button>
        </div>

        <div className='h-1 bg-white/30'>
          <div
            className='h-full bg-white rounded-full'
            style={{
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes toastSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes toastSlideUp {
          from {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -100px) scale(0.9);
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-toastSlideDown {
          animation: toastSlideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)
            forwards;
        }

        .animate-toastSlideUp {
          animation: toastSlideUp 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  )
}
