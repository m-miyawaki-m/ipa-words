import { useState } from 'react'
import type { TabType } from './types'
import { useTerms } from './hooks/useTerms'
import { useProgress } from './hooks/useProgress'
import { TabNavigation } from './components/TabNavigation'
import styles from './App.module.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const { terms, categories, loading } = useTerms()
  const { progress, recordAnswer, getProgress, resetProgress } = useProgress()

  if (loading) {
    return <div className={styles.loading}>読み込み中...</div>
  }

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        {activeTab === 'list' && <div>一覧（Task 9で実装）</div>}
        {activeTab === 'quiz' && <div>出題（Task 10-12で実装）</div>}
        {activeTab === 'progress' && <div>進捗（Task 13で実装）</div>}
      </main>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
