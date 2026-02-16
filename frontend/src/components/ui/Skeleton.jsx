export default function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  ...props
}) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }

  return (
    <div
      className={`skeleton ${roundedClasses[rounded]} ${className}`}
      style={{
        width: width,
        height: height
      }}
      {...props}
    />
  )
}

// Skeleton Text
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '70%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  )
}

// Skeleton Card
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-lyzr-cream p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton width="48px" height="48px" rounded="full" />
        <div className="flex-1">
          <Skeleton height="20px" width="60%" className="mb-2" />
          <Skeleton height="14px" width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

// Skeleton Table Row
export function SkeletonTableRow({ columns = 5, className = '' }) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height="16px" width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  )
}

// Skeleton Message
export function SkeletonMessage({ isUser = false, className = '' }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`max-w-[70%] ${isUser ? 'order-1' : ''}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <Skeleton width="24px" height="24px" rounded="full" />
            <Skeleton width="80px" height="14px" />
          </div>
        )}
        <div className={`p-4 rounded-2xl ${isUser ? 'bg-lyzr-cream' : 'bg-white border border-lyzr-cream'}`}>
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  )
}
