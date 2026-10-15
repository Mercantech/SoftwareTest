import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'

export type LightboxImage = {
  src: string
  alt: string
  caption?: string
}

type ImageLightboxProps = {
  image: LightboxImage
  onClose: () => void
}

const MIN_ZOOM = 0.4
const MAX_ZOOM = 5
const ZOOM_STEP = 0.25

function portalRoot(): Element {
  return document.fullscreenElement ?? document.body
}

export default function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  const { lang } = useLanguage()
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [fs, setFs] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const zoomBy = useCallback((delta: number) => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))))
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const toggleFullscreen = useCallback(() => {
    const panel = panelRef.current
    if (!panel) return
    if (document.fullscreenElement === panel) {
      void document.exitFullscreen().catch(() => undefined)
    } else {
      void panel.requestFullscreen().catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const onFs = () => {
      setFs(document.fullscreenElement === panelRef.current)
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (document.fullscreenElement === panelRef.current) {
          void document.exitFullscreen().catch(() => undefined)
          return
        }
        onClose()
        return
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        zoomBy(ZOOM_STEP)
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        zoomBy(-ZOOM_STEP)
      }
      if (e.key === '0') {
        e.preventDefault()
        resetView()
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', onKey, true)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey, true)
      if (document.fullscreenElement === panelRef.current) {
        void document.exitFullscreen().catch(() => undefined)
      }
    }
  }, [onClose, zoomBy, resetView, toggleFullscreen])

  function onWheel(e: ReactWheelEvent) {
    e.preventDefault()
    zoomBy(e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2)
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    setPan({
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    })
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null
    }
  }

  const title = image.caption?.trim() || t(lang, 'figureModalTitle')

  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-image-lightbox
    >
      <button
        type="button"
        className="image-lightbox__backdrop"
        aria-label={t(lang, 'mermaidClose')}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={fs ? 'image-lightbox__panel image-lightbox__panel--fs' : 'image-lightbox__panel'}
      >
        <header className="image-lightbox__toolbar">
          <span className="image-lightbox__title">{title}</span>
          <div className="image-lightbox__actions">
            <button
              type="button"
              onClick={() => zoomBy(-ZOOM_STEP)}
              aria-label={t(lang, 'mermaidZoomOut')}
              title={`${t(lang, 'mermaidZoomOut')} (−)`}
            >
              −
            </button>
            <span className="image-lightbox__zoom" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => zoomBy(ZOOM_STEP)}
              aria-label={t(lang, 'mermaidZoomIn')}
              title={`${t(lang, 'mermaidZoomIn')} (+)`}
            >
              +
            </button>
            <button
              type="button"
              onClick={resetView}
              aria-label={t(lang, 'mermaidReset')}
              title={`${t(lang, 'mermaidReset')} (0)`}
            >
              {t(lang, 'mermaidReset')}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={t(lang, 'figureFullscreen')}
              title={`${t(lang, 'figureFullscreen')} (F)`}
            >
              {fs ? t(lang, 'figureFullscreenExit') : t(lang, 'figureFullscreen')}
            </button>
            <button
              type="button"
              ref={closeBtnRef}
              className="image-lightbox__close"
              onClick={onClose}
              aria-label={t(lang, 'mermaidClose')}
            >
              {t(lang, 'mermaidClose')}
            </button>
          </div>
        </header>
        <div
          className="image-lightbox__viewport"
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="image-lightbox__stage"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <img src={image.src} alt={image.alt} draggable={false} />
          </div>
        </div>
        <p className="image-lightbox__hint">{t(lang, 'figureHint')}</p>
      </div>
    </div>,
    portalRoot(),
  )
}
