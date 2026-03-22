export interface Term {
  id: number
  url: string
  majorCategoryId: string
  minorCategoryId: string
  name: string
  reading: string
  english: string
  category: string
  subcategory: string
  description: string
}

export interface TermProgress {
  correct: number
  total: number
}

export interface Progress {
  [termId: number]: TermProgress
}

export interface Subcategory {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

export type QuizDirection = 'term-to-meaning' | 'meaning-to-term'
export type QuizFormat = 'flashcard' | 'multiple-choice'
export type QuizCount = 10 | 20 | 50 | 'all'
export type TabType = 'list' | 'quiz' | 'progress'

export interface QuizSettings {
  majorCategoryId: string
  minorCategoryId: string
  direction: QuizDirection
  format: QuizFormat
  count: QuizCount
}

export interface QuizAnswer {
  termId: number
  correct: boolean
}
