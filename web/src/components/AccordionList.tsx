import { useId, useState, type ReactNode } from 'react'

export type AccordionItem = {
  id: string
  title: string
  body: ReactNode
}

type AccordionListProps = {
  items: AccordionItem[]
  allowMultiple?: boolean
  ariaLabel?: string
}

export default function AccordionList({
  items,
  allowMultiple = false,
  ariaLabel,
}: AccordionListProps) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState<string[]>(items[0] ? [items[0].id] : [])

  function toggle(id: string) {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id)
      if (allowMultiple) {
        return isOpen ? prev.filter((x) => x !== id) : [...prev, id]
      }
      return isOpen ? [] : [id]
    })
  }

  return (
    <div className="accordion-list" role="region" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const open = openIds.includes(item.id)
        const panelId = `${baseId}-panel-${item.id}`
        const buttonId = `${baseId}-btn-${item.id}`
        return (
          <div
            key={item.id}
            className={open ? 'accordion-item accordion-item--open' : 'accordion-item'}
          >
            <h3 className="accordion-item__heading">
              <button
                type="button"
                id={buttonId}
                className="accordion-item__trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span className="accordion-item__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="accordion-item__title">{item.title}</span>
                <span className="accordion-item__chevron" aria-hidden>
                  {open ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="accordion-item__panel"
            >
              {item.body}
            </div>
          </div>
        )
      })}
    </div>
  )
}
