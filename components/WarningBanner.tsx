'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Flame } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const MISTAKES = [
  'Doing everything randomly',
  'Not completing modules — procrastinating',
  'Not practicing enough questions',
  'Not giving mocks seriously or analyzing them',
  'Not giving equal attention to all 3 subjects',
  'Not revising older topics — forgetting them',
  '"Kal kar lenge" attitude',
]

export default function WarningBanner() {
  const { bannerVisible, setBannerVisible } = useAppStore()

  return (
    <AnimatePresence>
      {bannerVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'linear-gradient(135deg, rgba(30,0,0,0.98) 0%, rgba(20,5,5,0.98) 100%)',
            borderBottom: '1px solid rgba(255,51,51,0.25)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Pulsing red top line */}
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #FF3333, #FF6666, #FF3333, transparent)',
            }}
          />

          <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255,51,51,0.12)',
                border: '1px solid rgba(255,51,51,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <Flame size={18} color="#FF4444" />
            </motion.div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: '#FF4444',
                    textTransform: 'uppercase',
                  }}
                >
                  ⚠ Critical Reminder — Your Past Mistakes
                </span>
                <div
                  style={{
                    height: 1,
                    flex: 1,
                    background: 'linear-gradient(90deg, rgba(255,51,51,0.3), transparent)',
                  }}
                />
              </div>

              {/* Mistake pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {MISTAKES.map((mistake, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '4px 11px',
                      borderRadius: 20,
                      background: 'rgba(255,51,51,0.08)',
                      border: '1px solid rgba(255,51,51,0.2)',
                      color: '#FF8080',
                      letterSpacing: '0.02em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {i + 1}. {mistake}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setBannerVisible(false)}
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4A5568',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,51,51,0.1)'
                e.currentTarget.style.color = '#FF4444'
                e.currentTarget.style.borderColor = 'rgba(255,51,51,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = '#4A5568'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
