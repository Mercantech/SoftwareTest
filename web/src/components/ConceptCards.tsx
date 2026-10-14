import { useState } from 'react'

export type ConceptCard = {
  id: string
  title: string
  level: string
  body: string
}

type ConceptCardsProps = {
  items: ConceptCard[]
  ariaLabel?: string
}

export default function ConceptCards({ items, ariaLabel }: ConceptCardsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id)

  const active = items.find((item) => item.id === activeId) ?? items[0]

  return (
    <div className="concept-cards" role="group" aria-label={ariaLabel}>
      <div className="concept-cards__grid">
        {items.map((item) => {
          const selected = item.id === active?.id
          return (
            <button
              key={item.id}
              type="button"
              className={selected ? 'concept-card concept-card--active' : 'concept-card'}
              aria-pressed={selected}
              onClick={() => setActiveId(item.id)}
            >
              <span className="concept-card__level">{item.level}</span>
              <span className="concept-card__title">{item.title}</span>
            </button>
          )
        })}
      </div>
      {active ? (
        <div className="concept-cards__detail" key={active.id}>
          <h3 className="concept-cards__detail-title">{active.title}</h3>
          <p>{active.body}</p>
        </div>
      ) : null}
    </div>
  )
}
