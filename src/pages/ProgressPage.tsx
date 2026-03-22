import { useMemo } from 'react'
import type { Term, Category, Progress } from '../types'
import styles from './ProgressPage.module.css'

interface Props {
  terms: Term[]
  categories: Category[]
  progress: Progress
  onReset: () => void
}

export function ProgressPage({ terms, categories, progress, onReset }: Props) {
  const studiedCount = Object.keys(progress).length
  const totalCount = terms.length

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catTerms = terms.filter(t => t.majorCategoryId === cat.id)
      let correct = 0
      let total = 0
      for (const t of catTerms) {
        const p = progress[t.id]
        if (p) {
          correct += p.correct
          total += p.total
        }
      }
      const rate = total > 0 ? Math.round((correct / total) * 100) : null
      return { ...cat, rate, studied: catTerms.filter(t => progress[t.id]).length, total: catTerms.length }
    })
  }, [categories, terms, progress])

  const weakTerms = useMemo(() => {
    return terms
      .filter(t => {
        const p = progress[t.id]
        return p && p.total >= 1
      })
      .map(t => {
        const p = progress[t.id]
        return { term: t, rate: Math.round((p.correct / p.total) * 100) }
      })
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 20)
  }, [terms, progress])

  const handleReset = () => {
    if (window.confirm('進捗データをすべてリセットしますか？')) {
      onReset()
    }
  }

  return (
    <div>
      <h1 className={styles.title}>進捗</h1>

      <div className={styles.overall}>
        <div className={styles.overallText}>
          全体: {studiedCount} / {totalCount} 学習済
        </div>
        <div className={styles.bar}>
          <div
            className={styles.barFill}
            style={{ width: `${(studiedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>大分類別</div>
        {categoryStats.map(cat => (
          <div key={cat.id} className={styles.catRow}>
            <div className={styles.catName}>{cat.name}</div>
            <div className={styles.catInfo}>
              {cat.rate !== null ? `${cat.rate}%` : '-'}
              <span className={styles.catCount}>
                ({cat.studied}/{cat.total})
              </span>
            </div>
          </div>
        ))}
      </div>

      {weakTerms.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>苦手用語</div>
          {weakTerms.map(({ term, rate }) => (
            <div key={term.id} className={styles.weakRow}>
              <div className={styles.weakName}>{term.name}</div>
              <div className={styles.weakRate}>{rate}%</div>
            </div>
          ))}
        </div>
      )}

      <button className={styles.resetBtn} onClick={handleReset}>
        進捗リセット
      </button>
    </div>
  )
}
