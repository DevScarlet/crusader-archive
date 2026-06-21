import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ConfirmationDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  confirmClassName?: string
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmationDialog({
  title,
  children,
  confirmLabel,
  confirmClassName = '',
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="confirmation-dialog-title">{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">
          <button type="button" className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={confirmClassName}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog
