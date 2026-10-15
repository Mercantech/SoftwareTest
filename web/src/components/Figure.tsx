import { useState } from 'react'

type FigureProps = {
  src: string
  alt: string
  caption?: string
  /** Link to original source (e.g. Wikimedia Commons file page) */
  sourceUrl?: string
  sourceLabel?: string
  /** Visual size — default md keeps lesson images from dominating the page */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Figure({
  src,
  alt,
  caption,
  sourceUrl,
  sourceLabel,
  size = 'md',
  className,
}: FigureProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  const classes = ['figure', `figure--${size}`, className].filter(Boolean).join(' ')

  return (
    <figure className={classes}>
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      {caption || sourceUrl ? (
        <figcaption>
          {caption ? <span>{caption}</span> : null}
          {sourceUrl ? (
            <span className="figure__source">
              {caption ? ' · ' : null}
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                {sourceLabel ?? 'Kilde'}
              </a>
            </span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  )
}
