'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckCircle, Circle, AlertCircle, Clock, X } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { Todo, Subject, Priority } from '@/lib/types'
import toast from 'react-hot-toast'
import { format, isPast, parseISO, isToday } from 'date-fns'

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: '#FF3333',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#10B981',
}

const SUBJECTS: Subject[] = ['Physics', 'Chemistry', 'Mathematics', 'General']
const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low']

function AddTodoModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const { addTodo } = useAppStore()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: 'Physics' as Subject,
    priority: 'medium' as Priority,
    due_date: format(new Date(), 'yyyy-MM-dd'),
    due_time: '',
  })

  async function handleSubmit() {
    if (!form.title.trim()) return toast.error('Enter a task title')
    setLoading(true)
    const { data, error } = await supabase.from('todos').insert({
      user_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject: form.subject,
      priority: form.priority,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      status: 'pending',
    }).select().single()

    if (error) { toast.error('Failed to add task'); setLoading(false); return }
    addTodo(data as Todo)
    toast.success('Task added')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-active)',
          borderRadius: 16, padding: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            placeholder="Task title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ width: '100%', padding: '10px 14px' }}
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            style={{ width: '100%', padding: '10px 14px', resize: 'vertical' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value as Subject })}
                style={{ width: '100%', padding: '9px 12px' }}
              >
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                style={{ width: '100%', padding: '9px 12px' }}
              >
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Due Time</label>
              <input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} style={{ width: '100%', padding: '9px 12px' }} />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              background: loading ? 'var(--bg-hover)' : '#3B82F6',
              border: 'none', borderRadius: 10,
              color: 'white', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Adding...' : 'Add Task'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function TodoItem({ todo, userId }: { todo: Todo; userId: string }) {
  const { updateTodo, removeTodo } = useAppStore()
  const supabase = createClient()

  async function toggleComplete() {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
    const { error } = await supabase.from('todos').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    }).eq('id', todo.id)
    if (!error) updateTodo(todo.id, { status: newStatus })
  }

  async function deleteTodo() {
    const { error } = await supabase.from('todos').delete().eq('id', todo.id)
    if (!error) { removeTodo(todo.id); toast.success('Task deleted') }
  }

  const isOverdue = todo.status === 'overdue' || (todo.due_date && isPast(parseISO(todo.due_date)) && !isToday(parseISO(todo.due_date)) && todo.status !== 'completed')
  const isDueToday = todo.due_date && isToday(parseISO(todo.due_date))
  const pColor = PRIORITY_COLORS[todo.priority] || '#F59E0B'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', borderRadius: 10,
        background: 'var(--bg-card)',
        border: `1px solid ${isOverdue ? 'rgba(255,51,51,0.25)' : 'var(--border)'}`,
        transition: 'border-color 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Priority stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: pColor, opacity: 0.7,
      }} />

      <button onClick={toggleComplete} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
        {todo.status === 'completed'
          ? <CheckCircle size={18} color="#10B981" />
          : <Circle size={18} color="var(--text-muted)" />
        }
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 14, fontWeight: 500,
            color: todo.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
          }}>
            {todo.title}
          </span>
          {isOverdue && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#FF3333', background: 'rgba(255,51,51,0.1)', padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase' }}>
              Overdue
            </span>
          )}
          {isDueToday && todo.status !== 'completed' && !isOverdue && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 7px', borderRadius: 10 }}>
              Due Today
            </span>
          )}
        </div>
        {todo.description && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{todo.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          {todo.subject && (
            <span style={{ fontSize: 11, fontWeight: 500, color: { Physics: '#F59E0B', Chemistry: '#10B981', Mathematics: '#3B82F6', General: '#8B5CF6' }[todo.subject] || 'var(--text-muted)' }}>
              {todo.subject}
            </span>
          )}
          {todo.due_date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--text-muted)' }}>
              <Clock size={10} />
              {format(parseISO(todo.due_date), 'MMM d')}
              {todo.due_time && ` · ${todo.due_time}`}
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 8,
            color: pColor, background: `${pColor}15`, textTransform: 'capitalize',
          }}>
            {todo.priority}
          </span>
        </div>
      </div>

      <button
        onClick={deleteTodo}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, opacity: 0.6 }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#FF3333'; e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.opacity = '0.6' }}
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  )
}

export default function TodoList({ userId }: { userId: string }) {
  const { todos } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')

  const today = format(new Date(), 'yyyy-MM-dd')

  const filtered = todos.filter((t) => {
    if (filter === 'today' && t.due_date !== today) return false
    if (filter === 'pending' && (t.status === 'completed')) return false
    if (filter === 'completed' && t.status !== 'completed') return false
    if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false
    return true
  })

  const overdueCount = todos.filter((t) => t.status === 'overdue').length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Daily Tasks</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {todos.filter((t) => t.status === 'completed').length} completed · {overdueCount} overdue
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 10,
            background: '#3B82F6', border: 'none',
            color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          <Plus size={15} />
          Add Task
        </motion.button>
      </div>

      {/* Overdue warning */}
      {overdueCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(255,51,51,0.06)', border: '1px solid rgba(255,51,51,0.25)', marginBottom: 20,
          }}
        >
          <AlertCircle size={16} color="#FF3333" />
          <span style={{ fontSize: 13, color: '#FF6666' }}>
            <strong>KAL KARLENGE</strong> is why you have {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}. Handle them first.
          </span>
        </motion.div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'today', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: `1px solid ${filter === f ? '#3B82F6' : 'var(--border)'}`,
              background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: filter === f ? '#3B82F6' : 'var(--text-secondary)',
              cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'Inter, sans-serif',
            }}
          >
            {f}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        {['all', ...SUBJECTS].map((s) => s !== 'General' && (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: `1px solid ${subjectFilter === s ? ({ Physics: '#F59E0B', Chemistry: '#10B981', Mathematics: '#3B82F6' } as any)[s] || 'var(--border)' : 'var(--border)'}`,
              background: subjectFilter === s ? `${({ Physics: '#F59E0B', Chemistry: '#10B981', Mathematics: '#3B82F6' } as any)[s] || '#3B82F6'}15` : 'transparent',
              color: subjectFilter === s ? ({ Physics: '#F59E0B', Chemistry: '#10B981', Mathematics: '#3B82F6' } as any)[s] || 'var(--text-secondary)' : 'var(--text-secondary)',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            {s === 'all' ? 'All Subjects' : s}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 14 }}
            >
              {filter === 'completed' ? '✓ No completed tasks yet' : '+ No tasks. Add one above.'}
            </motion.div>
          ) : (
            filtered.map((todo) => (
              <TodoItem key={todo.id} todo={todo} userId={userId} />
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && <AddTodoModal onClose={() => setShowModal(false)} userId={userId} />}
      </AnimatePresence>
    </div>
  )
}
