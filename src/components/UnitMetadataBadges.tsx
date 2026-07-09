import type { UnitMetadata } from '../types/unitMetadata'

interface UnitMetadataBadgesProps {
  metadata: UnitMetadata
  compact?: boolean
  maxTags?: number
}

function UnitMetadataBadges({
  metadata,
  compact = false,
  maxTags = metadata.tags.length,
}: UnitMetadataBadgesProps) {
  const hasNote = metadata.note.trim().length > 0

  if (!hasNote && metadata.tags.length === 0) {
    return null
  }

  const visibleTags = metadata.tags.slice(0, maxTags)
  const remainingTagCount = metadata.tags.length - visibleTags.length

  return (
    <div
      className={
        compact
          ? 'unit-metadata-badges unit-metadata-badges--compact'
          : 'unit-metadata-badges'
      }
      aria-label="Personal unit metadata"
    >
      {hasNote && <span className="unit-note-indicator">Note</span>}
      {visibleTags.map((tag) => (
        <span className="unit-tag-chip" key={tag}>
          {tag}
        </span>
      ))}
      {remainingTagCount > 0 && (
        <span className="unit-tag-chip">+{remainingTagCount}</span>
      )}
    </div>
  )
}

export default UnitMetadataBadges
