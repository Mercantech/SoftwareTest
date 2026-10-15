import {
  useCallback,
  useEffect,
  useId,
  useState,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'

type PresentModeProps = {
  contentRef: RefObject<HTMLElement | null>
}

type Slide = {
  html: string
  title: string
}

function buildSlides(root: HTMLElement): Slide[] {
  const kids = Array.from(root.children).filter(
    (el) => !(el instanceof HTMLElement && el.classList.contains('lesson-toolbar')),
  )
  if (kids.length === 0) return []

  const groups: Element[][] = []
  let current: Element[] = []

  for (const child of kids) {
    if (child.tagName === 'H2') {
      if (current.length) groups.push(current)
      current = [child]
    } else {
      current.push(child)
    }
  }
  if (current.length) groups.push(current)

  return groups.map((nodes, index) => {
    const titleEl =
      nodes.find((n) => n.tagName === 'H1' || n.tagName === 'H2') ?? nodes[0]
    const title =
      titleEl?.textContent?.trim() ||
      (index === 0 ? 'Intro' : `Slide ${index + 1}`)
    const html = nodes.map((n) => (n as HTMLElement).outerHTML).join('')
    return { html, title }
  })
}

export default function PresentMode({ contentRef }: PresentModeProps) {
  const { lang } = useLanguage()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)

  const close = useCallback(() => {
    setOpen(false)
    setIndex(0)
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  const openPresent = useCallback(() => {
    const root = contentRef.current
    if (!root) return
    const next = buildSlides(root)
    if (next.length === 0) return
    setSlides(next)
    setIndex(0)
    setOpen(true)
  }, [contentRef])

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(slides.length - 1, Math.max(0, i + delta)))
    },
    [slides.length],
  )

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        go(1)
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        go(-1)
        return
      }
      if (e.key === 'Home') {
        e.preventDefault()
        setIndex(0)
        return
      }
      if (e.key === 'End') {
        e.preventDefault()
        setIndex(slides.length - 1)
        return
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined)
        } else {
          const el = document.querySelector('.present-mode')
          if (el instanceof HTMLElement) {
            void el.requestFullscreen().catch(() => undefined)
          }
        }
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close, go, slides.length])

  const slide = slides[index]
  const atStart = index <= 0
  const atEnd = index >= slides.length - 1

  return (
    <>
      <button type="button" className="btn btn--ghost present-mode__trigger" onClick={openPresent}>
        {t(lang, 'presentOpen')}
      </button>

      {open && slide
        ? createPortal(
            <div
              className="present-mode"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="present-mode__chrome">
                <p id={titleId} className="present-mode__title">
                  {slide.title}
                </p>
                <p className="present-mode__progress" aria-live="polite">
                  {index + 1} / {slides.length}
                </p>
                <div className="present-mode__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => go(-1)}
                    disabled={atStart}
                  >
                    {t(lang, 'presentPrev')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => go(1)}
                    disabled={atEnd}
                  >
                    {t(lang, 'presentNext')}
                  </button>
                  <button type="button" className="btn btn--primary" onClick={close}>
                    {t(lang, 'presentExit')}
                  </button>
                </div>
              </div>

              <div className="present-mode__stage">
                <div
                  className="present-mode__slide prose lesson"
                  dangerouslySetInnerHTML={{ __html: slide.html }}
                />
              </div>

              <p className="present-mode__hint">{t(lang, 'presentHint')}</p>

              <div className="present-mode__dots" aria-hidden="true">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={
                      i === index
                        ? 'present-mode__dot present-mode__dot--active'
                        : 'present-mode__dot'
                    }
                    onClick={() => setIndex(i)}
                    tabIndex={-1}
                  />
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
