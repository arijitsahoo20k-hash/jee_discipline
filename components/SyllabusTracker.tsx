'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, ChevronRight, X, BookOpen, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Chapter, Subtopic, TopicStatus } from '@/lib/types'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<TopicStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: '#3D5068', bg: 'rgba(61,80,104,0.15)' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  revised: { label: 'Revised', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  mastered: { label: 'Mastered', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

const STATUSES: TopicStatus[] = ['not_started', 'in_progress', 'revised', 'mastered']

const PRESET_CHAPTERS: Record<string, string[]> = {
  Physics: [
    'Kinematics', 'Laws of Motion', 'Work Energy Power', 'Rotational Motion',
    'Gravitation', 'Properties of Matter', 'Thermodynamics', 'Kinetic Theory',
    'Oscillations', 'Waves', 'Electrostatics', 'Current Electricity',
    'Magnetic Effects', 'Electromagnetic Induction', 'Electromagnetic Waves',
    'Optics', 'Dual Nature', 'Atoms & Nuclei', 'Semiconductors',
  ],
  Chemistry: [
    'Some Basic Concepts', 'Atomic Structure', 'Chemical Bonding', 'States of Matter',
    'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen',
    's-Block Elements', 'p-Block Elements', 'd & f Block', 'Coordination Compounds',
    'Organic Chemistry Basics', 'Hydrocarbons', 'Haloalkanes', 'Alcohols Phenols Ethers',
    'Aldehydes Ketones', 'Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers',
  ],
  Mathematics: [
    'Sets & Functions', 'Complex Numbers', 'Quadratic Equations', 'Sequences & Series',
    'Binomial Theorem', 'Straight Lines', 'Circles', 'Conic Sections',
    'Limits & Continuity', 'Derivatives', 'Applications of Derivatives',
    'Integrals', 'Differential Equations', 'Vectors', '3D Geometry',
    'Probability', 'Matrices & Determinants', 'Trigonometry', 'Mathematical Reasoning',
  ],
}

interface SubjectData {
  id: string
  name: string
  color: string
  chapters: Chapter[]
}

