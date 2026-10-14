import ObjectiveBadge from './ObjectiveBadge'
import type { ObjectiveLevel } from '../data/objectives'

export type SectionMapItem = {
  /** What the learner should be able to do */
  goal: string
  /** DOM id of the target section (without #) */
  sectionId: string
  /** Short label shown as the link target */
  sectionLabel: string
}

type ObjectiveSectionMapProps = {
  level: ObjectiveLevel
  objectiveId: number
  objectiveLabel: string
  objectiveText: string
  mapTitle: string
  mapLead?: string
  items: SectionMapItem[]
}

export default function ObjectiveSectionMap({
  level,
  objectiveId,
  objectiveLabel,
  objectiveText,
  mapTitle,
  mapLead,
  items,
}: ObjectiveSectionMapProps) {
  return (
    <section className="objective-map" aria-labelledby="objective-map-title">
      <div className="objective-map__mandate">
        <p className="objective-map__badge-row">
          <ObjectiveBadge level={level} />{' '}
          <strong>
            {objectiveLabel} {objectiveId}
          </strong>
        </p>
        <p className="objective-map__text">{objectiveText}</p>
      </div>

      <h2 id="objective-map-title">{mapTitle}</h2>
      {mapLead ? <p className="objective-map__lead">{mapLead}</p> : null}

      <ol className="objective-map__list">
        {items.map((item) => (
          <li key={item.sectionId + item.goal}>
            <div className="objective-map__goal">{item.goal}</div>
            <a className="objective-map__jump" href={`#${item.sectionId}`}>
              <span className="objective-map__jump-label">{item.sectionLabel}</span>
              <span className="objective-map__jump-arrow" aria-hidden>
                →
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
