import { useId, useRef, useState } from 'react'
import type {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import type { GlossaryEntry } from '../data/glossary'

interface HelpTooltipProps {
  entry: GlossaryEntry
  triggerText?: string
}

interface TooltipPosition {
  left: number
  top: number
  placement: 'above' | 'below'
}

function HelpTooltip({ entry, triggerText }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const isPointerInteraction = useRef(false)
  const tooltipId = useId()

  function openTooltip(button: HTMLButtonElement) {
    const buttonBounds = button.getBoundingClientRect()
    const tooltipWidth = Math.min(260, window.innerWidth - 32)
    const left = Math.min(
      Math.max(buttonBounds.left + buttonBounds.width / 2 - tooltipWidth / 2, 16),
      window.innerWidth - tooltipWidth - 16,
    )
    const hasRoomBelow = buttonBounds.bottom + 150 < window.innerHeight

    setPosition({
      left,
      top: hasRoomBelow ? buttonBounds.bottom + 8 : buttonBounds.top - 8,
      placement: hasRoomBelow ? 'below' : 'above',
    })
    setIsOpen(true)
  }

  function handleBlur(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false)
      isPointerInteraction.current = false
    }
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isOpen) {
      setIsOpen(false)
    } else {
      openTooltip(event.currentTarget)
    }

    isPointerInteraction.current = false
  }

  function handleFocus(event: FocusEvent<HTMLButtonElement>) {
    if (!isPointerInteraction.current) {
      openTooltip(event.currentTarget)
    }
  }

  function handlePointerDown() {
    isPointerInteraction.current = true
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
    <span className="help-tooltip" onBlur={handleBlur}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={`Learn about ${entry.title}`}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
      >
        {triggerText ?? '?'}
      </button>

      {isOpen &&
        position &&
        createPortal(
          <span
            className={`help-tooltip__content help-tooltip__content--${position.placement}`}
            id={tooltipId}
            role="tooltip"
            style={{ left: position.left, top: position.top }}
          >
            <strong>{entry.title}</strong>
            <span>{entry.description}</span>
          </span>,
          document.body,
        )}
    </span>
  )
}

export default HelpTooltip
