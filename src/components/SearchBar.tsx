import { useState, useEffect } from 'react'
import styles from './SearchBar.module.css'

interface Props {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(timer)
  }, [value, onSearch])

  return (
    <input
      className={styles.input}
      type="text"
      placeholder="用語名・読み・英語で検索..."
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
}
