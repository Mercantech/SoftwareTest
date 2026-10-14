export type PlanSection = {
  id: string
  title: string
  body: string
  emphasis?: 'scope' | 'risk' | 'exit' | 'default'
}

type PlanSectionGridProps = {
  items: PlanSection[]
  ariaLabel?: string
  lead?: string
}

/** Always-visible IEEE-style checklist — scan, don't click. */
export default function PlanSectionGrid({ items, ariaLabel, lead }: PlanSectionGridProps) {
  return (
    <div className="plan-section-grid" aria-label={ariaLabel}>
      {lead ? <p className="plan-section-grid__lead">{lead}</p> : null}
      <ol className="plan-section-grid__list">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`plan-section-grid__item plan-section-grid__item--${item.emphasis ?? 'default'}`}
          >
            <span className="plan-section-grid__num">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <strong className="plan-section-grid__title">{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
