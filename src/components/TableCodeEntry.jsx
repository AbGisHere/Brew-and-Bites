// src/components/TableCodeEntry.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../config' // THE CRITICAL IMPORT

export default function TableCodeEntry() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Debugging Logs (Check your console!)
    console.log('🔍 Connecting to Backend at:', API_URL)
    console.log('🔍 Checking Code:', code)

    try {
      // 2. The Dynamic Fetch (No more localhost hardcoding)
      const response = await fetch(`${API_URL}/api/tables/by-code/${code}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid table code')
      }

      // 3. Success Logic
      console.log('✅ Access Granted:', data)
      localStorage.setItem('currentTable', JSON.stringify(data))
      
      // Redirect to the Menu (Standardized route)
      navigate(`/customer-order?table=${code}`)
      
    } catch (err) {
      console.error('❌ Login Failed:', err)
      setError(err.message || 'Could not verify code. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Brew & Bites</h1>
          <p className="text-gray-500 mt-2">Please enter your table code to view the menu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="sr-only">Table Code</label>
            <input
              id="code"
              type="text"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Integers only
              placeholder="000 000"
              className="w-full text-center text-4xl font-mono tracking-[0.5em] py-4 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder-gray-300 text-gray-800"
              required
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-center text-sm font-medium border border-red-100 animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Verifying...
                </span>
            ) : 'View Menu'}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-400 mt-6">
            Trouble connecting? Ask a waiter for help.
        </p>
      </div>
    </div>
  )
}