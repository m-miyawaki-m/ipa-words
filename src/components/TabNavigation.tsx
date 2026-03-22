import type { TabType } from '../types'
import styles from './TabNavigation.module.css'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'list', label: '一覧' },
  { key: 'quiz', label: '出題' },
  { key: 'progress', label: '進捗' },
]

export function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className={styles.nav}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
