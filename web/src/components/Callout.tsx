import type { ReactNode } from 'react'

export type CalloutType = 'info' | 'warn' | 'tip' | 'danger'

const icons: Record<CalloutType, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  tip: '💡',
  danger: '🛑',
}

type CalloutProps = {
  type?: CalloutType
  children: ReactNode
}

export default function Callout({ type = 'info', children }: CalloutProps) {
  return (
    <aside className={`callout callout--${type}`} role="note">
      <span className="callout__icon" aria-hidden>
        {icons[type]}
      </span>
      <div>{children}</div>
    </aside>
  )
}
