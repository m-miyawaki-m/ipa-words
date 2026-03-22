import { useCallback } from 'react'
import { List } from 'react-window'
import type { Term, Category, Progress } from '../types'
import { useFilter } from '../hooks/useFilter'
import { CategoryFilter } from '../components/CategoryFilter'
import { SearchBar } from '../components/SearchBar'
import { WordCard } from '../components/WordCard'
import styles from './WordListPage.module.css'

interface Props {
  terms: Term[]
  categories: Category[]
  progress: Progress
}

interface RowProps {
  filtered: Term[]
  progress: Progress
}

function WordRow({
  index,
  style,
  filtered,
  progress,
}: {
  index: number
  style: React.CSSProperties
  ariaAttributes: {
    'aria-posinset': number
    'aria-setsize': number
    role: 'listitem'
  }
  filtered: Term[]
  progress: Progress
}) {
  const term = filtered[index]
  return (
    <div style={style}>
      <WordCard term={term} progress={progress[term.id] || null} />
    </div>
  )
}

export function WordListPage({ terms, categories, progress }: Props) {
  const {
    majorCategoryId,
    minorCategoryId,
    filtered,
    setMajorCategory,
    setMinorCategoryId,
    setSearchQuery,
  } = useFilter(terms)

  const handleSearch = useCallback(
    (q: string) => setSearchQuery(q),
    [setSearchQuery]
  )

  // react-window v2 requires fixed row heights for List.
  // Fall back to plain rendering when <= 500 items (supports expand).
  const useVirtualScroll = filtered.length > 500

  return (
    <div>
      <h1 className={styles.title}>IPA単語帳</h1>
      <CategoryFilter
        categories={categories}
        majorCategoryId={majorCategoryId}
        minorCategoryId={minorCategoryId}
        onMajorChange={setMajorCategory}
        onMinorChange={setMinorCategoryId}
      />
      <SearchBar onSearch={handleSearch} />
      <div className={styles.count}>{filtered.length} 語</div>

      {useVirtualScroll ? (
        <List<RowProps>
          style={{ height: window.innerHeight - 220 }}
          rowCount={filtered.length}
          rowHeight={72}
          rowComponent={WordRow}
          rowProps={{ filtered, progress }}
        />
      ) : (
        filtered.map(term => (
          <WordCard
            key={term.id}
            term={term}
            progress={progress[term.id] || null}
          />
        ))
      )}
    </div>
  )
}
