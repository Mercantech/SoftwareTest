import type { ReactNode } from 'react'

type SplitProps = {
  children: ReactNode
  media: ReactNode
  /** Put media on the left instead of the right */
  mediaFirst?: boolean
  className?: string
}

/** Two-column lesson block: prose + media (figure / diagram). Stacks on narrow screens. */
export default function Split({ children, media, mediaFirst = false, className }: SplitProps) {
  const classes = [
    'split',
    mediaFirst ? 'split--media-first' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="split__body">{children}</div>
      <div className="split__media">{media}</div>
    </div>
  )
}
