import { useState } from 'react'

type FigureProps = {
  src: string
  alt: string
  caption?: string
}

export default function Figure({ src, alt, caption }: FigureProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return null

  return (
    <figure className="figure">
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}