function AddChapterModal({
  onClose, subjectId, userId, onAdd
}: {
  onClose: () => void
  subjectId: string
  userId: string
  subjectName: string
  onAdd: (c: Chapter) => void
}) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [weightage, setWeightage] = useState('5')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return toast.error('Enter chapter name')
    setLoading(true)
    const { data, error } = await supabase.from('chapters').insert({
      user_id: userId, subject_id: subjectId,
      name: name.trim(), weightage: parseInt(weightage) || 5,
      status: 'not_started', completion_percent: 0, is_weak: false,
    }).select().single()
    if (error) { toast.error('Failed to add chapter'); setLoading(false); return }
    onAdd(data as Chapter)
    toast.success('Chapter added')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-active)',
          borderRadius: 14, padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Add Chapter</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Chapter name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '9px 12px' }} />
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Weightage (1–10)</label>
            <input type="number" min="1" max="10" value={weightage} onChange={(e) => setWeightage(e.target.value)} style={{ width: '100%', padding: '9px 12px' }} />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAdd} disabled={loading}
            style={{
              width: '100%', padding: '10px', background: '#3B82F6', border: 'none', borderRadius: 9,
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}>
            {loading ? 'Adding...' : 'Add Chapter'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ChapterRow({
  chapter, onStatusChange, onToggleWeak
}: {
  chapter: Chapter
  onStatusChange: (id: string, status: TopicStatus, pct: number) => void
  onToggleWeak: (id: string, v: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [subtopics, setSubtopics] = useState<Subtopic[]>(chapter.subtopics || [])
  const [addingSubtopic, setAddingSubtopic] = useState(false)
  const [newSubtopic, setNewSubtopic] = useState('')
  const supabase = createClient()

  const status = chapter.status
  const cfg = STATUS_CONFIG[status]

  async function cycleStatus() {
    const idx = STATUSES.indexOf(status)
    const next = STATUSES[(idx + 1) % STATUSES.length]
    const pct = next === 'mastered' ? 100 : next === 'revised' ? 80 : next === 'in_progress' ? 40 : 0
    const { error } = await supabase.from('chapters').update({ status: next, completion_percent: pct }).eq('id', chapter.id)
    if (!error) onStatusChange(chapter.id, next, pct)
  }

  async function addSubtopic() {
    if (!newSubtopic.trim()) return
    const { data, error } = await supabase.from('subtopics').insert({
      user_id: chapter.user_id, chapter_id: chapter.id, name: newSubtopic.trim(), status: 'not_started',
    }).select().single()
    if (!error) { setSubtopics([...subtopics, data as Subtopic]); setNewSubtopic(''); setAddingSubtopic(false) }
  }

  async function cycleSubtopicStatus(sub: Subtopic) {
    const idx = STATUSES.indexOf(sub.status)
    const next = STATUSES[(idx + 1) % STATUSES.length]
    const { error } = await supabase.from('subtopics').update({ status: next }).eq('id', sub.id)
    if (!error) setSubtopics(subtopics.map((s) => s.id === sub.id ? { ...s, status: next } : s))
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{chapter.name}</span>

        {chapter.is_weak && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#FF3333', background: 'rgba(255,51,51,0.1)', padding: '2px 7px', borderRadius: 8 }}>WEAK</span>
        )}

        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {chapter.completion_percent}%
        </span>

        {/* Progress bar inline */}
        <div style={{ width: 60, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${chapter.completion_percent}%`,
            background: status === 'mastered' ? '#10B981' : status === 'revised' ? '#3B82F6' : status === 'in_progress' ? '#F59E0B' : '#3D5068',
            transition: 'width 0.5s',
          }} />
        </div>

        <button
          onClick={cycleStatus}
          style={{
            padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            border: `1px solid ${cfg.color}40`, background: cfg.bg, color: cfg.color,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
          }}
        >
          {cfg.label}
        </button>

        <button
          onClick={() => onToggleWeak(chapter.id, !chapter.is_weak)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 11,
            color: chapter.is_weak ? '#FF3333' : 'var(--text-muted)',
            opacity: 0.7,
          }}
          title={chapter.is_weak ? 'Remove weak flag' : 'Mark as weak'}
        >
          ⚑
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingLeft: 40, paddingRight: 16, paddingBottom: 12 }}>
              {subtopics.map((sub) => {
                const scfg = STATUS_CONFIG[sub.status]
                return (
                  <div key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border-active)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{sub.name}</span>
                    <button
                      onClick={() => cycleSubtopicStatus(sub)}
                      style={{
                        padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                        border: `1px solid ${scfg.color}40`, background: scfg.bg, color: scfg.color,
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {scfg.label}
                    </button>
                  </div>
                )
              })}
              {addingSubtopic ? (
                <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
                  <input
                    placeholder="Subtopic name" value={newSubtopic}
                    onChange={(e) => setNewSubtopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtopic()}
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                    autoFocus
                  />
                  <button onClick={addSubtopic} style={{ padding: '6px 12px', borderRadius: 8, background: '#3B82F6', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Add</button>
                  <button onClick={() => setAddingSubtopic(false)} style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingSubtopic(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, marginTop: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <Plus size={12} /> Add subtopic
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SyllabusTracker({ userId }: { userId: string }) {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddChapter, setShowAddChapter] = useState<{ subjectId: string; subjectName: string } | null>(null)
  const [activeSubject, setActiveSubject] = useState<string | null>(null)

  useEffect(() => {
    loadSyllabus()
  }, [])

  async function loadSyllabus() {
    setLoading(true)
    // Load or create default subjects
    let { data: existingSubjects } = await supabase.from('subjects').select('*').eq('user_id', userId)

    if (!existingSubjects || existingSubjects.length === 0) {
      // Create default subjects
      const defaults = [
        { name: 'Physics', color: '#F59E0B' },
        { name: 'Chemistry', color: '#10B981' },
        { name: 'Mathematics', color: '#3B82F6' },
      ]
      const { data: created } = await supabase.from('subjects').insert(
        defaults.map((d) => ({ ...d, user_id: userId }))
      ).select()
      existingSubjects = created || []
    }

    // Load chapters with subtopics
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*, subtopics(*)')
      .eq('user_id', userId)
      .order('name')

    const subjectData: SubjectData[] = (existingSubjects || []).map((sub: any) => ({
      id: sub.id, name: sub.name, color: sub.color,
      chapters: (chapters || []).filter((c: any) => c.subject_id === sub.id),
    }))

    setSubjects(subjectData)
    if (subjectData.length > 0) setActiveSubject(subjectData[0].id)
    setLoading(false)
  }

  async function addPresetChapters(subjectId: string, subjectName: string) {
    const presets = PRESET_CHAPTERS[subjectName] || []
    if (!presets.length) return
    const { data, error } = await supabase.from('chapters').insert(
      presets.map((name) => ({
        user_id: userId, subject_id: subjectId, name,
        status: 'not_started', completion_percent: 0, is_weak: false, weightage: 5,
      }))
    ).select('*, subtopics(*)')
    if (!error && data) {
      setSubjects((prev) => prev.map((s) => s.id === subjectId ? { ...s, chapters: [...s.chapters, ...data as Chapter[]] } : s))
      toast.success(`Added ${presets.length} chapters for ${subjectName}`)
    }
  }

  function updateChapterStatus(subjectId: string, chapterId: string, status: TopicStatus, pct: number) {
    setSubjects((prev) => prev.map((s) => s.id === subjectId
      ? { ...s, chapters: s.chapters.map((c) => c.id === chapterId ? { ...c, status, completion_percent: pct } : c) }
      : s
    ))
  }

  async function toggleWeak(subjectId: string, chapterId: string, val: boolean) {
    const { error } = await supabase.from('chapters').update({ is_weak: val }).eq('id', chapterId)
    if (!error) {
      setSubjects((prev) => prev.map((s) => s.id === subjectId
        ? { ...s, chapters: s.chapters.map((c) => c.id === chapterId ? { ...c, is_weak: val } : c) }
        : s
      ))
    }
  }

  const activeSubjectData = subjects.find((s) => s.id === activeSubject)

  const getSubjectStats = (sub: SubjectData) => {
    const total = sub.chapters.length
    if (!total) return { pct: 0, mastered: 0, weak: 0 }
    const mastered = sub.chapters.filter((c) => c.status === 'mastered').length
    const weak = sub.chapters.filter((c) => c.is_weak).length
    const pct = Math.round(sub.chapters.reduce((sum, c) => sum + c.completion_percent, 0) / total)
    return { pct, mastered, weak }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Syllabus Tracker</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Track every chapter across all subjects</p>
        </div>
      </div>

      {/* Subject overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {subjects.map((sub) => {
          const stats = getSubjectStats(sub)
          const isActive = activeSubject === sub.id
          return (
            <motion.div
              key={sub.id}
              onClick={() => setActiveSubject(sub.id)}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isActive ? `${sub.color}10` : 'var(--bg-card)',
                border: `1px solid ${isActive ? `${sub.color}40` : 'var(--border)'}`,
                borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? sub.color : 'var(--text-primary)' }}>{sub.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.chapters.length} chapters</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: sub.color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>
                {stats.pct}%
              </div>
              <div className="progress-bar">
                <motion.div
                  animate={{ width: `${stats.pct}%` }}
                  transition={{ duration: 0.8 }}
                  className="progress-fill"
                  style={{ background: sub.color }}
                />
              </div>
              {stats.weak > 0 && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#FF5555' }}>
                  <AlertTriangle size={10} /> {stats.weak} weak chapter{stats.weak !== 1 ? 's' : ''}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Active subject chapters */}
      {activeSubjectData && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: activeSubjectData.color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeSubjectData.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {activeSubjectData.chapters.length} chapters
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {activeSubjectData.chapters.length === 0 && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addPresetChapters(activeSubjectData.id, activeSubjectData.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                    border: `1px solid ${activeSubjectData.color}40`,
                    background: `${activeSubjectData.color}10`,
                    color: activeSubjectData.color, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <BookOpen size={13} />
                  Load JEE Syllabus
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAddChapter({ subjectId: activeSubjectData.id, subjectName: activeSubjectData.name })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
                  background: '#3B82F6', border: 'none', color: 'white', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                <Plus size={13} /> Add Chapter
              </motion.button>
            </div>
          </div>

          {/* Chapter list */}
          {activeSubjectData.chapters.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No chapters yet. Load the JEE syllabus or add manually.
            </div>
          ) : (
            activeSubjectData.chapters.map((chapter) => (
              <ChapterRow
                key={chapter.id}
                chapter={chapter}
                onStatusChange={(id, status, pct) => updateChapterStatus(activeSubjectData.id, id, status, pct)}
                onToggleWeak={(id, val) => toggleWeak(activeSubjectData.id, id, val)}
              />
            ))
          )}

          {/* Status legend */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s]
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cfg.label}</span>
                </div>
              )
            })}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Click status badge to cycle · Click ⚑ to flag weak
            </span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAddChapter && (
          <AddChapterModal
            onClose={() => setShowAddChapter(null)}
            subjectId={showAddChapter.subjectId}
            subjectName={showAddChapter.subjectName}
            userId={userId}
            onAdd={(chapter) => {
              setSubjects((prev) => prev.map((s) =>
                s.id === showAddChapter.subjectId ? { ...s, chapters: [...s.chapters, chapter] } : s
              ))
              setShowAddChapter(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
