import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  const Component = onClick || hover ? motion.div : 'div'
  const motionProps = onClick || hover ? {
    whileHover: { scale: 1.01, y: -2 },
    whileTap: onClick ? { scale: 0.99 } : undefined,
    transition: { duration: 0.2 }
  } : {}

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-lyzr-cream
        shadow-sm
        ${hover || onClick ? 'cursor-pointer hover:shadow-md hover:border-lyzr-mid-1' : ''}
        transition-all duration-200
        ${paddingClasses[padding]}
        ${className}
      `}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  )
}

// Card Header
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`border-b border-lyzr-cream pb-4 mb-4 ${className}`}>
      {children}
    </div>
  )
}

// Card Title
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`font-playfair text-lg font-semibold text-lyzr-congo ${className}`}>
      {children}
    </h3>
  )
}

// Card Description
export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-lyzr-mid-4 mt-1 ${className}`}>
      {children}
    </p>
  )
}

// Card Content
export function CardContent({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

// Card Footer
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-lyzr-cream pt-4 mt-4 ${className}`}>
      {children}
    </div>
  )
}
