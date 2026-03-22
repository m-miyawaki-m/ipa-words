import { useState } from 'react'
import type { Term, TermProgress } from '../types'
import styles from './WordCard.module.css'

interface Props {
  term: Term
  progress: TermProgress | null
}

function getStatus(progress: TermProgress | null) {
  if (!progress || progress.total === 0) return 'new'
  const rate = progress.correct / progress.total
  return rate >= 0.8 ? 'mastered' : 'learning'
}

export function WordCard({ term, progress }: Props) {
  const [expanded, setExpanded] = useState(false)

  const status = getStatus(progress)
  const rate =
    progress && progress.total > 0
      ? Math.round((progress.correct / progress.total) * 100)
      : null

  return (
    <div className={styles.card} onClick={() => setExpanded(!expanded)}>
      <div className={styles.body}>
        <div className={`${styles.status} ${styles[status]}`}>
          {status === 'mastered' ? '覚えた' : status === 'learning' ? '学習中' : '未学習'}
        </div>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.name}>{term.name}</div>
            {rate !== null && <span className={styles.rate}>{rate}%</span>}
          </div>
          <div className={styles.sub}>
            {term.reading}
            {term.english && ` / ${term.english}`}
          </div>
        </div>
      </div>
      {expanded && (
        <div className={styles.description}>
          <div className={styles.category}>{term.category} › {term.subcategory}</div>
          {term.description}
        </div>
      )}
    </div>
  )
}
