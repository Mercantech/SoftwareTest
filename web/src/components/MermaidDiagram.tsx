import mermaid from 'mermaid'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { useTheme } from '../i18n/ThemeContext'
import { t } from '../i18n/ui'

type MermaidDiagramProps = {
  chart: string
}

function configureMermaid(theme: 'light' | 'dark') {
  mermaid.initialize({
    startOnLoad: false,
    theme: theme === 'light' ? 'neutral' : 'dark',
    securityLevel: 'strict',
  })
}

const MIN_ZOOM = 0.4
const MAX_ZOOM = 4
const ZOOM_STEP = 0.25

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const { lang } = useLanguage()
  const { theme } = useTheme()
  const reactId = useId()
  const diagramId = `mermaid-${reactId.replace(/:/g, '')}`
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    configureMermaid(theme)

    mermaid
      .render(`${diagramId}-${theme}`, chart.trim())
      .then(({ svg: rendered }) => {
        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Kunne ikke tegne diagram')
          setSvg('')
        }
      })

    return () => {
      cancelled = true
    }
  }, [chart, diagramId, theme])

  const openModal = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setBaseSize(null)
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setBaseSize(null)
    dragRef.current = null
  }, [])

  // Fit SVG to viewport once, then zoom by resizing width/height (vector stays crisp)
  useEffect(() => {
    if (!open || !svg || baseSize) return
    const frame = requestAnimationFrame(() => {
      const stage = stageRef.current
      const el = stage?.querySelector('svg')
      const viewport = stage?.parentElement
      if (!(el instanceof SVGSVGElement) || !viewport) return

      el.style.maxWidth = 'none'
      el.style.maxHeight = 'none'

      const box = el.viewBox?.baseVal
      const aspect =
        box && box.width > 0 && box.height > 0
          ? box.width / box.height
          : el.getBoundingClientRect().width / Math.max(el.getBoundingClientRect().height, 1)

      const maxW = viewport.clientWidth * 0.92
      const maxH = viewport.clientHeight * 0.88
      let w = maxW
      let h = w / aspect
      if (h > maxH) {
        h = maxH
        w = h * aspect
      }
      if (w > 0 && h > 0) setBaseSize({ w, h })
    })
    return () => cancelAnimationFrame(frame)
  }, [open, svg, baseSize])

  useEffect(() => {
    if (!open || !baseSize) return
    const el = stageRef.current?.querySelector('svg')
    if (!(el instanceof SVGSVGElement)) return
    const w = baseSize.w * zoom
    const h = baseSize.h * zoom
    el.setAttribute('width', String(w))
    el.setAttribute('height', String(h))
    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.maxWidth = 'none'
    el.style.maxHeight = 'none'
  }, [open, baseSize, zoom])

  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))
      }
      if (e.key === '0') {
        e.preventDefault()
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, closeModal])

  function zoomBy(delta: number) {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))))
  }

  function resetView() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function onWheel(e: ReactWheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2
    zoomBy(delta)
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

  if (error) {
    return (
      <div className="mermaid-diagram" role="img" aria-label={t(lang, 'mermaidError')}>
        <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>
      </div>
    )
  }

  const modal =
    open && svg
      ? createPortal(
          <div
            className="mermaid-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t(lang, 'mermaidModalTitle')}
          >
            <button
              type="button"
              className="mermaid-modal__backdrop"
              aria-label={t(lang, 'mermaidClose')}
              onClick={closeModal}
            />
            <div className="mermaid-modal__panel">
              <header className="mermaid-modal__toolbar">
                <span className="mermaid-modal__title">{t(lang, 'mermaidModalTitle')}</span>
                <div className="mermaid-modal__actions">
                  <button
                    type="button"
                    onClick={() => zoomBy(-ZOOM_STEP)}
                    aria-label={t(lang, 'mermaidZoomOut')}
                    title={`${t(lang, 'mermaidZoomOut')} (−)`}
                  >
                    −
                  </button>
                  <span className="mermaid-modal__zoom" aria-live="polite">
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
                    ref={closeBtnRef}
                    className="mermaid-modal__close"
                    onClick={closeModal}
                    aria-label={t(lang, 'mermaidClose')}
                  >
                    {t(lang, 'mermaidClose')}
                  </button>
                </div>
              </header>
              <div
                className="mermaid-modal__viewport"
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div
                  ref={stageRef}
                  className="mermaid-modal__stage"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                  }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
              <p className="mermaid-modal__hint">{t(lang, 'mermaidHint')}</p>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div className="mermaid-diagram-wrap">
        <button
          type="button"
          className="mermaid-diagram__expand"
          onClick={openModal}
          disabled={!svg}
          aria-label={t(lang, 'mermaidExpand')}
          title={t(lang, 'mermaidExpand')}
        >
          {t(lang, 'mermaidExpand')}
        </button>
        <button
          type="button"
          className="mermaid-diagram mermaid-diagram--interactive"
          onClick={openModal}
          disabled={!svg}
          aria-label={t(lang, 'mermaidExpand')}
        >
          {svg && !open ? (
            <span
              className="mermaid-diagram__svg"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <span className="mermaid-diagram__loading">
              {open ? t(lang, 'mermaidModalTitle') : t(lang, 'mermaidLoading')}
            </span>
          )}
        </button>
      </div>
      {modal}
    </>
  )
}
