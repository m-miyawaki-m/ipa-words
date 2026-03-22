import { useState } from 'react'
import type { TabType } from './types'
import { useTerms } from './hooks/useTerms'
import { useProgress } from './hooks/useProgress'
import { TabNavigation } from './components/TabNavigation'
import { WordListPage } from './pages/WordListPage'
import { QuizPage } from './pages/QuizPage'
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
        {activeTab === 'list' && (
          <WordListPage terms={terms} categories={categories} progress={progress} />
        )}
        {activeTab === 'quiz' && (
          <QuizPage
            terms={terms}
            categories={categories}
            onRecordAnswer={recordAnswer}
          />
        )}
        {activeTab === 'progress' && <div>進捗（Task 13で実装）</div>}
      </main>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
