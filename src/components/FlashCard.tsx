import { useState } from 'react'
import type { Term, QuizDirection } from '../types'
import styles from './FlashCard.module.css'

interface Props {
  term: Term
  direction: QuizDirection
  onAnswer: (correct: boolean) => void
}

export function FlashCard({ term, direction, onAnswer }: Props) {
  const [revealed, setRevealed] = useState(false)

  const question =
    direction === 'term-to-meaning' ? term.name : term.description
  const questionSub =
    direction === 'term-to-meaning'
      ? `${term.reading}${term.english ? ` / ${term.english}` : ''}`
      : ''

  return (
    <div className={styles.container}>
      <div
        className={styles.card}
        onClick={() => !revealed && setRevealed(true)}
      >
        <div className={styles.question}>{question}</div>
        {questionSub && <div className={styles.sub}>{questionSub}</div>}
        {!revealed && <div className={styles.hint}>タップで表示</div>}
        {revealed && (
          <div className={styles.answer}>
            {direction === 'term-to-meaning' ? (
              <p>{term.description}</p>
            ) : (
              <>
                <p className={styles.answerName}>{term.name}</p>
                <p className={styles.answerSub}>
                  {term.reading}
                  {term.english ? ` / ${term.english}` : ''}
                </p>
              </>
            )}
          </div>
        )}
      </div>
      {revealed && (
        <div className={styles.buttons}>
          <button
            className={`${styles.btn} ${styles.btnWrong}`}
            onClick={() => onAnswer(false)}
          >
            まだ
          </button>
          <button
            className={`${styles.btn} ${styles.btnCorrect}`}
            onClick={() => onAnswer(true)}
          >
            覚えた
          </button>
        </div>
      )}
    </div>
  )
}
