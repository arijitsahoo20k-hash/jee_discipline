'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CheckCircle, Brain, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Mistake, MistakeType } from '@/lib/types'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

const MISTAKE_TYPES: { type: MistakeType; label: string; color: string; desc: string }[] = [
  { type: 'concept', label: 'Concept', color: '#8B5CF6', desc: 'Wrong understanding of a concept' },
  { type: 'calculation', label: 'Calculation', color: '#F59E0B', desc: 'Arithmetic/algebraic error' },
  { type: 'silly', label: 'Silly', color: '#FF3333', desc: 'Careless mistake or misread' },
  { type: 'time_management', label: 'Time', color: '#06B6D4', desc: 'Spent too long / rushed' },
]

export default function MistakeJournal({ userId }: { userId: string }) {
  const supabase = createClient()
  const [mistakes, setMistakes] = useState<Mistake[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<MistakeType | 'all'>('all')
  const [showResolved, setShowResolved] = useState(false)

  const [form, setForm] = useState({
    subject: 'Physics',
    topic: '',
    mistake_type: 'concept' as MistakeType,
    description: '',
  })

  useEffect(() => {
    loadMistakes()
  }, [])

  async function loadMistakes() {
    const { data } = await supabase
      .from('mistakes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setMistakes((data || []) as Mistake[])
    setLoading(false)
  }

  async function addMistake() {
    if (!form.description.trim()) return toast.error('Describe the mistake')
    const { data, error } = await supabase.from('mistakes').insert({
      user_id: userId,
      subject: form.subject,
      topic: form.topic || null,
      mistake_type: form.mistake_type,
      description: form.description.trim(),
      resolved: false,
    }).select().single()
    if (error) { toast.error('Failed to save'); return }
    setMistakes([data as Mistake, ...mistakes])
    toast.success('Mistake logged')
    setShowModal(false)
    setForm({ subject: 'Physics', topic: '', mistake_type: 'concept', description: '' })
  }

  async function markResolved(id: string) {
    const { error } = await supabase.from('mistakes').update({ resolved: true }).eq('id', id)
    if (!error) {
      setMistakes(mistakes.map((m) => m.id === id ? { ...m, resolved: true } : m))
      toast.success('Marked as resolved')
    }
  }

  const filtered = mistakes.filter((m) => {
    if (!showResolved && m.resolved) return false
    if (filter !== 'all' && m.mistake_type !== filter) return false
    return true
  })

  const byType = MISTAKE_TYPES.map((t) => ({
    ...t,
    count: mistakes.filter((m) => m.mistake_type === t.type && !m.resolved).length,
  }))

  if (loading) return <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Mistake Journal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {mistakes.filter((m) => !m.resolved).length} unresolved mistakes
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
            background: '#8B5CF6', border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          <Plus size={15} /> Log Mistake
        </motion.button>
      </div>

      {/* Type breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {byType.map((t) => (
          <motion.div
            key={t.type}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilter(filter === t.type ? 'all' : t.type)}
            style={{
              background: filter === t.type ? `${t.color}15` : 'var(--bg-card)',
              border: `1px solid ${filter === t.type ? `${t.color}40` : 'var(--border)'}`,
              borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: t.color, letterSpacing: '-0.03em', marginBottom: 4 }}>{t.count}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{t.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filter:</span>
        {(['all', ...MISTAKE_TYPES.map((t) => t.type)] as (MistakeType | 'all')[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 12,
              border: `1px solid ${filter === f ? '#8B5CF6' : 'var(--border)'}`,
              background: filter === f ? 'rgba(139,92,246,0.1)' : 'transparent',
              color: filter === f ? '#8B5CF6' : 'var(--text-secondary)',
              cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'Inter, sans-serif',
            }}
          >
            {f === 'all' ? 'All' : f.replace('_', ' ')}
          </button>
        ))}
        <button
          onClick={() => setShowResolved(!showResolved)}
          style={{
            marginLeft: 'auto', padding: '5px 12px', borderRadius: 16, fontSize: 12,
            border: `1px solid ${showResolved ? '#10B981' : 'var(--border)'}`,
            background: showResolved ? 'rgba(16,185,129,0.1)' : 'transparent',
            color: showResolved ? '#10B981' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          {showResolved ? '✓ Showing Resolved' : 'Show Resolved'}
        </button>
      </div>

      {/* Mistake list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
              <Brain size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              {filter === 'all' ? 'No mistakes logged. Good — or not logging honestly?' : `No ${filter} mistakes.`}
            </motion.div>
          ) : (
            filtered.map((m) => {
              const typeCfg = MISTAKE_TYPES.find((t) => t.type === m.mistake_type)!
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '14px 16px',
                    opacity: m.resolved ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: `${typeCfg.color}15`, border: `1px solid ${typeCfg.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: typeCfg.color,
                    }}>
                      {typeCfg.label[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: typeCfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {typeCfg.label}
                        </span>
                        {m.subject && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {m.subject}</span>}
                        {m.topic && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {m.topic}</span>}
                        {m.resolved && (
                          <span style={{ fontSize: 10, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>RESOLVED</span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{m.description}</p>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        {format(parseISO(m.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                    {!m.resolved && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => markResolved(m.id)}
                        style={{
                          flexShrink: 0, padding: '5px 10px', borderRadius: 7,
                          border: '1px solid rgba(16,185,129,0.3)',
                          background: 'rgba(16,185,129,0.08)', color: '#10B981',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <CheckCircle size={11} /> Resolve
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
            onClick={() => setShowModal(false)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Log a Mistake</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Type */}
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 7, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mistake Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                    {MISTAKE_TYPES.map((t) => (
                      <button key={t.type} onClick={() => setForm({ ...form, mistake_type: t.type })}
                        style={{
                          padding: '9px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500, textAlign: 'left',
                          border: `1px solid ${form.mistake_type === t.type ? t.color : 'var(--border)'}`,
                          background: form.mistake_type === t.type ? `${t.color}12` : 'transparent',
                          color: form.mistake_type === t.type ? t.color : 'var(--text-secondary)',
                          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Subject</label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: '9px 12px' }}>
                      {['Physics', 'Chemistry', 'Mathematics'].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Topic</label>
                    <input placeholder="e.g. Electrostatics" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>What went wrong? *</label>
                  <textarea
                    placeholder="Be specific. Generic notes are useless."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '10px 14px', resize: 'vertical' }}
                  />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addMistake}
                  style={{
                    width: '100%', padding: '11px', background: '#8B5CF6', border: 'none', borderRadius: 10,
                    color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}>
                  Log Mistake
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
