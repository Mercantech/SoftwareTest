import { useState } from 'react'

export type ProcessStep = {
  id: string
  label: string
  detail: string
}

type ProcessStepperProps = {
  steps: ProcessStep[]
  ariaLabel?: string
}

export default function ProcessStepper({ steps, ariaLabel }: ProcessStepperProps) {
  const [activeId, setActiveId] = useState(steps[0]?.id)
  const active = steps.find((step) => step.id === activeId) ?? steps[0]
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === active?.id),
  )

  return (
    <div className="process-stepper" role="group" aria-label={ariaLabel}>
      <ol className="process-stepper__list">
        {steps.map((step, index) => {
          const selected = step.id === active?.id
          return (
            <li key={step.id} className="process-stepper__item">
              {index > 0 ? <span className="process-stepper__connector" aria-hidden /> : null}
              <button
                type="button"
                className={
                  selected
                    ? 'process-stepper__btn process-stepper__btn--active'
                    : 'process-stepper__btn'
                }
                aria-pressed={selected}
                onClick={() => setActiveId(step.id)}
              >
                <span className="process-stepper__num">{index + 1}</span>
                <span className="process-stepper__label">{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
      {active ? (
        <div className="process-stepper__detail" key={active.id}>
          <p className="process-stepper__progress">
            {activeIndex + 1} / {steps.length}
          </p>
          <h3>{active.label}</h3>
          <p>{active.detail}</p>
        </div>
      ) : null}
    </div>
  )
}
