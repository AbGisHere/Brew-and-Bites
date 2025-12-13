import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import API_URL from '../config'; // <--- 1. IMPORT THIS

export default function LoginModal({ open, onClose, defaultRole = 'admin', onLoggedIn }) {
  const { login } = useAuth()
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

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      // 2. USE THE API_URL VARIABLE (Note the backticks ` `)
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
      
      console.log('Login successful, user:', user)
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 pt-20">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{role === 'admin' ? 'Admin' : 'Staff'} Login</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-600">Login as</label>
            <div className="mt-1 flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" value="admin" checked={role==='admin'} onChange={() => setRole('admin')} /> Admin
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="role" value="staff" checked={role==='staff'} onChange={() => setRole('staff')} /> Staff
              </label>
            </div>
          </div>

          {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Username</label>
              <input 
                value={username} 
                onChange={e=>setUsername(e.target.value)} 
                className="input w-full" 
                required 
                disabled={isLoading}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                className="input w-full" 
                required 
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white py-2 rounded-md font-medium transition-colors ${isLoading ? 'bg-gray-400' : 'bg-primary hover:bg-opacity-90'}`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="text-xs text-gray-500 mt-3">
            Demo admin: admin/admin123, waiter: waiter1/waiter123
          </div>
        </div>
      </div>
    </div>
  )
}