import { useState, useEffect, useMemo } from 'react'
import type { Term, Category } from '../types'

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/terms.json')
      .then(res => res.json())
      .then((data: Term[]) => {
        setTerms(data)
        setLoading(false)
      })
      .catch(() => {
        setError('データの読み込みに失敗しました')
        setLoading(false)
      })
  }, [])

  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, Category>()
    for (const term of terms) {
      if (!map.has(term.majorCategoryId)) {
        map.set(term.majorCategoryId, {
          id: term.majorCategoryId,
          name: term.category,
          subcategories: [],
        })
      }
      const cat = map.get(term.majorCategoryId)!
      if (!cat.subcategories.some(s => s.id === term.minorCategoryId)) {
        cat.subcategories.push({
          id: term.minorCategoryId,
          name: term.subcategory,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      Number(a.id) - Number(b.id)
    )
  }, [terms])

  return { terms, categories, loading, error }
}
