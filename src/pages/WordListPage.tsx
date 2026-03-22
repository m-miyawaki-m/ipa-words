import { useState, useCallback, useMemo } from 'react'
import type { Term, Category, Progress } from '../types'
import { useFilter } from '../hooks/useFilter'
import { CategoryFilter } from '../components/CategoryFilter'
import { SearchBar } from '../components/SearchBar'
import { WordCard } from '../components/WordCard'
import styles from './WordListPage.module.css'

const PAGE_SIZE = 50

interface Props {
  terms: Term[]
  categories: Category[]
  progress: Progress
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

  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const pageItems = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  )

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q)
      setPage(0)
    },
    [setSearchQuery]
  )

  const handleMajorChange = useCallback(
    (id: string) => {
      setMajorCategory(id)
      setPage(0)
    },
    [setMajorCategory]
  )

  const handleMinorChange = useCallback(
    (id: string) => {
      setMinorCategoryId(id)
      setPage(0)
    },
    [setMinorCategoryId]
  )

  const goToPage = (p: number) => {
    setPage(p)
    window.scrollTo({ top: 0 })
  }

  return (
    <div>
      <h1 className={styles.title}>IPA単語帳</h1>
      <CategoryFilter
        categories={categories}
        majorCategoryId={majorCategoryId}
        minorCategoryId={minorCategoryId}
        onMajorChange={handleMajorChange}
        onMinorChange={handleMinorChange}
      />
      <SearchBar onSearch={handleSearch} />
      <div className={styles.count}>
        {filtered.length} 語（{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}）
      </div>

      {pageItems.map(term => (
        <WordCard
          key={term.id}
          term={term}
          progress={progress[term.id] || null}
        />
      ))}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
          >
            前へ
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => goToPage(page + 1)}
          >
            次へ
          </button>
        </div>
      )}
    </div>
  )
}
