import type { Term, QuizAnswer } from '../types'
import styles from './QuizResult.module.css'

interface Props {
  answers: QuizAnswer[]
  quizTerms: Term[]
  onRetry: () => void
  onBackToSettings: () => void
}

export function QuizResult({
  answers,
  quizTerms,
  onRetry,
  onBackToSettings,
}: Props) {
  const correctCount = answers.filter(a => a.correct).length
  const totalCount = answers.length
  const rate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  const missedTerms = answers
    .filter(a => !a.correct)
    .map(a => quizTerms.find(t => t.id === a.termId))
    .filter((t): t is Term => t !== undefined)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>結果</h1>

      <div className={styles.score}>
        <div className={styles.scoreNumber}>
          {correctCount} / {totalCount} 正解
        </div>
        <div className={styles.scoreRate}>正答率 {rate}%</div>
      </div>

      {missedTerms.length > 0 && (
        <div className={styles.missed}>
          <div className={styles.missedTitle}>間違えた問題</div>
          {missedTerms.map(term => (
            <div key={term.id} className={styles.missedItem}>
              {term.name}
            </div>
          ))}
        </div>
      )}

      <div className={styles.buttons}>
        <button className={styles.retryBtn} onClick={onRetry}>
          もう一度
        </button>
        <button className={styles.backBtn} onClick={onBackToSettings}>
          設定に戻る
        </button>
      </div>
    </div>
  )
}
