import { useState } from 'react'

type FigureProps = {
  src: string
  alt: string
  caption?: string
  /** Link to original source (e.g. Wikimedia Commons file page) */
  sourceUrl?: string
  sourceLabel?: string
}

export default function Figure({ src, alt, caption, sourceUrl, sourceLabel }: FigureProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <figure className="figure">
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
