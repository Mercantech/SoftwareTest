import type { ObjectiveLevel } from '../data/objectives'

type ObjectiveBadgeProps = {
  level: ObjectiveLevel
}

export default function ObjectiveBadge({ level }: ObjectiveBadgeProps) {
  const className =
    level === 'H3' ? 'objective-badge objective-badge--h3' : 'objective-badge objective-badge--h4'
  return (
    <span className={className} title={`Målpinde niveau ${level}`}>
      {level}
    </span>
  )
}
