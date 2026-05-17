'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Mark, TestType } from '@/lib/types'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, Cell
} from 'recharts'
import { format, parseISO } from 'date-fns'

const TEST_TYPES: TestType[] = ['Full Mock', 'Part Mock', 'Chapter Test', 'Minor Test']

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#F59E0B',
  Chemistry: '#10B981',
  Mathematics: '#3B82F6',
}

function AddMarkModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const { addMark } = useAppStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    test_name: '',
    test_date: format(new Date(), 'yyyy-MM-dd'),
    test_type: 'Full Mock' as TestType,
    physics_marks: '', physics_total: '120',
    chemistry_marks: '', chemistry_total: '120',
    mathematics_marks: '', mathematics_total: '120',
    rank: '',
    time_taken: '',
    accuracy: '',
    mistakes: '',
    improvement_notes: '',
  })

  async function handleSubmit() {
    if (!form.test_name.trim()) return toast.error('Enter test name')
    setLoading(true)

    const phy = parseFloat(form.physics_marks) || 0
    const che = parseFloat(form.chemistry_marks) || 0
    const mat = parseFloat(form.mathematics_marks) || 0
    const phyT = parseFloat(form.physics_total) || 120
    const cheT = parseFloat(form.chemistry_total) || 120
    const matT = parseFloat(form.mathematics_total) || 120

    const { data, error } = await supabase.from('marks').insert({
      user_id: userId,
      test_name: form.test_name.trim(),
      test_date: form.test_date,
      test_type: form.test_type,
      physics_marks: phy, physics_total: phyT,
      chemistry_marks: che, chemistry_total: cheT,
      mathematics_marks: mat, mathematics_total: matT,
      total_marks: phy + che + mat,
      total_out_of: phyT + cheT + matT,
      rank: form.rank ? parseInt(form.rank) : null,
      time_taken: form.time_taken ? parseInt(form.time_taken) : null,
      accuracy: form.accuracy ? parseFloat(form.accuracy) : null,
      mistakes: form.mistakes || null,
      improvement_notes: form.improvement_notes || null,
      analysis_done: false,
    }).select().single()

    if (error) { toast.error('Failed to save marks'); setLoading(false); return }
    addMark(data as Mark)
    toast.success('Test recorded')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 540,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-active)',
          borderRadius: 16, overflow: 'hidden',
          margin: 'auto',
        }}
      >
        {/* False marks warning */}
        <div style={{
          padding: '14px 24px',
          background: 'linear-gradient(135deg, rgba(30,0,0,0.95), rgba(20,0,0,0.95))',
          borderBottom: '1px solid rgba(255,51,51,0.2)',
        }}>
          <motion.div
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <AlertTriangle size={15} color="#FF3333" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FF5555', letterSpacing: '0.04em' }}>
              INPUTTING FALSE MARKS WON'T FOOL OTHERS. YOU ARE ONLY FOOLING YOURSELF.
            </span>
          </motion.div>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Record Mock Test</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Test Name *</label>
                <input placeholder="e.g. Allen Major Test 12" value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Date</label>
                <input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Test Type</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {TEST_TYPES.map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, test_type: t })}
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                      border: `1px solid ${form.test_type === t ? '#3B82F6' : 'var(--border)'}`,
                      background: form.test_type === t ? 'rgba(59,130,246,0.12)' : 'transparent',
                      color: form.test_type === t ? '#3B82F6' : 'var(--text-muted)',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject marks */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {[
                { sub: 'Physics', marks: form.physics_marks, total: form.physics_total, setM: (v: string) => setForm({ ...form, physics_marks: v }), setT: (v: string) => setForm({ ...form, physics_total: v }) },
                { sub: 'Chemistry', marks: form.chemistry_marks, total: form.chemistry_total, setM: (v: string) => setForm({ ...form, chemistry_marks: v }), setT: (v: string) => setForm({ ...form, chemistry_total: v }) },
                { sub: 'Mathematics', marks: form.mathematics_marks, total: form.mathematics_total, setM: (v: string) => setForm({ ...form, mathematics_marks: v }), setT: (v: string) => setForm({ ...form, mathematics_total: v }) },
              ].map(({ sub, marks, total, setM, setT }, i) => {
                const pct = marks && total ? Math.round((parseFloat(marks) / parseFloat(total)) * 100) : null
                const color = (SUBJECT_COLORS as any)[sub]
                return (
                  <div key={sub} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    background: 'var(--bg-card)',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', width: 90, flexShrink: 0 }}>{sub}</span>
                    <input type="number" placeholder="Marks" value={marks} onChange={(e) => setM(e.target.value)}
                      style={{ width: 70, padding: '6px 10px', textAlign: 'center' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/</span>
                    <input type="number" placeholder="Total" value={total} onChange={(e) => setT(e.target.value)}
                      style={{ width: 70, padding: '6px 10px', textAlign: 'center' }} />
                    {pct !== null && (
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#FF3333',
                        marginLeft: 'auto',
                      }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rank</label>
                <input type="number" placeholder="e.g. 450" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Time (min)</label>
                <input type="number" placeholder="e.g. 180" value={form.time_taken} onChange={(e) => setForm({ ...form, time_taken: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Accuracy %</label>
                <input type="number" placeholder="e.g. 72" value={form.accuracy} onChange={(e) => setForm({ ...form, accuracy: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mistakes / What Went Wrong</label>
              <textarea placeholder="Be honest. What did you mess up?" value={form.mistakes} onChange={(e) => setForm({ ...form, mistakes: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 14px', resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Improvement Plan</label>
              <textarea placeholder="What will you do differently next time?" value={form.improvement_notes} onChange={(e) => setForm({ ...form, improvement_notes: e.target.value })} rows={2} style={{ width: '100%', padding: '10px 14px', resize: 'vertical' }} />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading}
              style={{
                width: '100%', padding: '11px', background: '#3B82F6', border: 'none', borderRadius: 10,
                color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
              {loading ? 'Saving...' : 'Save Test Record'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function MarkCard({ mark }: { mark: Mark }) {
  const { updateMark } = useAppStore()
  const supabase = createClient()
  const pct = mark.total_out_of ? Math.round((mark.total_marks! / mark.total_out_of) * 100) : null
  const scoreColor = pct !== null ? (pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#FF3333') : 'var(--text-muted)'

  async function markAnalysisDone() {
    const { error } = await supabase.from('marks').update({ analysis_done: true }).eq('id', mark.id)
    if (!error) { updateMark(mark.id, { analysis_done: true }); toast.success('Analysis marked complete') }
  }

  const phyPct = mark.physics_total ? Math.round((mark.physics_marks! / mark.physics_total) * 100) : null
  const chePct = mark.chemistry_total ? Math.round((mark.chemistry_marks! / mark.chemistry_total) * 100) : null
  const matPct = mark.mathematics_total ? Math.round((mark.mathematics_marks! / mark.mathematics_total) * 100) : null

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px', position: 'relative', overflow: 'hidden',
      }}
    >
      {!mark.analysis_done && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'rgba(245,158,11,0.12)', borderLeft: '1px solid rgba(245,158,11,0.2)',
          borderBottom: '1px solid rgba(245,158,11,0.2)',
          borderBottomLeftRadius: 8, padding: '4px 10px',
          fontSize: 10, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em',
        }}>
          ANALYSIS PENDING
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{mark.test_name}</h3>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {format(parseISO(mark.test_date), 'MMM d, yyyy')} · {mark.test_type}
            {mark.rank && <span> · Rank <strong style={{ color: 'var(--text-secondary)' }}>#{mark.rank}</strong></span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {pct !== null ? `${pct}%` : '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {mark.total_marks}/{mark.total_out_of}
          </div>
        </div>
      </div>

      {/* Subject breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Physics', pct: phyPct, marks: mark.physics_marks, total: mark.physics_total, color: '#F59E0B' },
          { label: 'Chemistry', pct: chePct, marks: mark.chemistry_marks, total: mark.chemistry_total, color: '#10B981' },
          { label: 'Mathematics', pct: matPct, marks: mark.mathematics_marks, total: mark.mathematics_total, color: '#3B82F6' },
        ].map(({ label, pct: sp, marks, total, color }) => sp !== null && (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: 'JetBrains Mono, monospace' }}>
                {marks}/{total} ({sp}%)
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${sp}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="progress-fill" style={{ background: color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mistakes */}
      {mark.mistakes && (
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(255,51,51,0.05)', border: '1px solid rgba(255,51,51,0.15)',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#FF6666', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mistakes</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mark.mistakes}</p>
        </div>
      )}

      {mark.improvement_notes && (
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#60A5FA', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Improvement Plan</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{mark.improvement_notes}</p>
        </div>
      )}

      {!mark.analysis_done && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={markAnalysisDone}
          style={{
            width: '100%', padding: '9px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)',
            background: 'rgba(245,158,11,0.08)', color: '#F59E0B', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <CheckCircle size={13} />
          Mark Analysis as Done
        </motion.button>
      )}
    </motion.div>
  )
}

export default function MarksTracker({ userId }: { userId: string }) {
  const { marks } = useAppStore()
  const [showModal, setShowModal] = useState(false)

  const pendingAnalysis = marks.filter((m) => !m.analysis_done).length

  // Trend data
  const trendData = [...marks].reverse().slice(-10).map((m) => ({
    name: m.test_name.slice(0, 10),
    Score: m.total_out_of ? Math.round((m.total_marks! / m.total_out_of) * 100) : 0,
    Physics: m.physics_total ? Math.round((m.physics_marks! / m.physics_total) * 100) : 0,
    Chemistry: m.chemistry_total ? Math.round((m.chemistry_marks! / m.chemistry_total) * 100) : 0,
    Mathematics: m.mathematics_total ? Math.round((m.mathematics_marks! / m.mathematics_total) * 100) : 0,
  }))

  // Average subject performance
  const avgSubject = ['Physics', 'Chemistry', 'Mathematics'].map((sub) => {
    const relevant = marks.filter((m) => {
      const t = sub === 'Physics' ? m.physics_total : sub === 'Chemistry' ? m.chemistry_total : m.mathematics_total
      return t && t > 0
    })
    if (!relevant.length) return { subject: sub, avg: 0, color: (SUBJECT_COLORS as any)[sub] }
    const avg = relevant.reduce((sum, m) => {
      const s = sub === 'Physics' ? m.physics_marks : sub === 'Chemistry' ? m.chemistry_marks : m.mathematics_marks
      const t = sub === 'Physics' ? m.physics_total : sub === 'Chemistry' ? m.chemistry_total : m.mathematics_total
      return sum + (s! / t!) * 100
    }, 0) / relevant.length
    return { subject: sub, avg: Math.round(avg), color: (SUBJECT_COLORS as any)[sub] }
  })

  const weakSubject = avgSubject.sort((a, b) => a.avg - b.avg)[0]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Mock Analysis</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {marks.length} test{marks.length !== 1 ? 's' : ''} recorded · {pendingAnalysis} pending analysis
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
          Add Test
        </motion.button>
      </div>

      {/* Pending analysis warning */}
      {pendingAnalysis > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 20,
          }}
        >
          <AlertTriangle size={15} color="#F59E0B" />
          <span style={{ fontSize: 13, color: '#FBBF24' }}>
            <strong>{pendingAnalysis} test{pendingAnalysis !== 1 ? 's' : ''}</strong> without completed analysis. A mock without analysis is wasted time.
          </span>
        </motion.div>
      )}

      {/* Weak subject alert */}
      {marks.length >= 3 && weakSubject.avg < 50 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.2)', marginBottom: 20,
          }}
        >
          <AlertTriangle size={15} color="#FF3333" />
          <span style={{ fontSize: 13, color: '#FF6666' }}>
            <strong>{weakSubject.subject}</strong> is consistently your weakest at <strong>{weakSubject.avg}%</strong> average. Focus on it immediately.
          </span>
        </motion.div>
      )}

      {/* Charts */}
      {trendData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Score Trend
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#3D5068' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#3D5068' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: 'var(--bg-hover)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="Score" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3, fill: '#8B5CF6' }} />
                <Line type="monotone" dataKey="Physics" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="Chemistry" stroke="#10B981" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="Mathematics" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              Average by Subject
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={avgSubject} barSize={40}>
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#3D5068' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#3D5068' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-hover)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, 'Avg Score']}
                />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {avgSubject.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Test cards */}
      {marks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            textAlign: 'center', padding: '80px 20px',
            border: '1px dashed var(--border)', borderRadius: 16,
          }}
        >
          <BarChart3 size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>No tests recorded</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start giving mocks and tracking your performance</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence>
            {marks.map((mark) => <MarkCard key={mark.id} mark={mark} />)}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && <AddMarkModal onClose={() => setShowModal(false)} userId={userId} />}
      </AnimatePresence>
    </div>
  )
}
