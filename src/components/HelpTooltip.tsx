import { useId, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'
import type { GlossaryEntry } from '../data/glossary'

interface HelpTooltipProps {
  entry: GlossaryEntry
}

function HelpTooltip({ entry }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipId = useId()

  function handleBlur(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      event.currentTarget.blur()
    }
  }

  return (
    <span className="help-tooltip" onBlur={handleBlur}>
      <button
        type="button"
        className="help-tooltip__button"
        aria-label={`Learn about ${entry.title}`}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      >
        ?
      </button>

      {isOpen && (
        <span className="help-tooltip__content" id={tooltipId} role="tooltip">
          <strong>{entry.title}</strong>
          <span>{entry.description}</span>
        </span>
      )}
    </span>
  )
}

export default HelpTooltip
