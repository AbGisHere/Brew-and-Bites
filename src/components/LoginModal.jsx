import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import API_URL from '../config'

export default function LoginModal({ open, onClose, defaultRole = 'admin', onLoggedIn }) {
  const { login } = useAuth()
  const { isDark } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setRole(defaultRole)
      setUsername('')
      setPassword('')
      setError('')
      setIsLoading(false)
    }
  }, [defaultRole, open])

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Invalid credentials')
        setIsLoading(false)
        return
      }
      const user = data
      if (role === 'admin') {
        if (user.role !== 'admin') {
          setError('Admin access required. Please use admin credentials.')
          setIsLoading(false)
          return
        }
      } else if (role === 'staff') {
        if (!['waiter', 'chef'].includes(user.role)) {
          setError('Invalid staff role. Please contact an administrator.')
          setIsLoading(false)
          return
        }
      }
      login(user)
      onClose?.()
      onLoggedIn?.(user)
    } catch (err) {
      console.error(err)
      setError('Cannot connect to server. Is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  // ── theme tokens ──────────────────────────────────────────────────────────
  const cardBg      = isDark ? '#120804'              : '#FFF8F0'
  const cardBorder  = isDark ? 'rgba(212,167,106,0.18)' : 'rgba(139,90,43,0.18)'
  const labelColor  = isDark ? 'rgba(212,167,106,0.7)'  : 'rgba(139,90,43,0.8)'
  const textColor   = isDark ? '#F5DEB3'              : '#1a0805'
  const inputBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(139,90,43,0.06)'
  const inputBorder = isDark ? 'rgba(212,167,106,0.22)' : 'rgba(139,90,43,0.22)'
  const inputFocus  = isDark ? '#D4A76A'              : '#8B5A2B'
  const dividerColor= isDark ? 'rgba(212,167,106,0.12)' : 'rgba(139,90,43,0.12)'
  const hintColor   = isDark ? 'rgba(212,167,106,0.35)' : 'rgba(139,90,43,0.4)'
  const goldGrad    = isDark
    ? 'linear-gradient(135deg, #D4A76A 0%, #B9864B 60%, #8B5A2B 100%)'
    : 'linear-gradient(135deg, #8B5A2B 0%, #693319 60%, #B9864B 100%)'
  const btnText     = isDark ? '#0a0605' : '#FFF8F0'

  // radio pill styles
  const pillActive  = {
    background: isDark ? 'rgba(212,167,106,0.18)' : 'rgba(139,90,43,0.14)',
    borderColor: isDark ? '#D4A76A'               : '#8B5A2B',
    color:       isDark ? '#D4A76A'               : '#8B5A2B',
  }
  const pillInactive = {
    background: 'transparent',
    borderColor: isDark ? 'rgba(212,167,106,0.2)' : 'rgba(139,90,43,0.2)',
    color:       isDark ? 'rgba(212,167,106,0.5)' : 'rgba(139,90,43,0.5)',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{
            background: isDark
              ? 'rgba(10,6,5,0.82)'
              : 'rgba(245,230,208,0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: isDark
                ? '0 0 0 1px rgba(212,167,106,0.06), 0 32px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)'
                : '0 0 0 1px rgba(139,90,43,0.07), 0 24px 60px rgba(139,90,43,0.14), 0 8px 20px rgba(0,0,0,0.08)',
              borderRadius: '1.25rem',
              width: '100%',
              maxWidth: '380px',
              overflow: 'hidden',
            }}
          >
            {/* Gold top bar */}
            <div style={{ height: '3px', background: goldGrad }} />

            <div style={{ padding: '2rem' }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#D4A76A' : '#8B5A2B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" x2="6" y1="2" y2="4" /><line x1="10" x2="10" y1="2" y2="4" /><line x1="14" x2="14" y1="2" y2="4" />
                    </svg>
                    <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: isDark ? '#D4A76A' : '#8B5A2B', fontWeight: 600 }}>
                      Brew &amp; Bites
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
                    {role === 'admin' ? 'Admin' : 'Staff'} Login
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  style={{ color: labelColor, lineHeight: 1, padding: '4px', marginTop: '-2px' }}
                  className="hover:opacity-100 opacity-60 transition-opacity"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Role picker */}
              <div className="mb-5">
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: labelColor, marginBottom: '0.5rem', fontWeight: 600 }}>
                  Access level
                </p>
                <div className="flex gap-2">
                  {['admin', 'staff'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        transition: 'all 0.18s ease',
                        cursor: 'pointer',
                        ...(role === r ? pillActive : pillInactive),
                      }}
                    >
                      {r === 'admin' ? 'Admin' : 'Staff'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: dividerColor, marginBottom: '1.25rem' }} />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
                    exit={{    opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      overflow: 'hidden',
                      borderRadius: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.78rem',
                      color: '#e07070',
                      background: isDark ? 'rgba(220,60,60,0.1)' : 'rgba(220,60,60,0.07)',
                      border: '1px solid rgba(220,60,60,0.2)',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={submit} className="space-y-4">
                {[
                  { label: 'Username', field: 'username', type: 'text',     val: username, set: setUsername },
                  { label: 'Password', field: 'password', type: 'password', val: password, set: setPassword },
                ].map(({ label, field, type, val, set }) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: labelColor, fontWeight: 600, marginBottom: '0.4rem' }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      value={val}
                      onChange={e => set(e.target.value)}
                      required
                      disabled={isLoading}
                      placeholder={`Enter your ${label.toLowerCase()}`}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${inputBorder}`,
                        background: inputBg,
                        color: textColor,
                        fontSize: '0.88rem',
                        outline: 'none',
                        transition: 'border-color 0.18s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = inputFocus}
                      onBlur={e => e.target.style.borderColor = inputBorder}
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.6rem',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isLoading ? (isDark ? 'rgba(212,167,106,0.25)' : 'rgba(139,90,43,0.2)') : goldGrad,
                    color: isLoading ? labelColor : btnText,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    transition: 'opacity 0.18s, transform 0.14s',
                    marginTop: '0.5rem',
                    boxShadow: isLoading ? 'none' : isDark
                      ? '0 4px 20px rgba(212,167,106,0.3)'
                      : '0 4px 16px rgba(139,90,43,0.2)',
                  }}
                  onMouseEnter={e => { if (!isLoading) e.currentTarget.style.opacity = '0.88' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                  onMouseDown={e => { if (!isLoading) e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  {isLoading ? 'Verifying…' : 'Sign In'}
                </button>
              </form>

              {/* Demo hint */}
              <p style={{ marginTop: '1.25rem', fontSize: '0.68rem', color: hintColor, lineHeight: 1.6, textAlign: 'center' }}>
                admin / admin123 &nbsp;·&nbsp; waiter1 / waiter123 &nbsp;·&nbsp; chef1 / chef123
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
