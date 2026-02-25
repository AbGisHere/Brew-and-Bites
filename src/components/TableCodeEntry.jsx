import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useTheme } from '../context/ThemeContext'
import API_URL from '../config'

export default function TableCodeEntry({ open, onClose }) {
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { isDark }            = useTheme()
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/tables/by-code/${code}`)
      const data     = await response.json()
      if (!response.ok) throw new Error(data.error || 'Invalid table code')
      localStorage.setItem('currentTable', JSON.stringify(data))
      onClose?.()
      navigate(`/customer-order?table=${code}`)
    } catch (err) {
      setError(err.message || 'Could not verify code. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCode('')
    setError('')
    onClose?.()
  }

  // ── theme tokens ──────────────────────────────────────────────────────────
  const cardBg      = isDark ? '#120804'                    : '#FFF8F0'
  const cardBorder  = isDark ? 'rgba(212,167,106,0.18)'     : 'rgba(139,90,43,0.18)'
  const cardShadow  = isDark
    ? '0 0 0 1px rgba(212,167,106,0.06), 0 40px 90px rgba(0,0,0,0.75), 0 12px 30px rgba(0,0,0,0.5)'
    : '0 0 0 1px rgba(139,90,43,0.07), 0 28px 70px rgba(139,90,43,0.16), 0 8px 24px rgba(0,0,0,0.08)'
  const goldGrad    = isDark
    ? 'linear-gradient(135deg, #D4A76A 0%, #B9864B 60%, #8B5A2B 100%)'
    : 'linear-gradient(135deg, #8B5A2B 0%, #693319 60%, #B9864B 100%)'
  const textColor   = isDark ? '#F5DEB3'                    : '#1a0805'
  const subColor    = isDark ? 'rgba(245,222,179,0.55)'     : 'rgba(26,8,5,0.55)'
  const labelColor  = isDark ? 'rgba(212,167,106,0.70)'     : 'rgba(139,90,43,0.80)'
  const hintColor   = isDark ? 'rgba(212,167,106,0.32)'     : 'rgba(139,90,43,0.38)'
  const inputBg     = isDark ? 'rgba(255,255,255,0.04)'     : 'rgba(139,90,43,0.06)'
  const inputBorder = isDark ? 'rgba(212,167,106,0.22)'     : 'rgba(139,90,43,0.22)'
  const inputFocus  = isDark ? '#D4A76A'                    : '#8B5A2B'
  const divider     = isDark ? 'rgba(212,167,106,0.10)'     : 'rgba(139,90,43,0.10)'
  const btnText     = isDark ? '#0a0605'                    : '#FFF8F0'
  const dotFull     = isDark ? '#D4A76A'                    : '#8B5A2B'
  const dotEmpty    = isDark ? 'rgba(212,167,106,0.16)'     : 'rgba(139,90,43,0.14)'
  const disabled    = code.length < 6 || loading

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={handleClose}
          style={{
            background: isDark
              ? 'rgba(10,6,5,0.82)'
              : 'rgba(245,230,208,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {/* ── Modal card ── */}
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: cardBg, border: `1px solid ${cardBorder}`,
              boxShadow: cardShadow, borderRadius: '1.35rem',
              width: '100%', maxWidth: '400px', overflow: 'hidden',
            }}
          >
            {/* Gold accent bar */}
            <div style={{ height: '3px', background: goldGrad }} />

            <div className="tce-inner" style={{ padding: '2rem' }}>

              {/* ── Header ── */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  {/* Eyebrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke={isDark ? '#D4A76A' : '#8B5A2B'} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
                      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
                      <line x1="6" x2="6" y1="2" y2="4"/>
                      <line x1="10" x2="10" y1="2" y2="4"/>
                      <line x1="14" x2="14" y1="2" y2="4"/>
                    </svg>
                    <span style={{
                      fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase',
                      color: isDark ? '#D4A76A' : '#8B5A2B', fontWeight: 600,
                    }}>
                      Brew &amp; Bites
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
                    Find your table
                  </h3>
                </div>
                {/* Close button */}
                <button
                  onClick={handleClose}
                  style={{ color: labelColor, lineHeight: 1, padding: '4px', marginTop: '-2px', background: 'none', border: 'none', cursor: 'pointer' }}
                  className="hover:opacity-100 opacity-60 transition-opacity"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Subtitle */}
              <p style={{ fontSize: '0.82rem', color: subColor, lineHeight: 1.55, marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
                Enter the 6-digit code on your table card to browse our menu and place orders.
              </p>

              {/* ── Divider ── */}
              <div style={{ height: '1px', background: divider, marginBottom: '1.5rem' }} />

              {/* ── Form ── */}
              <form onSubmit={handleSubmit}>

                {/* Label */}
                <p style={{
                  fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: labelColor, fontWeight: 600, textAlign: 'center', marginBottom: '0.65rem',
                }}>
                  Table Code
                </p>

                {/* Large monospace input */}
                <input
                  className="tce-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => { setError(''); setCode(e.target.value.replace(/\D/g, '')) }}
                  placeholder="······"
                  required
                  autoComplete="off"
                  autoFocus
                  style={{
                    display: 'block', width: '100%', textAlign: 'center',
                    fontSize: '2rem', fontWeight: 800, fontFamily: 'monospace',
                    letterSpacing: '0.55em',
                    paddingLeft: '0.55em', paddingRight: '0',
                    paddingTop: '0.9rem', paddingBottom: '0.9rem',
                    borderRadius: '0.7rem',
                    border: `1.5px solid ${inputBorder}`,
                    background: inputBg, color: textColor,
                    outline: 'none', transition: 'border-color 0.18s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e  => e.target.style.borderColor = inputFocus}
                  onBlur={e   => e.target.style.borderColor = inputBorder}
                />

                {/* 6-dot progress pip strip */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', marginTop: '0.7rem', marginBottom: '1.5rem' }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: i === code.length - 1 ? [1, 1.35, 1] : 1 }}
                      transition={{ duration: 0.22 }}
                      style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: i < code.length ? dotFull : dotEmpty,
                        transition: 'background 0.15s',
                      }}
                    />
                  ))}
                </div>

                {/* Error banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
                      exit={{    opacity: 0, height: 0,      marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        overflow: 'hidden', borderRadius: '0.5rem',
                        padding: '0.6rem 0.8rem', fontSize: '0.78rem',
                        textAlign: 'center', color: '#e07070',
                        background: isDark ? 'rgba(220,60,60,0.10)' : 'rgba(220,60,60,0.07)',
                        border: '1px solid rgba(220,60,60,0.22)',
                      }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={disabled}
                  style={{
                    width: '100%', padding: '0.875rem', borderRadius: '0.65rem',
                    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                    background: disabled
                      ? (isDark ? 'rgba(212,167,106,0.18)' : 'rgba(139,90,43,0.14)')
                      : goldGrad,
                    color: disabled ? labelColor : btnText,
                    fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.14em',
                    textTransform: 'uppercase', transition: 'opacity 0.18s, transform 0.14s',
                    boxShadow: disabled ? 'none' : isDark
                      ? '0 4px 22px rgba(212,167,106,0.32)'
                      : '0 4px 18px rgba(139,90,43,0.22)',
                  }}
                  onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.87' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  onMouseDown={e  => { if (!disabled) e.currentTarget.style.transform = 'scale(0.985)' }}
                  onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <svg style={{ animation: 'tce-spin 0.8s linear infinite', width: '15px', height: '15px' }}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Verifying…
                      </span>
                    : 'View Menu →'
                  }
                </button>
              </form>

              {/* Hint */}
              <p style={{ marginTop: '1.25rem', fontSize: '0.68rem', color: hintColor, textAlign: 'center', lineHeight: 1.6 }}>
                Can't find your code? Ask a waiter for help.
              </p>

            </div>
          </motion.div>

          <style>{`
            @keyframes tce-spin { to { transform: rotate(360deg); } }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
