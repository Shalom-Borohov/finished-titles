import type { ReactNode } from 'react'

type LineIconProps = {
  size: number
  strokeWidth: number
  className?: string
  children: ReactNode
}

function LineIcon({ size, strokeWidth, className, children }: LineIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const PlusIcon = () => (
  <LineIcon size={22} strokeWidth={2.4}>
    <path d="M11 4v14M4 11h14" />
  </LineIcon>
)

export const MinusIcon = () => (
  <LineIcon size={22} strokeWidth={2.4}>
    <path d="M4 11h14" />
  </LineIcon>
)

export const BackChevronIcon = () => (
  <LineIcon size={20} strokeWidth={2.4}>
    <path d="M7 4l6 6-6 6" />
  </LineIcon>
)

export const ShareIcon = () => (
  <LineIcon size={22} strokeWidth={2.2}>
    <path d="M11 13V3M7 6.5 11 3l4 3.5M6 10H5v9h12v-9h-1" />
  </LineIcon>
)

export const ImportIcon = () => (
  <LineIcon size={22} strokeWidth={2.2}>
    <path d="M11 3v10M7 9.5l4 3.5 4-3.5M6 10H5v9h12v-9h-1" />
  </LineIcon>
)

export const ChatIcon = () => (
  <LineIcon size={22} strokeWidth={2.2}>
    <path d="M4 5h14v10H10l-4 3.5V15H4z" />
  </LineIcon>
)

export const GridIcon = () => (
  <LineIcon size={26} strokeWidth={2} className="tab-icon-grid">
    <rect x="4" y="4" width="8" height="8" rx="2.5" />
    <rect x="14" y="4" width="8" height="8" rx="2.5" />
    <rect x="4" y="14" width="8" height="8" rx="2.5" />
    <rect x="14" y="14" width="8" height="8" rx="2.5" />
  </LineIcon>
)

export const StatsIcon = () => (
  <LineIcon size={26} strokeWidth={2.2} className="tab-icon-line">
    <path d="M6 22V13M13 22V5M20 22v-6" />
  </LineIcon>
)

export const SlidersIcon = () => (
  <LineIcon size={26} strokeWidth={2.2} className="tab-icon-line">
    <path d="M5 9h8M19 9h2M5 17h2M13 17h8" />
    <circle cx="16" cy="9" r="2.5" />
    <circle cx="10" cy="17" r="2.5" />
  </LineIcon>
)
