import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-lyzr-ferra text-white hover:bg-lyzr-congo',
  secondary: 'bg-lyzr-cream text-lyzr-congo hover:bg-lyzr-mid-1',
  outline: 'border-2 border-lyzr-ferra text-lyzr-ferra hover:bg-lyzr-ferra hover:text-white',
  ghost: 'text-lyzr-ferra hover:bg-lyzr-cream',
  danger: 'bg-accent-error text-white hover:bg-red-700'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2'
}

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-noto font-medium rounded-lg
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-lyzr-ferra focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  )
})

Button.displayName = 'Button'

export default Button
