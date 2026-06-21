import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ARMY_PLANNER_TOAST_EVENT,
  type ArmyPlannerToast,
} from '../hooks/useArmyPlanner'

function isArmyPlannerToast(value: unknown): value is ArmyPlannerToast {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const toast = value as Record<string, unknown>

  return typeof toast.message === 'string'
}

function Toast() {
  const [toast, setToast] = useState<ArmyPlannerToast | null>(null)

  useEffect(() => {
    function handleToast(event: Event) {
      if (!(event instanceof CustomEvent) || !isArmyPlannerToast(event.detail)) {
        return
      }

      setToast(event.detail)
    }

    window.addEventListener(ARMY_PLANNER_TOAST_EVENT, handleToast)

    return () => {
      window.removeEventListener(ARMY_PLANNER_TOAST_EVENT, handleToast)
    }
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timeoutId = window.setTimeout(() => setToast(null), 4500)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  if (!toast) {
    return null
  }

  return (
    <div className="toast" role="status" aria-live="polite">
      <p>{toast.message}</p>
      <div className="toast__actions">
        {toast.actionLabel && toast.actionTo && (
          <Link to={toast.actionTo}>{toast.actionLabel}</Link>
        )}
        <button type="button" onClick={() => setToast(null)}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

export default Toast
