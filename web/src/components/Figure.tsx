import { useCallback, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'
import ImageLightbox from './ImageLightbox'

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
  const { lang } = useLanguage()
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState(false)

  const openLightbox = useCallback(() => setOpen(true), [])
  const closeLightbox = useCallback(() => setOpen(false), [])

  if (failed) return null

  const classes = ['figure', `figure--${size}`, className].filter(Boolean).join(' ')

  return (
    <>
      <figure className={classes}>
        <button
          type="button"
          className="figure__open"
          onClick={openLightbox}
          aria-label={t(lang, 'figureExpand')}
          title={t(lang, 'figureExpand')}
        >
          <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
          <span className="figure__zoom-hint" aria-hidden="true">
            {t(lang, 'figureExpand')}
          </span>
        </button>
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
      {open ? (
        <ImageLightbox
          image={{ src, alt, caption }}
          onClose={closeLightbox}
        />
      ) : null}
    </>
  )
}
