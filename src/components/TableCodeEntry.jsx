import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../config'

export default function TableCodeEntry() {
  const [tableCode, setTableCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const value = e.target.value
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6)
    setTableCode(numericValue)
    setError('')
  }

  const handleSubmit = async () => {
    if (tableCode.length !== 6) {
      setError('Please enter exactly 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔍 Using API_URL:', API_URL)
      console.log('🔍 Table code:', tableCode)
      const response = await fetch(`${API_URL}/api/tables/by-code/${tableCode}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid table code')
      }

      localStorage.setItem('currentTable', JSON.stringify(data))
      navigate(`/customer-order?table=${tableCode}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = () => {
    const scannedCode = prompt('Enter the 6-digit table code from QR scan:')
    if (scannedCode) {
      const numericCode = scannedCode.replace(/[^0-9]/g, '').slice(0, 6)
      setTableCode(numericCode)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '28rem',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            Welcome to Brew & Bites
          </h1>
          <p style={{ color: '#6b7280' }}>
            Enter your table code to start ordering
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Table Code (6 digits)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={tableCode}
              onChange={handleInputChange}
              placeholder="000000"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                textAlign: 'center',
                letterSpacing: '0.1em',
                outline: 'none'
              }}
              maxLength={6}
            />
            {tableCode.length > 0 && (
              <div style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  backgroundColor: tableCode.length === 6 ? '#10b981' : '#f59e0b'
                }}></div>
              </div>
            )}
          </div>
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.25rem'
          }}>
            Enter the 6-digit code from your table
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleSubmit}
            disabled={loading || tableCode.length !== 6}
            style={{
              width: '100%',
              backgroundColor: loading || tableCode.length !== 6 ? '#9ca3af' : '#8b5a2b',
              color: 'white',
              fontWeight: '600',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: loading || tableCode.length !== 6 ? 'not-allowed' : 'pointer',
              opacity: loading || tableCode.length !== 6 ? 0.5 : 1
            }}
          >
            {loading ? 'Validating...' : 'Start Ordering'}
          </button>

          <button
            onClick={handleQRScan}
            style={{
              width: '100%',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              fontWeight: '600',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan QR Code
          </button>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Home
          </button>
        </div>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#eff6ff',
          borderRadius: '0.5rem'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#1e40af'
          }}>
            <strong>Test Codes:</strong><br />
            Table 1: 910474<br />
            Table 2: 139631
          </p>
        </div>
      </div>
    </div>
  )
}
