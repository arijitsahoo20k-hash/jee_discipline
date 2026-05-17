'use client'

import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  TrendingUp,
  Clock,
  Calendar,
  Brain,
  Zap,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'todos', label: 'Daily Tasks', icon: CheckSquare },
  { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
  { id: 'marks', label: 'Mock Analysis', icon: TrendingUp },
  { id: 'hours', label: 'Study Hours', icon: Clock },
  { id: 'exams', label: 'Exam Countdown', icon: Calendar },
  { id: 'mistakes', label: 'Mistake Journal', icon: Brain },
]

export default function Sidebar() {
  const { activeTab, setActiveTab, focusMode, setFocusMode, bannerVisible } = useAppStore()
  const router = useRouter()
  const supabase = createClient()

  const topOffset = bannerVisible ? 80 : 0

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        width: 220,
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        top: topOffset,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transition: 'top 0.4s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Discipline OS
          </span>
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          JEE Accountability System
        </p>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
                background: isActive
                  ? 'rgba(59, 130, 246, 0.12)'
                  : 'transparent',
                color: isActive ? '#3B82F6' : 'var(--text-secondary)',
                borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                textAlign: 'left',
              }}
            >
              <Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
              {item.label}
            </motion.button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Focus mode toggle */}
        <motion.button
          onClick={() => setFocusMode(!focusMode)}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: focusMode ? '#F59E0B' : 'var(--text-secondary)',
            background: focusMode ? 'rgba(245,158,11,0.08)' : 'transparent',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={14} />
            Focus Mode
          </span>
          <div
            style={{
              width: 28,
              height: 16,
              borderRadius: 8,
              background: focusMode ? '#F59E0B' : 'var(--border-active)',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: focusMode ? 14 : 3,
                transition: 'left 0.2s',
              }}
            />
          </div>
        </motion.button>

        <motion.button
          onClick={handleLogout}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            color: 'var(--text-muted)',
            background: 'transparent',
          }}
        >
          <LogOut size={14} />
          Sign Out
        </motion.button>
      </div>
    </motion.aside>
  )
}
