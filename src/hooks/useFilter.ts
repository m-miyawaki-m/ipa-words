import { useState, useMemo } from 'react'
import type { Term } from '../types'

export function useFilter(terms: Term[]) {
  const [majorCategoryId, setMajorCategoryId] = useState('')
  const [minorCategoryId, setMinorCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    let result = terms

    if (majorCategoryId) {
      result = result.filter(t => t.majorCategoryId === majorCategoryId)
    }

    if (minorCategoryId) {
      result = result.filter(t => t.minorCategoryId === minorCategoryId)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.reading.toLowerCase().includes(q) ||
          t.english.toLowerCase().includes(q)
      )
    }

    return result
  }, [terms, majorCategoryId, minorCategoryId, searchQuery])

  const setMajorCategory = (id: string) => {
    setMajorCategoryId(id)
    setMinorCategoryId('')
  }

  return {
    majorCategoryId,
    minorCategoryId,
    searchQuery,
    filtered,
    setMajorCategory,
    setMinorCategoryId,
    setSearchQuery,
  }
}
