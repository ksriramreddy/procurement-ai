const variants = {
  default: 'bg-lyzr-cream text-lyzr-congo',
  primary: 'bg-lyzr-ferra text-white',
  secondary: 'bg-lyzr-mid-1 text-lyzr-congo',
  success: 'bg-accent-success/10 text-accent-success border border-accent-success/20',
  warning: 'bg-accent-warning/10 text-accent-warning border border-accent-warning/20',
  error: 'bg-accent-error/10 text-accent-error border border-accent-error/20',
  info: 'bg-accent-cool/10 text-accent-cool border border-accent-cool/20',
  outline: 'border border-lyzr-cream text-lyzr-congo'
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-noto font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
