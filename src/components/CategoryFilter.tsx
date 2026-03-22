import type { Category } from '../types'
import styles from './CategoryFilter.module.css'

interface Props {
  categories: Category[]
  majorCategoryId: string
  minorCategoryId: string
  onMajorChange: (id: string) => void
  onMinorChange: (id: string) => void
}

export function CategoryFilter({
  categories,
  majorCategoryId,
  minorCategoryId,
  onMajorChange,
  onMinorChange,
}: Props) {
  const selectedMajor = categories.find(c => c.id === majorCategoryId)

  return (
    <div className={styles.filter}>
      <select
        className={styles.select}
        value={majorCategoryId}
        onChange={e => onMajorChange(e.target.value)}
      >
        <option value="">全ての大分類</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className={styles.select}
        value={minorCategoryId}
        onChange={e => onMinorChange(e.target.value)}
        disabled={!majorCategoryId}
      >
        <option value="">全ての中分類</option>
        {selectedMajor?.subcategories.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )
}
