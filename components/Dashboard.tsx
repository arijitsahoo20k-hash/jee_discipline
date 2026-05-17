'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import {
  Flame, Target, Clock, TrendingUp, BookOpen, AlertTriangle, CheckCircle2, BarChart3
} from 'lucide-react'
import { format, differenceInDays, parseISO, isToday } from 'date-fns'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Cell
} from 'recharts'

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#F59E0B',
  Chemistry: '#10B981',
  Mathematics: '#3B82F6',
}

function StatCard({
  label,
  value,
  sub,
  color = 'var(--text-primary)',
  icon: Icon,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon: React.ElementType
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color="var(--text-secondary)" />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </motion.div>
  )
}

function ExamCountdownCard({ exam }: { exam: { name: string; exam_date: string; exam_type: string; priority: string } }) {
  const days = differenceInDays(parseISO(exam.exam_date), new Date())
  const urgency = days <= 14 ? 'critical' : days <= 30 ? 'high' : days <= 60 ? 'medium' : 'low'
  const colors = {
    critical: '#FF3333',
    high: '#F97316',
    medium: '#F59E0B',
    low: '#10B981',
  }
  const color = colors[urgency]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${color}30`,
        borderRadius: 12,
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{ opacity: urgency === 'critical' ? [0.08, 0.15, 0.08] : 0.06 }}
        transition={urgency === 'critical' ? { duration: 2, repeat: Infinity } : {}}
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at top right, ${color}20, transparent 70%)`,
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
          {exam.exam_type?.replace('_', ' ')}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
          {exam.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 36, fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {days < 0 ? 0 : days}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {days < 0 ? 'days ago' : 'days left'}
          </span>
        </div>
        <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, ((120 - days) / 120) * 100))}%` }}
            transition={{ duration: 1.2, delay: 0.3 }}
            style={{ height: '100%', background: color, borderRadius: 2 }}
          />
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {urgency === 'critical' ? '🔴 CRITICAL — ACT NOW' :
           urgency === 'high' ? '🟠 HIGH URGENCY' :
           urgency === 'medium' ? '🟡 MODERATE' : '🟢 ON TRACK'}
        </div>
      </div>
    </motion.div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-hover)', border: '1px solid var(--border-active)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-primary)',
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}h
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { todos, sessions, exams, marks, profile } = useAppStore()

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayTodos = todos.filter((t) => t.due_date === today)
  const completedToday = todayTodos.filter((t) => t.status === 'completed').length
  const pendingToday = todayTodos.filter((t) => t.status === 'pending' || t.status === 'in_progress').length

  const todaySessions = sessions.filter((s) => s.session_date === today)
  const todayHours = todaySessions.reduce((sum, s) => sum + s.hours, 0)

  const lastMock = marks[0]
  const lastMockPercent = lastMock && lastMock.total_out_of
    ? Math.round((lastMock.total_marks! / lastMock.total_out_of) * 100)
    : null

  // Weekly hours chart data
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = format(d, 'yyyy-MM-dd')
    const daySessions = sessions.filter((s) => s.session_date === dateStr)
    return {
      day: format(d, 'EEE'),
      Physics: daySessions.filter((s) => s.subject === 'Physics').reduce((sum, s) => sum + s.hours, 0),
      Chemistry: daySessions.filter((s) => s.subject === 'Chemistry').reduce((sum, s) => sum + s.hours, 0),
      Mathematics: daySessions.filter((s) => s.subject === 'Mathematics').reduce((sum, s) => sum + s.hours, 0),
    }
  })

  // Marks trend
  const marksTrend = marks.slice(0, 8).reverse().map((m) => ({
    name: m.test_name.slice(0, 8),
    score: m.total_out_of ? Math.round((m.total_marks! / m.total_out_of) * 100) : 0,
  }))

  // Subject hours breakdown
  const subjectHours = ['Physics', 'Chemistry', 'Mathematics'].map((sub) => ({
    subject: sub,
    hours: parseFloat(sessions.filter((s) => s.subject === sub).reduce((sum, s) => sum + s.hours, 0).toFixed(1)),
    color: SUBJECT_COLORS[sub],
  }))

  const totalHours = subjectHours.reduce((sum, s) => sum + s.hours, 0)

  const pendingAnalysis = marks.filter((m) => !m.analysis_done).length
  const overdueCount = todos.filter((t) => t.status === 'overdue').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {profile?.full_name ? `${profile.full_name.split(' ')[0]}'s Dashboard` : 'Dashboard'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {profile?.streak && profile.streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            }}>
              <Flame size={14} color="#F59E0B" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>
                {profile.streak} day streak
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Alerts */}
      {(overdueCount > 0 || pendingAnalysis > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {overdueCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(255,51,51,0.06)',
                border: '1px solid rgba(255,51,51,0.2)',
              }}
            >
              <AlertTriangle size={14} color="#FF3333" />
              <span style={{ fontSize: 13, color: '#FF6666' }}>
                <strong>{overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</strong> — Stop procrastinating. Do them now.
              </span>
            </motion.div>
          )}
          {pendingAnalysis > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <AlertTriangle size={14} color="#F59E0B" />
              <span style={{ fontSize: 13, color: '#FBBF24' }}>
                <strong>{pendingAnalysis} mock test{pendingAnalysis !== 1 ? 's' : ''}</strong> without proper analysis. Analyze them now.
              </span>
            </motion.div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard
          label="Hours Today"
          value={todayHours.toFixed(1) + 'h'}
          sub={`${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} logged`}
          color={todayHours >= 8 ? '#10B981' : todayHours >= 5 ? '#F59E0B' : '#FF3333'}
          icon={Clock}
        />
        <StatCard
          label="Tasks Completed"
          value={`${completedToday}/${completedToday + pendingToday}`}
          sub={`${pendingToday} pending today`}
          color="var(--text-primary)"
          icon={CheckCircle2}
        />
        <StatCard
          label="Last Mock Score"
          value={lastMockPercent !== null ? `${lastMockPercent}%` : '—'}
          sub={lastMock ? lastMock.test_name : 'No mocks recorded'}
          color={lastMockPercent !== null ? (lastMockPercent >= 70 ? '#10B981' : lastMockPercent >= 50 ? '#F59E0B' : '#FF3333') : 'var(--text-muted)'}
          icon={TrendingUp}
        />
        <StatCard
          label="Discipline Score"
          value={profile?.discipline_score ?? 0}
          sub="Updated daily"
          color="#8B5CF6"
          icon={Target}
        />
      </div>

      {/* Exam countdowns */}
      {exams.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Upcoming Exams
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {exams.slice(0, 4).map((exam) => (
              <ExamCountdownCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Weekly study hours */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Weekly Study Hours
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekDays} barSize={8} barGap={2}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#3D5068' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#3D5068' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Physics" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Chemistry" fill="#10B981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Mathematics" fill="#3B82F6" radius={[2, 2, 0, 0]} />
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

        {/* Mock performance trend */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Mock Score Trend
          </div>
          {marksTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={marksTrend}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#3D5068' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#3D5068' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-hover)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  itemStyle={{ color: '#3B82F6' }}
                />
                <Line
                  type="monotone" dataKey="score"
                  stroke="#3B82F6" strokeWidth={2}
                  dot={{ fill: '#3B82F6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No mock data yet
            </div>
          )}
        </div>
      </div>

      {/* Subject time split */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px',
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Subject Time Distribution (All-time)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {subjectHours.map(({ subject, hours, color }) => {
            const pct = totalHours > 0 ? (hours / totalHours) * 100 : 0
            const isUnbalanced = pct < 25 && totalHours > 10
            return (
              <div key={subject}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{subject}</span>
                    {isUnbalanced && (
                      <span style={{ fontSize: 10, color: '#FF3333', background: 'rgba(255,51,51,0.1)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                        WEAK
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {hours}h · {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="progress-fill"
                    style={{ background: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's task preview */}
      {todayTodos.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            Today's Tasks Preview
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayTodos.slice(0, 5).map((task) => (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, background: 'var(--bg-hover)',
                  border: task.status === 'overdue' ? '1px solid rgba(255,51,51,0.2)' : '1px solid transparent',
                }}
              >
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: task.status === 'completed' ? '#10B981' : task.status === 'overdue' ? '#FF3333' : '#F59E0B',
                  flexShrink: 0,
                }} />
                <span style={{
                  flex: 1, fontSize: 13, color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                }}>
                  {task.title}
                </span>
                {task.subject && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                    color: SUBJECT_COLORS[task.subject] || 'var(--text-muted)',
                    background: `${SUBJECT_COLORS[task.subject]}15` || 'var(--bg-hover)',
                  }}>
                    {task.subject}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
