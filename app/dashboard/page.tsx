'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { Todo, StudySession, Exam, Mark, Profile } from '@/lib/types'

import WarningBanner from '@/components/WarningBanner'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import TodoList from '@/components/TodoList'
import SyllabusTracker from '@/components/SyllabusTracker'
import MarksTracker from '@/components/MarksTracker'
import StudyHoursTracker from '@/components/StudyHoursTracker'
import ExamCountdown from '@/components/ExamCountdown'
import MistakeJournal from '@/components/MistakeJournal'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const {
    bannerVisible, activeTab,
    setProfile, setTodos, setSessions, setExams, setMarks,
    focusMode,
  } = useAppStore()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const [profileRes, todosRes, sessionsRes, examsRes, marksRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('todos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('study_sessions').select('*').eq('user_id', user.id).order('session_date', { ascending: false }),
        supabase.from('exams').select('*').eq('user_id', user.id).order('exam_date'),
        supabase.from('marks').select('*').eq('user_id', user.id).order('test_date', { ascending: false }),
      ])

      if (profileRes.data) setProfile(profileRes.data as Profile)
      if (todosRes.data) setTodos(todosRes.data as Todo[])
      if (sessionsRes.data) setSessions(sessionsRes.data as StudySession[])
      if (examsRes.data) setExams(examsRes.data as Exam[])
      if (marksRes.data) setMarks(marksRes.data as Mark[])

      if (profileRes.data) {
        const profile = profileRes.data as Profile
        const today = new Date().toISOString().split('T')[0]
        if (profile.last_active_date !== today) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yStr = yesterday.toISOString().split('T')[0]
          const newStreak = profile.last_active_date === yStr ? profile.streak + 1 : 1
          await supabase.from('profiles').update({ last_active_date: today, streak: newStreak }).eq('id', user.id)
          setProfile({ ...profile, last_active_date: today, streak: newStreak })
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const bannerHeight = bannerVisible ? 72 : 0

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: '#3B82F6' }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading your discipline system...</span>
      </div>
    )
  }

  if (!userId) return null

  const TABS: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    todos: <TodoList userId={userId} />,
    syllabus: <SyllabusTracker userId={userId} />,
    marks: <MarksTracker userId={userId} />,
    hours: <StudyHoursTracker userId={userId} />,
    exams: <ExamCountdown userId={userId} />,
    mistakes: <MistakeJournal userId={userId} />,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <WarningBanner />
      <div style={{ display: 'flex', paddingTop: bannerHeight, transition: 'padding-top 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
        {!focusMode && <Sidebar />}
        <main style={{
          flex: 1,
          marginLeft: focusMode ? 0 : 220,
          minHeight: `calc(100vh - ${bannerHeight}px)`,
          padding: '32px 36px',
          transition: 'margin-left 0.3s',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {TABS[activeTab] || <Dashboard />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
