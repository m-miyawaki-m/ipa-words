import { useState, useMemo, useCallback } from 'react'
import type { Term, QuizSettings, QuizAnswer } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function useQuiz(allTerms: Term[]) {
  const [settings, setSettings] = useState<QuizSettings | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [isFinished, setIsFinished] = useState(false)

  // 出題対象の用語リスト（設定確定時にシャッフル）
  const [quizTerms, setQuizTerms] = useState<Term[]>([])

  const startQuiz = useCallback(
    (newSettings: QuizSettings) => {
      let pool = allTerms

      if (newSettings.majorCategoryId) {
        pool = pool.filter(
          t => t.majorCategoryId === newSettings.majorCategoryId
        )
      }
      if (newSettings.minorCategoryId) {
        pool = pool.filter(
          t => t.minorCategoryId === newSettings.minorCategoryId
        )
      }

      const shuffled = shuffle(pool)
      const count =
        newSettings.count === 'all'
          ? shuffled.length
          : Math.min(newSettings.count, shuffled.length)

      setQuizTerms(shuffled.slice(0, count))
      setSettings(newSettings)
      setCurrentIndex(0)
      setAnswers([])
      setIsFinished(false)
    },
    [allTerms]
  )

  const currentTerm = quizTerms[currentIndex] || null

  // 4択の選択肢を生成（同じ中分類から優先）
  const choices = useMemo<Term[]>(() => {
    if (!currentTerm || !settings || settings.format !== 'multiple-choice') {
      return []
    }

    const sameCategory = allTerms.filter(
      t =>
        t.minorCategoryId === currentTerm.minorCategoryId &&
        t.id !== currentTerm.id
    )
    const otherCategory = allTerms.filter(
      t =>
        t.minorCategoryId !== currentTerm.minorCategoryId &&
        t.id !== currentTerm.id
    )

    let wrongChoices: Term[]
    if (sameCategory.length >= 3) {
      wrongChoices = shuffle(sameCategory).slice(0, 3)
    } else {
      wrongChoices = [
        ...shuffle(sameCategory),
        ...shuffle(otherCategory).slice(0, 3 - sameCategory.length),
      ]
    }

    return shuffle([currentTerm, ...wrongChoices])
  }, [currentTerm, settings, allTerms])

  const answerQuestion = useCallback(
    (correct: boolean) => {
      if (!currentTerm) return

      const newAnswers = [...answers, { termId: currentTerm.id, correct }]
      setAnswers(newAnswers)

      if (currentIndex + 1 >= quizTerms.length) {
        setIsFinished(true)
      } else {
        setCurrentIndex(currentIndex + 1)
      }
    },
    [currentTerm, answers, currentIndex, quizTerms.length]
  )

  const resetQuiz = useCallback(() => {
    setSettings(null)
    setQuizTerms([])
    setCurrentIndex(0)
    setAnswers([])
    setIsFinished(false)
  }, [])

  return {
    settings,
    currentTerm,
    currentIndex,
    totalCount: quizTerms.length,
    choices,
    answers,
    isFinished,
    quizTerms,
    startQuiz,
    answerQuestion,
    resetQuiz,
  }
}
