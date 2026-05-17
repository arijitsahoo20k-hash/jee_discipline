'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Zap, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAuth() {
    if (!email || !password) return toast.error('Fill in all fields')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { toast.error(error.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          full_name: name || email.split('@')[0],
          target_exam: 'JEE Advanced',
          streak: 0,
          discipline_score: 0,
        })
        toast.success('Account created! Welcome.')
        router.push('/dashboard')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { toast.error('Invalid credentials'); setLoading(false); return }
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(26,37,51,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(26,37,51,0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300,
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%', maxWidth: 420, position: 'relative',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 40px rgba(59,130,246,0.3)',
            }}
          >
            <Zap size={26} color="white" fill="white" />
          </motion.div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Discipline OS
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            JEE Accountability System
          </p>
        </div>

        {/* Warning quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 28,
            background: 'rgba(255,51,51,0.05)',
            border: '1px solid rgba(255,51,51,0.15)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <AlertTriangle size={14} color="#FF5555" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#FF7070', lineHeight: 1.5 }}>
            Every day you waste is a day your competition doesn't.
          </span>
        </motion.div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-active)',
          borderRadius: 16, padding: 32,
        }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 10, padding: 4, marginBottom: 24,
          }}>
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  background: mode === m ? 'var(--bg-card)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Name</label>
                <input
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px' }}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '11px 14px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                style={{ width: '100%', padding: '11px 14px' }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAuth}
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? 'var(--bg-hover)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                border: 'none', borderRadius: 10,
                color: 'white', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', marginTop: 4,
              }}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Start Discipline System'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
