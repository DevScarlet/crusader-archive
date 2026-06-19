import { useEffect, useId, useRef, useState } from 'react'
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
}

function HelpTooltip({ entry, triggerText }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const isPointerInteraction = useRef(false)
  const tooltipId = useId()

  useEffect(() => {
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (
        event.target instanceof Node &&
        !wrapperRef.current?.contains(event.target) &&
        !tooltipRef.current?.contains(event.target)
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

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function closeOnScroll() {
      setIsOpen(false)
    }

    window.addEventListener('scroll', closeOnScroll, true)

    return () => {
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [isOpen])

  function positionTooltip(button: HTMLButtonElement) {
    const buttonBounds = button.getBoundingClientRect()
    const tooltipWidth = Math.min(260, window.innerWidth - 32)
    const estimatedTooltipHeight = 140
    const rightSideLeft = buttonBounds.right + 8
    const leftSideLeft = buttonBounds.left - tooltipWidth - 8
    const hasRoomOnRight = rightSideLeft + tooltipWidth <= window.innerWidth - 16
    const hasRoomOnLeft = leftSideLeft >= 16
    const left = hasRoomOnRight
      ? rightSideLeft
      : hasRoomOnLeft
        ? leftSideLeft
        : Math.min(
            Math.max(buttonBounds.left, 16),
            window.innerWidth - tooltipWidth - 16,
          )

    setPosition({
      left,
      top: Math.min(
        Math.max(buttonBounds.top - 8, 16),
        window.innerHeight - estimatedTooltipHeight - 16,
      ),
    })
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
      positionTooltip(event.currentTarget)
      setIsOpen(true)
    }

    isPointerInteraction.current = false
  }

  function handleFocus(event: FocusEvent<HTMLButtonElement>) {
    if (!isPointerInteraction.current) {
      positionTooltip(event.currentTarget)
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

      {isOpen &&
        position &&
        createPortal(
          <span
            className="help-tooltip__content"
            id={tooltipId}
            ref={tooltipRef}
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
