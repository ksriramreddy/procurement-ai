import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-lyzr-congo mb-1.5">
          {label}
          {props.required && <span className="text-accent-error ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-4 py-2.5
          bg-white border border-lyzr-cream rounded-lg
          text-lyzr-black placeholder-lyzr-mid-4
          font-noto text-sm
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-lyzr-ferra focus:border-transparent
          disabled:bg-lyzr-light-2 disabled:cursor-not-allowed
          ${error ? 'border-accent-error focus:ring-accent-error' : ''}
          ${inputClassName}
        `}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-accent-error' : 'text-lyzr-mid-4'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input

// Textarea variant
export const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  inputClassName = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-lyzr-congo mb-1.5">
          {label}
          {props.required && <span className="text-accent-error ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-2.5
          bg-white border border-lyzr-cream rounded-lg
          text-lyzr-black placeholder-lyzr-mid-4
          font-noto text-sm
          transition-all duration-200
          resize-none
          focus:outline-none focus:ring-2 focus:ring-lyzr-ferra focus:border-transparent
          disabled:bg-lyzr-light-2 disabled:cursor-not-allowed
          ${error ? 'border-accent-error focus:ring-accent-error' : ''}
          ${inputClassName}
        `}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-accent-error' : 'text-lyzr-mid-4'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
