import { useState, useCallback } from 'react'
import type { Progress, TermProgress } from '../types'

const STORAGE_KEY = 'ipa-words-progress'

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress)

  const recordAnswer = useCallback((termId: number, correct: boolean) => {
    setProgress(prev => {
      const entry = prev[termId] || { correct: 0, total: 0 }
      const next: Progress = {
        ...prev,
        [termId]: {
          correct: entry.correct + (correct ? 1 : 0),
          total: entry.total + 1,
        },
      }
      saveProgress(next)
      return next
    })
  }, [])

  const getProgress = useCallback(
    (termId: number): TermProgress | null => {
      return progress[termId] || null
    },
    [progress]
  )

  const resetProgress = useCallback(() => {
    setProgress({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { progress, recordAnswer, getProgress, resetProgress }
}
