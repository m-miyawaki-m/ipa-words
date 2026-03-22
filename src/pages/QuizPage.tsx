import { useState } from 'react'
import type {
  Term,
  Category,
  QuizSettings,
  QuizDirection,
  QuizFormat,
  QuizCount,
} from '../types'
import { useQuiz } from '../hooks/useQuiz'
import { CategoryFilter } from '../components/CategoryFilter'
import { FlashCard } from '../components/FlashCard'
import { MultipleChoice } from '../components/MultipleChoice'
import { QuizResult } from '../components/QuizResult'
import styles from './QuizPage.module.css'

interface Props {
  terms: Term[]
  categories: Category[]
  onRecordAnswer: (termId: number, correct: boolean) => void
}

export function QuizPage({ terms, categories, onRecordAnswer }: Props) {
  const [majorCategoryId, setMajorCategoryId] = useState('')
  const [minorCategoryId, setMinorCategoryId] = useState('')
  const [direction, setDirection] = useState<QuizDirection>('term-to-meaning')
  const [format, setFormat] = useState<QuizFormat>('flashcard')
  const [count, setCount] = useState<QuizCount>(10)

  const quiz = useQuiz(terms)

  const handleStart = () => {
    quiz.startQuiz({
      majorCategoryId,
      minorCategoryId,
      direction,
      format,
      count,
    })
  }

  const handleAnswer = (correct: boolean) => {
    if (quiz.currentTerm) {
      onRecordAnswer(quiz.currentTerm.id, correct)
    }
    quiz.answerQuestion(correct)
  }

  const handleMajorChange = (id: string) => {
    setMajorCategoryId(id)
    setMinorCategoryId('')
  }

  // 結果画面
  if (quiz.isFinished) {
    return (
      <QuizResult
        answers={quiz.answers}
        quizTerms={quiz.quizTerms}
        onRetry={handleStart}
        onBackToSettings={quiz.resetQuiz}
      />
    )
  }

  // 出題画面
  if (quiz.settings && quiz.currentTerm) {
    return (
      <div>
        <div className={styles.progress}>
          {quiz.currentIndex + 1} / {quiz.totalCount}
        </div>

        {quiz.settings.format === 'flashcard' ? (
          <FlashCard
            key={quiz.currentTerm.id}
            term={quiz.currentTerm}
            direction={quiz.settings.direction}
            onAnswer={handleAnswer}
          />
        ) : (
          <MultipleChoice
            key={quiz.currentTerm.id}
            term={quiz.currentTerm}
            choices={quiz.choices}
            direction={quiz.settings.direction}
            onAnswer={handleAnswer}
          />
        )}
      </div>
    )
  }

  // 設定画面
  return (
    <div>
      <h1 className={styles.title}>出題設定</h1>

      <div className={styles.section}>
        <div className={styles.label}>ジャンル</div>
        <CategoryFilter
          categories={categories}
          majorCategoryId={majorCategoryId}
          minorCategoryId={minorCategoryId}
          onMajorChange={handleMajorChange}
          onMinorChange={setMinorCategoryId}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.label}>出題方向</div>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={direction === 'term-to-meaning'}
              onChange={() => setDirection('term-to-meaning')}
            />
            用語 → 意味
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={direction === 'meaning-to-term'}
              onChange={() => setDirection('meaning-to-term')}
            />
            意味 → 用語
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>出題形式</div>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={format === 'flashcard'}
              onChange={() => setFormat('flashcard')}
            />
            フラッシュカード
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={format === 'multiple-choice'}
              onChange={() => setFormat('multiple-choice')}
            />
            4択クイズ
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>出題数</div>
        <div className={styles.radioGroup}>
          {([10, 20, 50, 'all'] as QuizCount[]).map(c => (
            <label key={String(c)} className={styles.radio}>
              <input
                type="radio"
                checked={count === c}
                onChange={() => setCount(c)}
              />
              {c === 'all' ? '全問' : `${c}問`}
            </label>
          ))}
        </div>
      </div>

      <button className={styles.startBtn} onClick={handleStart}>
        出題開始
      </button>
    </div>
  )
}
