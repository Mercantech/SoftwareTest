export type ConceptLayer = {
  id: string
  title: string
  level: string
  body: string
}

type ConceptStackProps = {
  items: ConceptLayer[]
  ariaLabel?: string
  caption?: string
}

/** Static hierarchy — all layers visible. Broad → narrow (strategy on top). */
export default function ConceptStack({ items, ariaLabel, caption }: ConceptStackProps) {
  return (
    <div className="concept-stack" role="list" aria-label={ariaLabel}>
      {caption ? <p className="concept-stack__caption">{caption}</p> : null}
      <ol className="concept-stack__list">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="concept-stack__layer"
            style={{ ['--layer-i' as string]: String(index) }}
            role="listitem"
          >
            <div className="concept-stack__meta">
              <span className="concept-stack__level">{item.level}</span>
              <strong className="concept-stack__title">{item.title}</strong>
            </div>
            <p className="concept-stack__body">{item.body}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
