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
  ariaLabel?: string
}

function scoreClass(score: number): string {
  if (score >= 16) return 'risk-matrix__cell--critical'
  if (score >= 9) return 'risk-matrix__cell--high'
  if (score >= 4) return 'risk-matrix__cell--mid'
  return 'risk-matrix__cell--low'
}

export default function RiskMatrix({
  risks,
  likelihoodLabel,
  impactLabel,
  emptyLabel,
  scoreLabel,
  mitigationLabel,
  ariaLabel,
}: RiskMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(risks[0]?.id ?? null)
  const active = risks.find((r) => r.id === activeId) ?? null
  const levels: RiskLevel[] = [1, 2, 3, 4, 5]

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
                  return (
                    <td
                      key={`${likelihood}-${impact}`}
                      className={`risk-matrix__cell ${scoreClass(score)}`}
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
                            onClick={() => setActiveId(risk.id)}
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
    </div>
  )
}
