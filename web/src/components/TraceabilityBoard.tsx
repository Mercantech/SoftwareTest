import { useState } from 'react'

export type TraceRequirement = {
  id: string
  label: string
  testCaseIds: string[]
}

export type TraceTestCase = {
  id: string
  label: string
  type?: string
}

type TraceabilityBoardProps = {
  requirements: TraceRequirement[]
  testCases: TraceTestCase[]
  requirementsLabel: string
  testCasesLabel: string
  hintLabel: string
  ariaLabel?: string
}

export default function TraceabilityBoard({
  requirements,
  testCases,
  requirementsLabel,
  testCasesLabel,
  hintLabel,
  ariaLabel,
}: TraceabilityBoardProps) {
  const [activeReqId, setActiveReqId] = useState(requirements[0]?.id)
  const activeReq = requirements.find((r) => r.id === activeReqId) ?? requirements[0]
  const linked = new Set(activeReq?.testCaseIds ?? [])

  return (
    <div className="trace-board" role="group" aria-label={ariaLabel}>
      <p className="trace-board__hint">{hintLabel}</p>
      <div className="trace-board__columns">
        <div className="trace-board__col">
          <h3 className="trace-board__col-title">{requirementsLabel}</h3>
          <ul className="trace-board__list">
            {requirements.map((req) => {
              const selected = req.id === activeReq?.id
              return (
                <li key={req.id}>
                  <button
                    type="button"
                    className={
                      selected
                        ? 'trace-board__card trace-board__card--active'
                        : 'trace-board__card'
                    }
                    aria-pressed={selected}
                    onClick={() => setActiveReqId(req.id)}
                  >
                    <span className="trace-board__id">{req.id}</span>
                    <span>{req.label}</span>
                    <span className="trace-board__count">{req.testCaseIds.length}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="trace-board__links" aria-hidden>
          {testCases.map((tc) => {
            const isLinked = linked.has(tc.id)
            return (
              <div
                key={tc.id}
                className={
                  isLinked
                    ? 'trace-board__link trace-board__link--on'
                    : 'trace-board__link'
                }
              />
            )
          })}
        </div>

        <div className="trace-board__col">
          <h3 className="trace-board__col-title">{testCasesLabel}</h3>
          <ul className="trace-board__list">
            {testCases.map((tc) => {
              const isLinked = linked.has(tc.id)
              return (
                <li key={tc.id}>
                  <div
                    className={
                      isLinked
                        ? 'trace-board__card trace-board__card--linked'
                        : 'trace-board__card trace-board__card--dim'
                    }
                  >
                    <span className="trace-board__id">{tc.id}</span>
                    <span>{tc.label}</span>
                    {tc.type ? <span className="trace-board__type">{tc.type}</span> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
