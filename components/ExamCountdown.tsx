'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar, Trash2, X, AlertTriangle, Clock } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Exam, ExamType, ExamPriority } from '@/lib/types'
import toast from 'react-hot-toast'
import { differenceInDays, parseISO, format } from 'date-fns'

const EXAM_TYPES: ExamType[] = ['JEE_Advanced', 'JEE_Main', 'BITSAT', 'Other']
const PRIORITIES: ExamPriority[] = ['critical', 'high', 'medium', 'low']

function getUrgency(days: number): { label: string; color: string; bg: string; pulse: boolean } {
  if (days < 0) return { label: 'EXAM PASSED', color: '#4A5568', bg: 'rgba(74,85,104,0.1)', pulse: false }
  if (days <= 14) return { label: '🔴 CRITICAL — FINAL STRETCH', color: '#FF3333', bg: 'rgba(255,51,51,0.08)', pulse: true }
  if (days <= 30) return { label: '🟠 HIGH URGENCY', color: '#F97316', bg: 'rgba(249,115,22,0.08)', pulse: false }
  if (days <= 60) return { label: '🟡 MODERATE URGENCY', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', pulse: false }
  return { label: '🟢 SUFFICIENT TIME', color: '#10B981', bg: 'rgba(16,185,129,0.08)', pulse: false }
}

function AddExamModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const { addExam } = useAppStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    exam_date: '',
    exam_type: 'JEE_Main' as ExamType,
    priority: 'high' as ExamPriority,
    notes: '',
  })

  async function handleSubmit() {
    if (!form.name.trim() || !form.exam_date) return toast.error('Fill in exam name and date')
    setLoading(true)
    const { data, error } = await supabase.from('exams').insert({
      user_id: userId,
      name: form.name.trim(),
      exam_date: form.exam_date,
      exam_type: form.exam_type,
      priority: form.priority,
      notes: form.notes || null,
    }).select().single()

    if (error) { toast.error('Failed to add exam'); setLoading(false); return }
    addExam(data as Exam)
    toast.success('Exam added to countdown')
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
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Exam</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Every day counts. Add it now.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input placeholder="Exam name (e.g. JEE Advanced 2025)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '10px 14px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Exam Date</label>
              <input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Type</label>
              <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value as ExamType })} style={{ width: '100%', padding: '9px 12px' }}>
                {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setForm({ ...form, priority: p })}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    border: `1px solid ${form.priority === p ? ({ critical: '#FF3333', high: '#F97316', medium: '#F59E0B', low: '#10B981' }[p]) : 'var(--border)'}`,
                    background: form.priority === p ? `${({ critical: '#FF3333', high: '#F97316', medium: '#F59E0B', low: '#10B981' }[p])}15` : 'transparent',
                    color: form.priority === p ? ({ critical: '#FF3333', high: '#F97316', medium: '#F59E0B', low: '#10B981' }[p]) : 'var(--text-muted)',
                    cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
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
            {loading ? 'Adding...' : 'Add to Countdown'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ExamCard({ exam }: { exam: Exam }) {
  const { removeExam } = useAppStore()
  const supabase = createClient()

  const days = differenceInDays(parseISO(exam.exam_date), new Date())
  const urgency = getUrgency(days)

  async function handleDelete() {
    const { error } = await supabase.from('exams').delete().eq('id', exam.id)
    if (!error) { removeExam(exam.id); toast.success('Exam removed') }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${urgency.color}30`,
        borderRadius: 16,
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <motion.div
        animate={urgency.pulse ? { opacity: [0.05, 0.12, 0.05] } : { opacity: 0.06 }}
        transition={urgency.pulse ? { duration: 2, repeat: Infinity } : {}}
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at top right, ${urgency.color}30, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
              {exam.exam_type?.replace('_', ' ')}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
              {exam.name}
            </h3>
          </div>
          <button
            onClick={handleDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF3333'; e.currentTarget.style.opacity = '1' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.5' }}
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Countdown number */}
        <div style={{ marginBottom: 20 }}>
          <motion.div
            animate={urgency.pulse ? { scale: [1, 1.02, 1] } : {}}
            transition={urgency.pulse ? { duration: 1.5, repeat: Infinity } : {}}
            style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}
          >
            <span style={{
              fontSize: 52, fontWeight: 800, color: urgency.color,
              letterSpacing: '-0.04em', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {days < 0 ? 0 : days}
            </span>
            <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
              {days < 0 ? 'days ago' : days === 1 ? 'day left' : 'days left'}
            </span>
          </motion.div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(5, Math.min(100, ((180 - Math.max(0, days)) / 180) * 100))}%` }}
              transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', background: urgency.color, borderRadius: 2 }}
            />
          </div>
        </div>

        {/* Urgency label */}
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          color: urgency.color, letterSpacing: '0.06em',
          padding: '5px 12px', borderRadius: 20,
          background: urgency.bg,
          border: `1px solid ${urgency.color}30`,
        }}>
          {urgency.label}
        </div>

        {/* Exam date */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <Calendar size={12} />
          {format(parseISO(exam.exam_date), 'MMMM d, yyyy')}
        </div>

        {/* Notes */}
        {exam.notes && (
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {exam.notes}
          </p>
        )}

        {/* Critical extra warning */}
        {days <= 14 && days >= 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(255,51,51,0.08)', border: '1px solid rgba(255,51,51,0.2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <AlertTriangle size={13} color="#FF3333" />
            <span style={{ fontSize: 12, color: '#FF6666' }}>
              {days === 0 ? 'Exam is TODAY. Give your best.' :
               days <= 3 ? `${days} day${days !== 1 ? 's' : ''} left. No more wasted time.` :
               `Less than 2 weeks. Every hour matters now.`}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default function ExamCountdown({ userId }: { userId: string }) {
  const { exams } = useAppStore()
  const [showModal, setShowModal] = useState(false)

  const sorted = [...exams].sort((a, b) =>
    differenceInDays(parseISO(a.exam_date), new Date()) - differenceInDays(parseISO(b.exam_date), new Date())
  )

  const nextExam = sorted.find((e) => differenceInDays(parseISO(e.exam_date), new Date()) >= 0)
  const totalDays = nextExam ? differenceInDays(parseISO(nextExam.exam_date), new Date()) : null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Exam Countdown</h1>
          {nextExam && totalDays !== null && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Next: <span style={{ color: getUrgency(totalDays).color, fontWeight: 600 }}>{nextExam.name}</span> in {totalDays} day{totalDays !== 1 ? 's' : ''}
            </p>
          )}
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
          Add Exam
        </motion.button>
      </div>

      {/* Timeline visualization */}
      {sorted.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '20px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Countdown Timeline
          </div>
          <div style={{ position: 'relative' }}>
            {sorted.map((exam, i) => {
              const days = differenceInDays(parseISO(exam.exam_date), new Date())
              const urg = getUrgency(days)
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: urg.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{exam.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{format(parseISO(exam.exam_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: urg.color, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {days < 0 ? 'Done' : `${days}d`}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cards */}
      {exams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center', padding: '80px 20px',
            border: '1px dashed var(--border)', borderRadius: 16,
          }}
        >
          <Calendar size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            No exams added yet
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Add your target exams to start the countdown
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <AnimatePresence>
            {sorted.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && <AddExamModal onClose={() => setShowModal(false)} userId={userId} />}
      </AnimatePresence>
    </div>
  )
}
