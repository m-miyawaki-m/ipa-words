import { useState } from 'react'
import type { Term, QuizDirection } from '../types'
import styles from './MultipleChoice.module.css'

interface Props {
  term: Term
  choices: Term[]
  direction: QuizDirection
  onAnswer: (correct: boolean) => void
}

export function MultipleChoice({ term, choices, direction, onAnswer }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const question =
    direction === 'term-to-meaning' ? term.name : term.description
  const questionSub =
    direction === 'term-to-meaning'
      ? `${term.reading}${term.english ? ` / ${term.english}` : ''}`
      : ''

  const getChoiceLabel = (choice: Term) => {
    if (direction === 'term-to-meaning') {
      return choice.description.length > 80
        ? choice.description.slice(0, 80) + '...'
        : choice.description
    }
    return choice.name
  }

  const handleSelect = (choiceId: number) => {
    if (selectedId !== null) return
    setSelectedId(choiceId)
  }

  const getChoiceStyle = (choice: Term) => {
    if (selectedId === null) return styles.choice
    if (choice.id === term.id) return `${styles.choice} ${styles.correct}`
    if (choice.id === selectedId) return `${styles.choice} ${styles.wrong}`
    return `${styles.choice} ${styles.disabled}`
  }

  return (
    <div className={styles.container}>
      <div className={styles.question}>{question}</div>
      {questionSub && <div className={styles.sub}>{questionSub}</div>}

      <div className={styles.choices}>
        {choices.map(choice => (
          <button
            key={choice.id}
            className={getChoiceStyle(choice)}
            onClick={() => handleSelect(choice.id)}
          >
            {getChoiceLabel(choice)}
          </button>
        ))}
      </div>

      {selectedId !== null && (
        <button
          className={styles.nextBtn}
          onClick={() => onAnswer(selectedId === term.id)}
        >
          次へ
        </button>
      )}
    </div>
  )
}
