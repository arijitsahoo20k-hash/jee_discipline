import { create } from 'zustand'
import { Todo, StudySession, Exam, Mark, Chapter, Profile } from './types'

interface AppStore {
  // Warning banner
  bannerVisible: boolean
  setBannerVisible: (v: boolean) => void

  // Profile
  profile: Profile | null
  setProfile: (p: Profile | null) => void

  // Todos
  todos: Todo[]
  setTodos: (t: Todo[]) => void
  addTodo: (t: Todo) => void
  updateTodo: (id: string, t: Partial<Todo>) => void
  removeTodo: (id: string) => void

  // Study sessions
  sessions: StudySession[]
  setSessions: (s: StudySession[]) => void
  addSession: (s: StudySession) => void

  // Exams
  exams: Exam[]
  setExams: (e: Exam[]) => void
  addExam: (e: Exam) => void
  removeExam: (id: string) => void

  // Marks
  marks: Mark[]
  setMarks: (m: Mark[]) => void
  addMark: (m: Mark) => void
  updateMark: (id: string, m: Partial<Mark>) => void

  // Active nav
  activeTab: string
  setActiveTab: (t: string) => void

  // Focus mode
  focusMode: boolean
  setFocusMode: (v: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  bannerVisible: true,
  setBannerVisible: (v) => set({ bannerVisible: v }),

  profile: null,
  setProfile: (p) => set({ profile: p }),

  todos: [],
  setTodos: (t) => set({ todos: t }),
  addTodo: (t) => set((s) => ({ todos: [t, ...s.todos] })),
  updateTodo: (id, upd) =>
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, ...upd } : t)) })),
  removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

  sessions: [],
  setSessions: (s) => set({ sessions: s }),
  addSession: (s) => set((st) => ({ sessions: [s, ...st.sessions] })),

  exams: [],
  setExams: (e) => set({ exams: e }),
  addExam: (e) => set((s) => ({ exams: [...s.exams, e] })),
  removeExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

  marks: [],
  setMarks: (m) => set({ marks: m }),
  addMark: (m) => set((s) => ({ marks: [m, ...s.marks] })),
  updateMark: (id, upd) =>
    set((s) => ({ marks: s.marks.map((m) => (m.id === id ? { ...m, ...upd } : m)) })),

  activeTab: 'dashboard',
  setActiveTab: (t) => set({ activeTab: t }),

  focusMode: false,
  setFocusMode: (v) => set({ focusMode: v }),
}))
