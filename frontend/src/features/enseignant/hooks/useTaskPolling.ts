import { useState, useEffect, useCallback, useRef } from 'react'
import { qcmService } from '../services/qcm.service'
import type { TaskStatus } from '../types/enseignant.types'

interface UseTaskPollingOptions {
  taskId: string | null
  interval?: number // intervalle de polling en ms (défaut: 2000)
  timeout?: number // timeout total en ms (défaut: 60000 = 1 minute)
  estimatedDurationSeconds?: number // Durée estimée en secondes
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  onTimeout?: () => void
}

export function useTaskPolling({
  taskId,
  interval = 2000,
  timeout = 60000,
  estimatedDurationSeconds,
  onSuccess,
  onError,
  onTimeout,
}: UseTaskPollingOptions) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [estimatedRemainingSeconds, setEstimatedRemainingSeconds] = useState<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  const checkTaskStatus = useCallback(async () => {
    if (!taskId) return

    try {
      const status = await qcmService.getTaskStatus(taskId)
      setTaskStatus(status)

      // Utiliser le progress réel du backend si disponible, sinon fallback sur calcul temporel
      if (status.status === 'PROGRESS' && status.result?.progress !== undefined) {
        // Progress réel depuis le backend (0-100)
        setProgress(status.result.progress)
        
        // Mettre à jour l'estimation de temps restant
        if (status.result.estimated_remaining_seconds !== undefined) {
          setEstimatedRemainingSeconds(status.result.estimated_remaining_seconds)
        } else if (estimatedDurationSeconds && status.result.elapsed_seconds !== undefined) {
          // Calculer le temps restant basé sur la progression
          const remaining = estimatedDurationSeconds - status.result.elapsed_seconds
          setEstimatedRemainingSeconds(Math.max(0, remaining))
        }
      } else if (status.status === 'SUCCESS') {
        setProgress(100)
        setEstimatedRemainingSeconds(0)
        cleanup()
        onSuccess?.(status.result)
      } else if (status.status === 'FAILURE') {
        cleanup()
        onError?.(status.error || 'Erreur lors de la génération')
      } else if (status.status === 'PENDING') {
        // Pendant l'attente, utiliser un calcul temporel minimal
        const elapsed = Date.now() - startTimeRef.current
        const progressPercent = Math.min((elapsed / timeout) * 10, 5) // Max 5% pendant PENDING
        setProgress(progressPercent)
        
        // Initialiser l'estimation si disponible
        if (estimatedDurationSeconds) {
          setEstimatedRemainingSeconds(estimatedDurationSeconds)
        }
      } else {
        // Fallback: calcul basé sur le temps écoulé
        const elapsed = Date.now() - startTimeRef.current
        const progressPercent = Math.min((elapsed / timeout) * 100, 95)
        setProgress(progressPercent)
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification du statut de la tâche:', error)
      cleanup()
      onError?.(error.message || 'Erreur lors de la vérification du statut')
    }
  }, [taskId, timeout, onSuccess, onError, cleanup])

  useEffect(() => {
    if (!taskId) {
      cleanup()
      setTaskStatus(null)
      setProgress(0)
      return
    }

    setIsPolling(true)
    startTimeRef.current = Date.now()

    // Vérifier immédiatement
    checkTaskStatus()

    // Configurer le polling
    intervalRef.current = setInterval(checkTaskStatus, interval)

    // Configurer le timeout
    timeoutRef.current = setTimeout(() => {
      cleanup()
      onTimeout?.()
      onError?.('Timeout: la génération a pris trop de temps')
    }, timeout)

    return cleanup
  }, [taskId, interval, timeout, checkTaskStatus, cleanup, onTimeout, onError])

  return {
    taskStatus,
    isPolling,
    progress,
    estimatedRemainingSeconds,
  }
}
