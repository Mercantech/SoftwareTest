import { useEffect, useMemo, useState } from 'react'

export type WorkshopScenario = {
  id: string
  title: string
  type: string
  input: string
  expected: string
  tcId: string
}

export type WorkshopChecklistItem = {
  id: string
  label: string
}

type WorkshopPanelProps = {
  storageKey: string
  requirementId: string
  requirementText: string
  scenarios: WorkshopScenario[]
  checklist: WorkshopChecklistItem[]
  labels: {
    title: string
    lead: string
    pickScenarios: string
    selected: string
    coverage: string
    of: string
    testCases: string
    checklistTitle: string
    reset: string
    input: string
    expected: string
    type: string
  }
}

type StoredState = {
  selected: string[]
  checked: string[]
}

function readStored(key: string): StoredState {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { selected: [], checked: [] }
    const parsed = JSON.parse(raw) as StoredState
    return {
      selected: Array.isArray(parsed.selected) ? parsed.selected : [],
      checked: Array.isArray(parsed.checked) ? parsed.checked : [],
    }
  } catch {
    return { selected: [], checked: [] }
  }
}

export default function WorkshopPanel({
  storageKey,
  requirementId,
  requirementText,
  scenarios,
  checklist,
  labels,
}: WorkshopPanelProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [checked, setChecked] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStored(storageKey)
    setSelected(stored.selected)
    setChecked(stored.checked)
    setHydrated(true)
  }, [storageKey])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ selected, checked }))
    } catch {
      /* ignore */
    }
  }, [storageKey, selected, checked, hydrated])

  const selectedScenarios = useMemo(
    () => scenarios.filter((s) => selected.includes(s.id)),
    [scenarios, selected],
  )

  function toggleScenario(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleCheck(id: string) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function reset() {
    setSelected([])
    setChecked([])
  }

  return (
    <section className="workshop-panel" aria-labelledby="workshop-title">
      <header className="workshop-panel__header">
        <div>
          <h2 id="workshop-title">{labels.title}</h2>
          <p>{labels.lead}</p>
        </div>
        <button type="button" className="workshop-panel__reset" onClick={reset}>
          {labels.reset}
        </button>
      </header>

      <div className="workshop-panel__requirement">
        <span className="workshop-panel__req-id">{requirementId}</span>
        <p>{requirementText}</p>
      </div>

      <div className="workshop-panel__stats">
        <div>
          <span className="workshop-panel__stat-label">{labels.selected}</span>
          <strong>
            {selected.length} {labels.of} {scenarios.length}
          </strong>
        </div>
        <div>
          <span className="workshop-panel__stat-label">{labels.coverage}</span>
          <strong>{Math.round((selected.length / scenarios.length) * 100) || 0}%</strong>
        </div>
      </div>

      <h3>{labels.pickScenarios}</h3>
      <div className="workshop-panel__scenario-grid">
        {scenarios.map((scenario) => {
          const on = selected.includes(scenario.id)
          return (
            <button
              key={scenario.id}
              type="button"
              className={
                on
                  ? 'workshop-panel__scenario workshop-panel__scenario--on'
                  : 'workshop-panel__scenario'
              }
              aria-pressed={on}
              onClick={() => toggleScenario(scenario.id)}
            >
              <span className="workshop-panel__scenario-type">{scenario.type}</span>
              <span className="workshop-panel__scenario-title">{scenario.title}</span>
            </button>
          )
        })}
      </div>

      <h3>{labels.testCases}</h3>
      {selectedScenarios.length === 0 ? (
        <p className="workshop-panel__empty">{labels.pickScenarios}</p>
      ) : (
        <div className="workshop-panel__tc-grid">
          {selectedScenarios.map((scenario) => (
            <article key={scenario.id} className="workshop-panel__tc animate-fade-up">
              <header>
                <span className="workshop-panel__tc-id">{scenario.tcId}</span>
                <span className="workshop-panel__tc-type">{scenario.type}</span>
              </header>
              <h4>{scenario.title}</h4>
              <dl>
                <div>
                  <dt>{labels.input}</dt>
                  <dd>
                    <code>{scenario.input}</code>
                  </dd>
                </div>
                <div>
                  <dt>{labels.expected}</dt>
                  <dd>{scenario.expected}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      <div className="workshop-panel__trace-preview" aria-hidden={selected.length === 0}>
        <div className="workshop-panel__trace-req">{requirementId}</div>
        <div className="workshop-panel__trace-lines">
          {selectedScenarios.map((s) => (
            <div key={s.id} className="workshop-panel__trace-line">
              <span />
              <em>{s.tcId}</em>
            </div>
          ))}
        </div>
      </div>

      <h3>{labels.checklistTitle}</h3>
      <ul className="workshop-panel__checklist">
        {checklist.map((item) => {
          const on = checked.includes(item.id)
          return (
            <li key={item.id}>
              <label className={on ? 'workshop-panel__check workshop-panel__check--on' : 'workshop-panel__check'}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleCheck(item.id)}
                />
                <span>{item.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
