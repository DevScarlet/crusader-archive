import { useEffect, useId, useRef, useState } from 'react'
import type {
  FocusEvent,
  KeyboardEvent,
} from 'react'
import type { GlossaryEntry } from '../data/glossary'

interface HelpTooltipProps {
  entry: GlossaryEntry
  triggerText?: string
}

function HelpTooltip({ entry, triggerText }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const isPointerInteraction = useRef(false)
  const tooltipId = useId()

  useEffect(() => {
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (
        event.target instanceof Node &&
        !wrapperRef.current?.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function handleBlur(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false)
      isPointerInteraction.current = false
    }
  }

  function handleClick() {
    setIsOpen((currentIsOpen) => !currentIsOpen)
    isPointerInteraction.current = false
  }

  function handleFocus() {
    if (!isPointerInteraction.current) {
      setIsOpen(true)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const buttonClassName = triggerText
    ? 'help-tooltip__button help-tooltip__button--text'
    : 'help-tooltip__button help-tooltip__button--icon'

  return (
    <span className="help-tooltip" onBlur={handleBlur} ref={wrapperRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={`Learn about ${entry.title}`}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onPointerDown={() => {
          isPointerInteraction.current = true
        }}
      >
        {triggerText ?? '?'}
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
