import { useState } from 'react'
import type { Term, TermProgress } from '../types'
import styles from './WordCard.module.css'

interface Props {
  term: Term
  progress: TermProgress | null
}

export function WordCard({ term, progress }: Props) {
  const [expanded, setExpanded] = useState(false)

  const rate =
    progress && progress.total > 0
      ? Math.round((progress.correct / progress.total) * 100)
      : null

  return (
    <div className={styles.card} onClick={() => setExpanded(!expanded)}>
      <div className={styles.header}>
        <div className={styles.name}>{term.name}</div>
        {rate !== null && <span className={styles.rate}>{rate}%</span>}
      </div>
      <div className={styles.sub}>
        {term.reading}
        {term.english && ` / ${term.english}`}
      </div>
      {expanded && <div className={styles.description}>{term.description}</div>}
    </div>
  )
}
