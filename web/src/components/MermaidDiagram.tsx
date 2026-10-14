import mermaid from 'mermaid'
import { useEffect, useId, useState } from 'react'

type MermaidDiagramProps = {
  chart: string
}

let mermaidInitialized = false

function ensureMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
    })
    mermaidInitialized = true
  }
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId()
  const diagramId = `mermaid-${reactId.replace(/:/g, '')}`
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ensureMermaid()

    mermaid
      .render(diagramId, chart.trim())
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
  }, [chart, diagramId])

  if (error) {
    return (
      <div className="mermaid-diagram" role="img" aria-label="Diagramfejl">
        <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>
      </div>
    )
  }

  return (
    <div
      className="mermaid-diagram"
      role="img"
      aria-label="Diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
