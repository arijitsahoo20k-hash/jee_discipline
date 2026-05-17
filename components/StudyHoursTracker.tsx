'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Minus, X, Brain } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { StudySession, Subject, SessionType } from '@/lib/types'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts'
import { format, subDays, parseISO, startOfWeek, eachDayOfInterval, subWeeks } from 'date-fns'

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#F59E0B',
  Chemistry: '#10B981',
  Mathematics: '#3B82F6',
}

const SESSION_TYPES: SessionType[] = ['concept', 'practice', 'revision', 'mock_analysis']

function getMotivationInsights(sessions: StudySession[]): { type: 'warn' | 'info' | 'good'; message: string }[] {
  const insights: { type: 'warn' | 'info' | 'good'; message: string }[] = []
  const today = new Date()

  // Check last 3 days for each subject
  const subjectDays: Record<string, number> = { Physics: 0, Chemistry: 0, Mathematics: 0 }
  for (let i = 0; i < 5; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd')
    const daySessions = sessions.filter((s) => s.session_date === d)
    if (daySessions.length === 0 && i < 3) subjectDays['all'] = (subjectDays['all'] || 0) + 1
    for (const sub of ['Physics', 'Chemistry', 'Mathematics']) {
      if (!daySessions.some((s) => s.subject === sub)) subjectDays[sub] = (subjectDays[sub] || 0) + 1
    }
  }

  if ((subjectDays['all'] || 0) >= 3) {
    insights.push({ type: 'warn', message: '3 days of inconsistency detected. You are losing momentum rapidly.' })
  }

  for (const sub of ['Physics', 'Chemistry', 'Mathematics']) {
    const missed = subjectDays[sub] || 0
    if (missed >= 5) {
      insights.push({ type: 'warn', message: `${sub} has not been studied in ${missed} days. Dangerous gap forming.` })
    }
  }

  // Today's hours
  const todayStr = format(today, 'yyyy-MM-dd')
  const todayHrs = sessions.filter((s) => s.session_date === todayStr).reduce((sum, s) => sum + s.hours, 0)
  if (todayHrs === 0) {
    insights.push({ type: 'warn', message: 'Zero hours logged today. The day is passing.' })
  } else if (todayHrs >= 8) {
    insights.push({ type: 'good', message: `Strong session today — ${todayHrs.toFixed(1)}h logged. Keep this consistency.` })
  } else if (todayHrs < 4) {
    insights.push({ type: 'info', message: `Only ${todayHrs.toFixed(1)}h today. Target is 8–10 hours minimum.` })
  }

  // Subject balance
  const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), 'yyyy-MM-dd'))
  const subHrs: Record<string, number> = {}
  for (const sub of ['Physics', 'Chemistry', 'Mathematics']) {
    subHrs[sub] = sessions.filter((s) => last7.includes(s.session_date) && s.subject === sub).reduce((sum, s) => sum + s.hours, 0)
  }
  const total = Object.values(subHrs).reduce((a, b) => a + b, 0)
  if (total > 10) {
    for (const [sub, hrs] of Object.entries(subHrs)) {
      if (hrs / total < 0.2) {
        insights.push({ type: 'warn', message: `${sub} is only ${((hrs / total) * 100).toFixed(0)}% of your last 7 days. Neglecting it will show in mocks.` })
      }
    }
  }

  return insights.slice(0, 4)
}

function LogSessionModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const { addSession } = useAppStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    subject: 'Physics' as Subject,
    hours: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    session_type: 'concept' as SessionType,
    focus_score: 7,
    notes: '',
  })

  async function handleSubmit() {
    if (!form.hours || isNaN(parseFloat(form.hours))) return toast.error('Enter valid hours')
    const hrs = parseFloat(form.hours)
    if (hrs <= 0 || hrs > 16) return toast.error('Hours must be between 0 and 16')
    setLoading(true)
    const { data, error } = await supabase.from('study_sessions').insert({
      user_id: userId,
      subject: form.subject,
      hours: hrs,
      session_date: form.session_date,
      session_type: form.session_type,
      focus_score: form.focus_score,
      notes: form.notes || null,
    }).select().single()

    if (error) { toast.error('Failed to log session'); setLoading(false); return }
    addSession(data as StudySession)
    toast.success(`${hrs}h of ${form.subject} logged`)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-active)',
          borderRadius: 16, padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Log Study Session</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Subject selector */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['Physics', 'Chemistry', 'Mathematics'] as Subject[]).map((sub) => (
              <button
                key={sub}
                onClick={() => setForm({ ...form, subject: sub })}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  border: `1px solid ${form.subject === sub ? SUBJECT_COLORS[sub] : 'var(--border)'}`,
                  background: form.subject === sub ? `${SUBJECT_COLORS[sub]}15` : 'transparent',
                  color: form.subject === sub ? SUBJECT_COLORS[sub] : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {sub}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Hours</label>
              <input type="number" step="0.5" min="0.5" max="16" placeholder="e.g. 2.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Date</label>
              <input type="date" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Session Type</label>
            <select value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value as SessionType })} style={{ width: '100%', padding: '9px 12px' }}>
              {SESSION_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Focus Score: <span style={{ color: 'var(--text-primary)' }}>{form.focus_score}/10</span>
            </label>
            <input
              type="range" min="1" max="10" value={form.focus_score}
              onChange={(e) => setForm({ ...form, focus_score: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: '#3B82F6' }}
            />
          </div>

          <textarea placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 14px', resize: 'vertical' }} />

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '11px', background: '#3B82F6', border: 'none', borderRadius: 10,
              color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Logging...' : 'Log Session'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function StudyHoursTracker({ userId }: { userId: string }) {
  const { sessions } = useAppStore()
  const [showModal, setShowModal] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayHours = sessions.filter((s) => s.session_date === today).reduce((sum, s) => sum + s.hours, 0)

  // Last 14 days chart
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd')
    const daySessions = sessions.filter((s) => s.session_date === d)
    return {
      day: format(parseISO(d), 'dd'),
      Physics: parseFloat(daySessions.filter((s) => s.subject === 'Physics').reduce((sum, s) => sum + s.hours, 0).toFixed(1)),
      Chemistry: parseFloat(daySessions.filter((s) => s.subject === 'Chemistry').reduce((sum, s) => sum + s.hours, 0).toFixed(1)),
      Mathematics: parseFloat(daySessions.filter((s) => s.subject === 'Mathematics').reduce((sum, s) => sum + s.hours, 0).toFixed(1)),
      total: parseFloat(daySessions.reduce((sum, s) => sum + s.hours, 0).toFixed(1)),
    }
  })

  // 12-week heatmap
  const heatmapDays = Array.from({ length: 84 }, (_, i) => {
    const d = subDays(new Date(), 83 - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    const hrs = sessions.filter((s) => s.session_date === dateStr).reduce((sum, s) => sum + s.hours, 0)
    return { date: dateStr, hours: hrs, day: d.getDay() }
  })

  function heatColor(hours: number) {
    if (hours === 0) return 'var(--border)'
    if (hours < 3) return 'rgba(59,130,246,0.25)'
    if (hours < 6) return 'rgba(59,130,246,0.5)'
    if (hours < 9) return 'rgba(59,130,246,0.75)'
    return '#3B82F6'
  }

  const insights = getMotivationInsights(sessions)

  const totalAllTime = sessions.reduce((sum, s) => sum + s.hours, 0)
  const last7Total = sessions
    .filter((s) => Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).includes(s.session_date))
    .reduce((sum, s) => sum + s.hours, 0)
  const avgPerDay = (last7Total / 7).toFixed(1)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Study Hours</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {todayHours.toFixed(1)}h today · {avgPerDay}h avg/day this week
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
            background: '#3B82F6', border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          <Plus size={15} />
          Log Session
        </motion.button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Today', value: `${todayHours.toFixed(1)}h`, color: todayHours >= 8 ? '#10B981' : todayHours >= 5 ? '#F59E0B' : '#FF3333' },
          { label: 'This Week', value: `${last7Total.toFixed(1)}h`, color: 'var(--text-primary)' },
          { label: 'Avg/Day', value: `${avgPerDay}h`, color: 'var(--text-primary)' },
          { label: 'All-time', value: `${totalAllTime.toFixed(0)}h`, color: '#8B5CF6' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Smart motivation engine */}
      {insights.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '20px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Brain size={15} color="var(--text-secondary)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Motivation Engine — Insights
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8,
                  background: insight.type === 'warn' ? 'rgba(255,51,51,0.05)' : insight.type === 'good' ? 'rgba(16,185,129,0.05)' : 'rgba(59,130,246,0.05)',
                  border: `1px solid ${insight.type === 'warn' ? 'rgba(255,51,51,0.2)' : insight.type === 'good' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.15)'}`,
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                  background: insight.type === 'warn' ? '#FF3333' : insight.type === 'good' ? '#10B981' : '#3B82F6',
                }} />
                <span style={{
                  fontSize: 13,
                  color: insight.type === 'warn' ? '#FF7070' : insight.type === 'good' ? '#4ADE80' : '#93C5FD',
                  lineHeight: 1.5,
                }}>
                  {insight.message}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 14-day bar chart */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Last 14 Days — Study Hours
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={last14} barSize={10} barGap={2}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#3D5068' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#3D5068' }} axisLine={false} tickLine={false} width={24} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-hover)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="Physics" fill="#F59E0B" radius={[2, 2, 0, 0]} stackId="a" />
            <Bar dataKey="Chemistry" fill="#10B981" radius={[0, 0, 0, 0]} stackId="a" />
            <Bar dataKey="Mathematics" fill="#3B82F6" radius={[0, 0, 0, 0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {Object.entries(SUBJECT_COLORS).map(([sub, color]) => (
            <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px', marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          12-Week Activity Heatmap
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(84, 1fr)', gap: 3 }}>
          {heatmapDays.map((d, i) => (
            <div
              key={i}
              title={`${d.date}: ${d.hours.toFixed(1)}h`}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 2,
                background: heatColor(d.hours),
                transition: 'background 0.2s',
                cursor: 'default',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Less</span>
          {[0, 2, 4, 6, 9].map((h) => (
            <div key={h} style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(h) }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>

      {/* Recent sessions */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Recent Sessions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sessions.slice(0, 10).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, background: 'var(--bg-hover)',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: SUBJECT_COLORS[s.subject], flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{s.subject}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.session_type?.replace('_', ' ')}</span>
              <span style={{ fontSize: 12, color: SUBJECT_COLORS[s.subject], fontWeight: 600 }}>{s.hours}h</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{s.session_date}</span>
            </motion.div>
          ))}
          {sessions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
              No sessions logged yet. Start studying.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && <LogSessionModal onClose={() => setShowModal(false)} userId={userId} />}
      </AnimatePresence>
    </div>
  )
}
