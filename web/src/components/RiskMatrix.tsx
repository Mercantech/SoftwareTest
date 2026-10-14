import { useState } from 'react'

export type RiskLevel = 1 | 2 | 3 | 4 | 5

export type RiskItem = {
  id: string
  title: string
  likelihood: RiskLevel
  impact: RiskLevel
  mitigation: string
}

type RiskMatrixProps = {
  risks: RiskItem[]
  likelihoodLabel: string
  impactLabel: string
  emptyLabel: string
  scoreLabel: string
  mitigationLabel: string
  tryLabel?: string
  tryHint?: string
  priorityHint?: string
  ariaLabel?: string
}

function scoreClass(score: number): string {
  if (score >= 16) return 'risk-matrix__cell--critical'
  if (score >= 9) return 'risk-matrix__cell--high'
  if (score >= 4) return 'risk-matrix__cell--mid'
  return 'risk-matrix__cell--low'
}

function priorityFor(score: number, labels?: { high: string; mid: string; low: string }) {
  if (!labels) return null
  if (score >= 12) return labels.high
  if (score >= 6) return labels.mid
  return labels.low
}

export default function RiskMatrix({
  risks,
  likelihoodLabel,
  impactLabel,
  emptyLabel,
  scoreLabel,
  mitigationLabel,
  tryLabel,
  tryHint,
  priorityHint,
  ariaLabel,
}: RiskMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(risks[0]?.id ?? null)
  const [tryL, setTryL] = useState<RiskLevel>(3)
  const [tryI, setTryI] = useState<RiskLevel>(4)
  const active = risks.find((r) => r.id === activeId) ?? null
  const levels: RiskLevel[] = [1, 2, 3, 4, 5]
  const tryScore = tryL * tryI

  const priorityLabels = priorityHint
    ? {
        high: priorityHint.split('|')[0] ?? '',
        mid: priorityHint.split('|')[1] ?? '',
        low: priorityHint.split('|')[2] ?? '',
      }
    : undefined

  return (
    <div className="risk-matrix" role="group" aria-label={ariaLabel}>
      <div className="risk-matrix__scroll">
        <table className="risk-matrix__table">
          <caption className="visually-hidden">{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">{likelihoodLabel}</span>
              </th>
              {levels.map((impact) => (
                <th key={`h-${impact}`} scope="col">
                  {impact}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...levels].reverse().map((likelihood) => (
              <tr key={`row-${likelihood}`}>
                <th scope="row">{likelihood}</th>
                {levels.map((impact) => {
                  const cellRisks = risks.filter(
                    (r) => r.likelihood === likelihood && r.impact === impact,
                  )
                  const score = likelihood * impact
                  const isTryCell = tryL === likelihood && tryI === impact
                  const isActiveCell =
                    active !== null &&
                    active.likelihood === likelihood &&
                    active.impact === impact
                  return (
                    <td
                      key={`${likelihood}-${impact}`}
                      className={[
                        'risk-matrix__cell',
                        scoreClass(score),
                        isTryCell ? 'risk-matrix__cell--try' : '',
                        isActiveCell ? 'risk-matrix__cell--focus' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {cellRisks.length === 0 ? (
                        <span className="risk-matrix__score">{score}</span>
                      ) : (
                        cellRisks.map((risk) => (
                          <button
                            key={risk.id}
                            type="button"
                            className={
                              risk.id === activeId
                                ? 'risk-matrix__chip risk-matrix__chip--active'
                                : 'risk-matrix__chip'
                            }
                            aria-pressed={risk.id === activeId}
                            onClick={() => {
                              setActiveId(risk.id)
                              setTryL(risk.likelihood)
                              setTryI(risk.impact)
                            }}
                          >
                            {risk.title}
                          </button>
                        ))
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="risk-matrix__legend">
          <span>{likelihoodLabel} ↑</span>
          <span>{impactLabel} →</span>
        </p>
      </div>

      <div className="risk-matrix__side">
        <div className="risk-matrix__detail">
          {active ? (
            <>
              <h3>{active.title}</h3>
              <p className="risk-matrix__meta">
                {scoreLabel}: {active.likelihood} × {active.impact} ={' '}
                <strong>{active.likelihood * active.impact}</strong>
              </p>
              <p>
                <span className="risk-matrix__label">{mitigationLabel}</span>
                {active.mitigation}
              </p>
            </>
          ) : (
            <p className="risk-matrix__empty">{emptyLabel}</p>
          )}
        </div>

        {tryLabel ? (
          <div className="risk-matrix__try">
            <h3>{tryLabel}</h3>
            {tryHint ? <p className="risk-matrix__try-hint">{tryHint}</p> : null}
            <div className="risk-matrix__dials">
              <div>
                <span className="risk-matrix__label">{likelihoodLabel}</span>
                <div className="risk-matrix__dial" role="group" aria-label={likelihoodLabel}>
                  {levels.map((n) => (
                    <button
                      key={`l-${n}`}
                      type="button"
                      className={tryL === n ? 'active' : undefined}
                      aria-pressed={tryL === n}
                      onClick={() => setTryL(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="risk-matrix__label">{impactLabel}</span>
                <div className="risk-matrix__dial" role="group" aria-label={impactLabel}>
                  {levels.map((n) => (
                    <button
                      key={`i-${n}`}
                      type="button"
                      className={tryI === n ? 'active' : undefined}
                      aria-pressed={tryI === n}
                      onClick={() => setTryI(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className={`risk-matrix__try-score ${scoreClass(tryScore)}`}>
              {tryL} × {tryI} = <strong>{tryScore}</strong>
              {priorityLabels ? (
                <span className="risk-matrix__priority">
                  {priorityFor(tryScore, priorityLabels)}
                </span>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
