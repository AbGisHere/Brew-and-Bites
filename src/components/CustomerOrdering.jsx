// src/components/CustomerOrdering.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import API_URL from '../config'
import { colors, AnimatedButton, Section, statusBadgeStyles, deleteButtonStyles, quantityButtonStyles } from '../styles/shared'
import TrashIcon from './icons/TrashIcon'

// Access logging function
const logAccess = async (pageType, userId, tableId, deviceId) => {
  try {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ip: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip).catch(() => 'unknown')
    }
    
    await fetch(`${API_URL}/api/log-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageType, userId, tableId, deviceId, deviceInfo })
    })
  } catch (error) {
    console.error('Failed to log access:', error)
  }
}

export default function CustomerOrdering({ tableId: propTableId, deviceId: propDeviceId }) {
  // --- Core Data ---
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [table, setTable] = useState(null)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [orderStatus, setOrderStatus] = useState(null)
  
  // --- UI States ---
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [showCartDetails, setShowCartDetails] = useState(false)

  // --- Auth & Session States ---
  const [customer, setCustomer] = useState(null)
  const [customerToken, setCustomerToken] = useState('')  // Never restore from localStorage — always re-auth

  // Auth Flow: 'phone' -> 'otp' -> 'identity' (select user) -> 'name' (if new) -> 'authed'
  const [authStep, setAuthStep] = useState('phone')
  const [authName, setAuthName] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authOtp, setAuthOtp] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const navigate = useNavigate()

  const isOrderClosed = currentOrder?.status === 'closed' || currentOrder?.status === 'billed' || currentOrder?.status === 'completed'
  const isCustomerAuthed = Boolean(customerToken && customer)
  const disableOrdering = isOrderClosed || !isCustomerAuthed

  const normalizePhoneClient = (p) => String(p || '').replace(/\D/g, '')

  // 1. Always start with a clean auth state — clear any stale localStorage data on mount
  useEffect(() => {
    localStorage.removeItem('cafe_customer_token')
    localStorage.removeItem('cafe_customer_name')
    localStorage.removeItem('cafe_customer_phone')
    setCustomer(null)
    setCustomerToken('')
    setAuthStep('phone')
  }, [])

  // 2. Table & Menu Loading (Only after auth or partially in background)
  useEffect(() => {
    // We fetch table info early to know if there's an existing order for Auth Flow
    const init = async () => {
        let currentTableCode = propTableId
        if (!currentTableCode) {
            const urlParams = new URLSearchParams(window.location.search)
            currentTableCode = urlParams.get('table')
        }

        if (currentTableCode) {
            await fetchTableInfo(currentTableCode)
        } else {
            // Fallback
             const storedTable = localStorage.getItem('currentTable')
             if (storedTable) {
               const tData = JSON.parse(storedTable)
               setTable(tData)
               await fetchExistingOrder(tData._id)
             }
        }
        await fetchMenu()
    }
    init()
  }, [propTableId, propDeviceId])

  // 3. Polling Logic
  useEffect(() => {
    if (currentOrder && currentOrder._id) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/api/orders/${currentOrder._id}`)
          if (response.ok) {
            const orderData = await response.json()
            setOrderStatus(orderData.status)
            setCurrentOrder(orderData)
            
            // If order closes while viewing, force re-render to receipt view
            if (orderData.status === 'completed' || orderData.status === 'billed') {
               // Optional: trigger anything else needed
            }
          }
        } catch (err) {
          console.error('Polling Error:', err)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [currentOrder])


  // --- API Helpers ---

  const fetchTableInfo = async (tableCode) => {
    try {
      const response = await fetch(`${API_URL}/api/tables/by-code/${tableCode}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Invalid table code')
      setTable(data)
      localStorage.setItem('currentTable', JSON.stringify(data))
      
      // Check for existing order immediately
      await fetchExistingOrder(data._id)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchExistingOrder = async (tableId) => {
    try {
      const orderRes = await fetch(`${API_URL}/api/orders/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      })
      const orderData = await orderRes.json()
      if (orderRes.ok && orderData.items) {
        setCurrentOrder(orderData)
        return orderData
      }
    } catch (err) {
      console.log('No existing order found:', err.message)
    }
    return null
  }

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_URL}/api/menu`)
      const data = await response.json()
      setMenu(data)
    } catch (err) {
      setError('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  // --- Auth Handlers (Multi-User Logic) ---

  const requestOtp = async () => {
    const phone = normalizePhoneClient(authPhone)
    if (!phone || phone.length < 10) return setAuthError('Enter a valid 10-digit phone number')
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch(`${API_URL}/api/customer/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      setAuthStep('otp')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const verifyOtp = async () => {
    const phone = normalizePhoneClient(authPhone)
    const otp = String(authOtp || '').trim()
    if (!otp) return setAuthError('Enter the OTP')
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch(`${API_URL}/api/customer/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP')

      // OTP verified — now decide identity step based on who's already at the table
      let latestOrder = currentOrder
      if (table?._id) latestOrder = await fetchExistingOrder(table._id)

      if (latestOrder?.guests?.length > 0) {
        // If this phone is already registered as a guest, auto-identify
        const matchedGuest = latestOrder.guests.find(
          g => g.phone && normalizePhoneClient(g.phone) === phone
        )
        if (matchedGuest) {
          completeLogin(matchedGuest.name, phone)
          return
        }
        // Others are seated — let them pick or join as new
        setAuthStep('identity')
      } else {
        // First person at this table — just ask for name
        setAuthStep('name')
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleIdentitySelection = (selectedName) => {
      completeLogin(selectedName, authPhone)
  }

  const handleNameSubmit = () => {
      if (!authName.trim()) return setAuthError('Name is required')
      completeLogin(authName, authPhone)
  }

  const completeLogin = (name, phone) => {
      const token = 'mock-token-' + Date.now()
      localStorage.setItem('cafe_customer_token', token)
      localStorage.setItem('cafe_customer_name', name)
      localStorage.setItem('cafe_customer_phone', phone)
      
      setCustomerToken(token)
      setCustomer({ name, phone })
      setAuthStep('authed') // Done
      
      // Register guest on backend
      if (table?._id) {
          fetch(`${API_URL}/api/orders/join`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  tableId: table._id, 
                  guest: { name, phone } 
              })
          }).catch(e => console.error(e))
      }
      
      logAccess('CustomerOrdering', name, table?.tableCode, propDeviceId)
  }

  const logoutCustomer = () => {
    localStorage.removeItem('cafe_customer_token')
    localStorage.removeItem('cafe_customer_name')
    localStorage.removeItem('cafe_customer_phone')
    setCustomerToken('')
    setCustomer(null)
    setAuthStep('phone')
    setAuthOtp('')
    setAuthName('')
    setAuthError('')
  }


  // --- Cart & Menu Logic ---

  const groupedMenu = useMemo(() => {
    return menu.reduce((acc, item) => {
      if (item.available === false) return acc;
      const category = item.category || 'Others';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [menu]);

  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({...prev, [category]: !prev[category]}))
  }

  const addToCart = (item) => {
    const baselineQty = getBaselineQtyForItem(item._id)

    setCart(prev => {
      const existing = prev.find(i => i._id === item._id)
      const existingDelta = existing?.qty || 0

      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: existingDelta + 1 } : i)
      }

      // If item exists in order, we add new delta. 
      // CRITICAL: We tag it with the CURRENT USER'S NAME
      return [...prev, { 
          _id: item._id, 
          qty: 1, 
          name: item.name, 
          price: item.price,
          orderedBy: customer?.name 
      }]
    })
  }

  const getBaselineQtyForItem = (itemId) => {
    return currentOrder?.items?.reduce((t, it) => {
      if (it.itemId === itemId) return t + (it.qty || 0)
      return t
    }, 0) || 0
  }

  const updateQuantity = (itemId, newQty) => {
    const baselineQty = getBaselineQtyForItem(itemId)

    if (baselineQty > 0) {
      const desiredTotal = Math.max(newQty, baselineQty)
      const desiredDelta = desiredTotal - baselineQty

      if (desiredDelta <= 0) {
        setCart(prev => prev.filter(i => i._id !== itemId))
        return
      }

      setCart(prev => {
        const existing = prev.find(i => i._id === itemId)
        if (existing) return prev.map(i => i._id === itemId ? { ...i, qty: desiredDelta } : i)
        return [...prev, { _id: itemId, qty: desiredDelta, orderedBy: customer?.name }]
      })
      return
    }

    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i._id !== itemId))
      return
    }

    setCart(prev => prev.map(i => i._id === itemId ? { ...i, qty: newQty } : i))
  }

  const getOrderTotal = () => {
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0)
    const orderTotal = currentOrder?.items?.reduce((t, i) => t + (i.price * i.qty), 0) || 0
    return cartTotal + orderTotal
  }

  const getTotalItemCount = () => {
    const cartCount = cart.reduce((total, item) => total + item.qty, 0)
    const orderCount = currentOrder?.items?.reduce((t, i) => t + i.qty, 0) || 0
    return cartCount + orderCount
  }


  // --- Order Submission ---

  const submitOrder = async () => {
    if (cart.length === 0) return setError('Cart is empty')
    if (!table?._id) return setError('Table info missing')

    setSubmitting(true)
    setError('')

    try {
      // Step A: Start/Get Order (send guest info to ensure they are in manifest)
      const orderRes = await fetch(`${API_URL}/api/orders/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            tableId: table._id,
            guest: { name: customer.name, phone: customer.phone }
        })
      })
      
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to start order')

      // Step B: Calculate Delta
      const baselineByItemId = (orderData.items || []).reduce((acc, it) => {
        if (it.status === 'served') return acc
        acc[it.itemId] = (acc[it.itemId] || 0) + (it.qty || 0)
        return acc
      }, {})

      const deltaItems = cart.map((ci) => {
          const baseline = baselineByItemId[ci._id] || 0
          const delta = ci.qty - baseline
          if (delta <= 0) return null
          return {
            itemId: ci._id,
            name: ci.name,
            price: ci.price,
            qty: delta,
            status: 'preparing',
            orderedBy: customer.name // Tag with identity
          }
        }).filter(Boolean)

      if (deltaItems.length === 0) {
        setSubmitting(false)
        return
      }

      // Step C: Smart Merge
      // Only merge if orderedBy matches, otherwise append as new row
      let finalItems = orderData.items ? [...orderData.items] : []
      deltaItems.forEach(deltaItem => {
        const existingIdx = finalItems.findIndex(i => 
            i.itemId === deltaItem.itemId && 
            i.status !== 'served' &&
            i.orderedBy === deltaItem.orderedBy // Strict merge
        )
        if (existingIdx >= 0) {
          finalItems[existingIdx].qty += deltaItem.qty
        } else {
          finalItems.push(deltaItem)
        }
      })

      // Step D: Update
      const updateRes = await fetch(`${API_URL}/api/orders/${orderData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: finalItems })
      })

      if (!updateRes.ok) throw new Error('Failed to update order items')
      const finalOrder = await updateRes.json()
      
      setCurrentOrder(finalOrder)
      setOrderStatus('preparing')
      setCart([])
      alert('Order placed successfully!')

    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // --- RENDERING ---

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #f8f4f1 0%, #e8dcc6 100%)',
      backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(212, 167, 106, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212, 167, 106, 0.05) 0%, transparent 50%)',
      position: 'relative'
    }}>
      <div className="text-center" style={{ padding: '40px' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
        <p className="mt-4" style={{ color: '#8B5A2B' }}>Loading...</p>
      </div>
    </div>
  )

  // AUTH MODAL
  if (!isCustomerAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #f8f4f1 0%, #e8dcc6 100%)',
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(212, 167, 106, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212, 167, 106, 0.05) 0%, transparent 50%)'
      }}>
        <div className="w-full max-w-md rounded-2xl p-6" style={{
          backdropFilter: 'blur(25px) saturate(150%)',
          WebkitBackdropFilter: 'blur(25px) saturate(150%)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(212, 167, 106, 0.2)',
          boxShadow: '0 16px 40px rgba(62, 39, 35, 0.12)'
        }}>
          <div className="text-2xl font-bold mb-1" style={{ color: '#3E2723' }}>
          {authStep === 'phone' && 'Welcome'}
          {authStep === 'otp' && 'Verify your number'}
          {authStep === 'identity' && "Who's ordering?"}
          {authStep === 'name' && "What\u2019s your name?"}
        </div>
        <div className="text-xs mb-4 flex gap-1 items-center" style={{ color: '#D4A76A' }}>
          {['phone','otp','identity','name'].map((s, i) => {
            const stepOrder = { phone: 0, otp: 1, identity: 2, name: authStep === 'identity' ? 3 : 2 }
            const current = stepOrder[authStep] ?? 0
            return <span key={s} className="w-2 h-2 rounded-full" style={{ background: i <= current ? '#D4A76A' : 'rgba(212,167,106,0.2)', display: ['phone','otp','name'].includes(s) ? 'inline-block' : 'none' }} />
          })}
        </div>
          
          {authStep === 'phone' && (
             <div className="space-y-4">
               <div className="text-sm mb-2" style={{ color: '#8B5A2B' }}>Enter your phone number to receive a one-time code.</div>
               <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#5D4037' }}>Phone Number</label>
                  <input
                    value={authPhone}
                    onChange={(e) => { setAuthError(''); setAuthPhone(e.target.value) }}
                    className="w-full rounded-lg px-3 py-2"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    style={{ border: '1px solid rgba(212, 167, 106, 0.25)', background: 'rgba(255, 255, 255, 0.8)' }}
                    onKeyDown={(e) => e.key === 'Enter' && requestOtp()}
                  />
               </div>
               <AnimatedButton onClick={requestOtp} disabled={authLoading} color={colors.primary} width="100%">
                  {authLoading ? 'Sending…' : 'Get OTP →'}
               </AnimatedButton>
             </div>
          )}

          {authStep === 'otp' && (
            <div className="space-y-4">
              <div className="text-sm" style={{ color: '#8B5A2B' }}>Enter the 6-digit code sent to <strong>{authPhone}</strong>.</div>
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(212,167,106,0.12)', color: '#8B5A2B', border: '1px solid rgba(212,167,106,0.2)' }}>
                Demo mode — OTP is printed in the server console.
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#5D4037' }}>OTP</label>
                <input
                  value={authOtp}
                  onChange={(e) => { setAuthError(''); setAuthOtp(e.target.value.replace(/\D/g, '')) }}
                  className="w-full rounded-lg px-3 py-2 text-center tracking-widest"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  style={{ border: '1px solid rgba(212, 167, 106, 0.25)', background: 'rgba(255, 255, 255, 0.8)', fontSize: '1.25rem', letterSpacing: '0.4em' }}
                  onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setAuthStep('phone'); setAuthOtp(''); setAuthError('') }} className="text-xs underline" style={{ color: '#8B5A2B', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Change number
                </button>
              </div>
              <AnimatedButton onClick={verifyOtp} disabled={authLoading} color={colors.primary} width="100%">
                {authLoading ? 'Verifying…' : 'Verify OTP'}
              </AnimatedButton>
            </div>
          )}

          {/* Identity Selection — shown when other guests are already at the table */}
          {authStep === 'identity' && (
             <div className="space-y-3">
                <div className="text-sm" style={{ color: '#8B5A2B' }}>
                    Someone's already ordering at this table. Are you one of them?
                </div>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {currentOrder?.guests?.map((g, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => handleIdentitySelection(g.name)}
                            className="w-full p-3 rounded-xl text-left flex justify-between items-center transition-all hover:scale-[1.01]"
                            style={{
                                background: 'rgba(212, 167, 106, 0.12)',
                                border: '1.5px solid rgba(212, 167, 106, 0.3)',
                                color: '#3E2723',
                                cursor: 'pointer',
                            }}
                        >
                            <div>
                                <div className="font-bold text-sm">{g.name}</div>
                                <div className="text-xs" style={{ color: '#8B5A2B' }}>Joined {new Date(g.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(212,167,106,0.25)', color: '#8B5A2B' }}>That's me</span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1" style={{ background: 'rgba(212,167,106,0.2)' }}></div>
                    <span className="text-xs" style={{ color: '#8B5A2B' }}>or</span>
                    <div className="h-px flex-1" style={{ background: 'rgba(212,167,106,0.2)' }}></div>
                </div>
                <button
                    type="button"
                    onClick={() => { setAuthName(''); setAuthStep('name') }}
                    className="w-full p-3 rounded-xl text-center font-semibold text-sm transition-all"
                    style={{
                        background: 'transparent',
                        border: '1.5px dashed rgba(212, 167, 106, 0.35)',
                        color: '#D4A76A',
                        cursor: 'pointer',
                    }}
                >
                    I'm a new person at this table
                </button>
             </div>
          )}

          {authStep === 'name' && (
            <div className="space-y-4">
              <div className="text-sm" style={{ color: '#8B5A2B' }}>
                {currentOrder?.guests?.length > 0
                  ? "What\u2019s your name? It\u2019ll appear on the shared order."
                  : "What\u2019s your name? We\u2019ll track your orders separately."}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#5D4037' }}>Your Name</label>
                <input
                  value={authName}
                  onChange={(e) => { setAuthError(''); setAuthName(e.target.value) }}
                  className="w-full rounded-lg px-3 py-2"
                  placeholder="e.g. Abhinav"
                  autoFocus
                  style={{ border: '1px solid rgba(212, 167, 106, 0.25)', background: 'rgba(255, 255, 255, 0.8)' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                />
              </div>
              <AnimatedButton onClick={handleNameSubmit} disabled={authLoading} color={colors.primary} width="100%">
                {authLoading ? 'Joining…' : 'Start Ordering →'}
              </AnimatedButton>
            </div>
          )}

          {authError && <div className="text-sm mt-3 text-center" style={{ color: '#d32f2f' }}>{authError}</div>}
        </div>
      </div>
    )
  }

  // RECEIPT VIEW
  if (isOrderClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{
        background: 'linear-gradient(135deg, #f8f4f1 0%, #e8dcc6 100%)',
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(212, 167, 106, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212, 167, 106, 0.05) 0%, transparent 50%)'
      }}>
        <div className="w-full max-w-2xl rounded-2xl p-6" style={{
          backdropFilter: 'blur(25px) saturate(150%)',
          WebkitBackdropFilter: 'blur(25px) saturate(150%)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(212, 167, 106, 0.2)',
          boxShadow: '0 16px 40px rgba(62, 39, 35, 0.12)'
        }}>
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="text-2xl font-bold" style={{ color: '#3E2723' }}>Receipt</div>
              <div className="text-sm" style={{ color: '#8B5A2B' }}>Order Closed. Thank you for dining!</div>
              <div className="text-sm mt-1" style={{ color: '#8B5A2B' }}>Customer: {customer?.name}</div>
            </div>
            <button type="button" className="text-sm underline" style={{ color: '#8B5A2B' }} onClick={logoutCustomer}>
              Start New
            </button>
          </div>

          <div className="mt-6" style={{ borderTop: '1px solid rgba(212, 167, 106, 0.15)' }}>
            <div className="pt-4 space-y-3">
              {(currentOrder?.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                      <span style={{ color: '#5D4037' }}>{it.name} <span style={{ color: '#8B5A2B' }}>x{it.qty}</span></span>
                      {/* Show who ordered it */}
                      {it.orderedBy && <div className="text-[10px]" style={{color: '#D4A76A'}}>Ordered by {it.orderedBy}</div>}
                  </div>
                  <span style={{ color: '#8B5A2B' }}>₹{(it.price * it.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid rgba(212, 167, 106, 0.15)' }}>
                <span style={{ color: '#5D4037' }}>Total</span>
                <span className="text-xl font-bold" style={{ color: '#D4A76A' }}>₹{(currentOrder?.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MAIN MENU UI (Preserved exactly as requested)
  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #f8f4f1 0%, #e8dcc6 100%)',
      backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(212, 167, 106, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212, 167, 106, 0.05) 0%, transparent 50%)',
      position: 'relative'
    }}>
      {/* Header */}
      <header className="sticky top-0 z-10 p-4" style={{
        backdropFilter: 'blur(25px) saturate(150%)',
        WebkitBackdropFilter: 'blur(25px) saturate(150%)',
        background: 'rgba(255, 255, 255, 0.7)',
        borderBottom: '1px solid rgba(212, 167, 106, 0.2)',
        boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
      }}>
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
              <h1 className="text-xl font-bold" style={{ color: '#3E2723' }}>Brew & Bites</h1>
              <div className="flex items-center gap-2">
                 {table && <p className="text-xs" style={{ color: '#8B5A2B' }}>Table: {table.name}</p>}
                 {customer && <p className="text-xs px-2 py-0.5 rounded bg-[#D4A76A] text-white">Hi, {customer.name}</p>}
              </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium" style={{ color: '#8B5A2B' }}>
              Cart: {getTotalItemCount()} items
            </div>
            <div className="text-lg font-bold" style={{ color: '#3E2723' }}>
              ₹{getOrderTotal()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 grid gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: MENU */}
        <div className="lg:col-span-2 space-y-6">
            <Section title="Menu">
            {Object.keys(groupedMenu).length === 0 ? (
                <div className="text-center py-10 text-gray-500">No menu items available.</div>
            ) : (
                Object.entries(groupedMenu).map(([category, items]) => {
                    const isCollapsed = collapsedCategories[category];
                    
                    return (
                        <div key={category} className="overflow-hidden" style={{
                          backdropFilter: 'blur(25px) saturate(150%)',
                          WebkitBackdropFilter: 'blur(25px) saturate(150%)',
                          background: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '20px',
                          border: '1px solid rgba(212, 167, 106, 0.2)',
                          boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                          marginBottom: '16px'
                        }}>
                            <button 
                                onClick={() => toggleCategory(category)}
                                className="w-full flex justify-between items-center p-4 transition-all duration-200"
                                style={{
                                  background: 'rgba(212, 167, 106, 0.08)',
                                  borderBottom: isCollapsed ? 'none' : '1px solid rgba(212, 167, 106, 0.15)',
                                  borderRadius: isCollapsed ? '20px' : '20px 20px 0 0'
                                }}
                            >
                                <h3 className="text-lg font-bold" style={{ color: '#3E2723' }}>{category}</h3>
                                <div className="text-gray-500">
                                    {isCollapsed ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                    )}
                                </div>
                            </button>

                            {!isCollapsed && (
                                <div className="p-4 grid gap-4 sm:grid-cols-2">
                                    {items.map(item => (
                                        <div key={item._id} className="flex items-start justify-between p-2 text-sm sm:text-base border rounded" style={{
                                          backdropFilter: 'blur(40px) saturate(150%)',
                                          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
                                          background: 'rgba(212, 167, 106, 0.18)',
                                          borderRadius: '22px',
                                          border: '1px solid rgba(212, 167, 106, 0.22)',
                                          boxShadow: '0 4px 24px -1px rgba(212, 167, 106, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(212, 167, 106, 0.12)',
                                          transition: 'all 0.2s ease',
                                          cursor: 'pointer',
                                          position: 'relative',
                                          overflow: 'hidden',
                                          color: '#3E2723',
                                          padding: '12px'
                                        }}>
                                            <div className="flex-1">
                                                <div className="font-medium">{item.name} <span className="font-semibold" style={{ color: colors.primary }}>₹{item.price.toFixed(2)}</span></div>
                                                <div className="text-xs" style={{ color: '#8B5A2B' }}>{item.description}</div>
                                            </div>
                                            {(() => {
                                              const existing = cart.find(i => i._id === item._id)
                                              const baselineQty = getBaselineQtyForItem(item._id)
                                              const deltaQty = existing?.qty || 0
                                              const totalQty = baselineQty + deltaQty
                                              const showControls = totalQty > 0
                                              const showDelete = baselineQty === 0 && totalQty === 1

                                              if (!showControls) {
                                                return (
                                                  <AnimatedButton onClick={(e) => { e.stopPropagation(); addToCart(item) }} color={colors.primary} hoverColor={colors.primaryDark} padding="6px 12px" minWidth="110px" height="32px">
                                                    Add to cart
                                                  </AnimatedButton>
                                                )
                                              }
                                              return (
                                                <div className="flex items-center gap-2">
                                                  <button onClick={(e) => { e.stopPropagation(); showDelete ? updateQuantity(item._id, 0) : updateQuantity(item._id, totalQty - 1) }} className="w-8 h-8 flex items-center justify-center cursor-pointer quantity-button" style={{ ...deleteButtonStyles.base, background: 'rgba(212, 167, 106, 0.25)', border: '1px solid rgba(212, 167, 106, 0.4)', color: '#3E2723' }}>
                                                    {showDelete ? <TrashIcon size={16} color="#dc2626" strokeWidth={2} dangerHover={true} shakeOnClick={true} /> : <span style={{ fontSize: '16px', fontWeight: 'bold' }}>-</span>}
                                                  </button>
                                                  <div className="w-12 text-center py-1">×{totalQty}</div>
                                                  <button onClick={(e) => { e.stopPropagation(); addToCart(item) }} className="w-8 h-8 flex items-center justify-center cursor-pointer quantity-button" style={{ ...deleteButtonStyles.base, background: 'rgba(212, 167, 106, 0.25)', border: '1px solid rgba(212, 167, 106, 0.4)', color: '#3E2723' }}>
                                                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span>
                                                  </button>
                                                </div>
                                              )
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })
            )}
            </Section>
        </div>

        {/* RIGHT COLUMN: CART & STATUS */}
        <div className="lg:col-span-1 space-y-6">
            <div className={`sticky top-20 ${showCartDetails ? 'block' : 'hidden lg:block'}`} style={{
              backdropFilter: 'blur(25px) saturate(150%)',
              WebkitBackdropFilter: 'blur(25px) saturate(150%)',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              border: '1px solid rgba(212, 167, 106, 0.2)',
              boxShadow: '0 8px 32px rgba(212, 167, 106, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
              padding: '20px'
            }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#3E2723' }}>Your Order</h2>
                
                {/* 1. Kitchen Status */}
                {currentOrder?.items?.length > 0 && (
                    <div className="mb-6" style={{ borderBottom: '1px solid rgba(212, 167, 106, 0.15)', paddingBottom: '16px' }}>
                        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8B5A2B' }}>Kitchen Status</h3>
                        <div className="space-y-2">
                            {currentOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <div className="flex flex-col">
                                        <span style={{ color: '#5D4037' }}>{item.name} <span style={{ color: '#8B5A2B' }}>x{item.qty}</span></span>
                                        {/* Show who ordered this item */}
                                        <span className="text-[10px]" style={{color: '#D4A76A'}}>By {item.orderedBy || 'Unknown'}</span>
                                    </div>
                                    <span className="text-xs px-3 py-1.5 h-fit" style={statusBadgeStyles[item.status || 'preparing']}>
                                      {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. New Cart Items */}
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8B5A2B' }}>New Items (Cart)</h3>
                {cart.length === 0 ? (
                    <p className="text-sm italic mb-4" style={{ color: '#8B5A2B' }}>Cart is empty</p>
                ) : (
                    <div className="space-y-3 mb-4">
                        {cart.map(item => (
                            <div key={item._id} className="flex justify-between items-center" style={{
                              backdropFilter: 'blur(15px) saturate(120%)',
                              WebkitBackdropFilter: 'blur(15px) saturate(120%)',
                              background: 'rgba(255, 255, 255, 0.4)',
                              borderRadius: '8px',
                              border: '1px solid rgba(212, 167, 106, 0.1)',
                              padding: '8px'
                            }}>
                                <div>
                                    <div className="font-medium" style={{ color: '#3E2723' }}>{item.name}</div>
                                    <div className="text-xs" style={{ color: '#8B5A2B' }}>₹{item.price} each</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item._id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-500 font-bold transition-colors" style={{ background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}>-</button>
                                    <span className="w-4 text-center text-sm font-medium" style={{ color: '#3E2723' }}>{item.qty}</span>
                                    <button onClick={() => updateQuantity(item._id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-green-500 font-bold transition-colors" style={{ background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. Totals */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(212, 167, 106, 0.15)' }}>
                    <div className="flex justify-between items-center mb-4">
                        <span style={{ color: '#5D4037' }}>Total Bill</span>
                        <span className="text-xl font-bold" style={{ color: colors.primary }}>₹{getOrderTotal()}</span>
                    </div>
                    <AnimatedButton onClick={submitOrder} disabled={submitting || cart.length === 0} color={colors.primary} hoverColor={colors.primaryDark} padding="12px 24px" minWidth="140px" height="44px">
                        {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Place Order'}
                    </AnimatedButton>
                </div>
            </div>
        </div>
      </div>

      {/* MOBILE CART BUTTON & OVERLAY */}
      {getTotalItemCount() > 0 && typeof document !== 'undefined' && createPortal(
          <button type="button" className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg" onClick={() => setShowCartDetails(true)} style={{ position: 'fixed', right: '16px', bottom: '16px', background: '#D4A76A', color: '#3E2723', padding: '12px 16px', fontWeight: 700, borderRadius: '9999px', zIndex: 60, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            Cart ({getTotalItemCount()}) · ₹{getOrderTotal()}
          </button>, document.body
      )}

      {showCartDetails && typeof document !== 'undefined' && createPortal(
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={() => setShowCartDetails(false)}>
            <div className="bg-white rounded-lg shadow-xl p-4 max-h-[80vh] overflow-y-auto w-full" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '520px' }}>
              <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ color: '#3E2723' }}>Your Order</h3>
                <button onClick={() => setShowCartDetails(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
              </div>

              {currentOrder?.items?.length > 0 && (
                <div className="mb-6" style={{ borderBottom: '1px solid rgba(212, 167, 106, 0.15)', paddingBottom: '16px' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8B5A2B' }}>Kitchen Status</h3>
                  <div className="space-y-2">
                    {currentOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="flex flex-col">
                            <span style={{ color: '#5D4037' }}>{item.name} <span style={{ color: '#8B5A2B' }}>x{item.qty}</span></span>
                            <span className="text-[10px]" style={{color: '#D4A76A'}}>By {item.orderedBy}</span>
                        </div>
                        <span className="font-medium px-2 py-0.5 text-xs h-fit" style={{ ...statusBadgeStyles[item.status === 'served' ? 'available' : item.status === 'ready' ? 'preparing-order' : 'preparing'], fontSize: '11px', fontWeight: '600', letterSpacing: '0.025em', textTransform: 'uppercase' }}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(212, 167, 106, 0.1)', paddingBottom: '12px' }}>
                    <div className="flex-1">
                      <h4 style={{ color: '#3E2723', fontWeight: '600' }}>{item.name}</h4>
                      <p style={{ color: '#8B5A2B', fontSize: '14px' }}>₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item._id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-500 font-bold transition-colors" style={{ background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}>-</button>
                      <span className="w-4 text-center text-sm font-medium" style={{ color: '#3E2723' }}>{item.qty}</span>
                      <button onClick={() => updateQuantity(item._id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-green-500 font-bold transition-colors" style={{ background: 'rgba(255, 255, 255, 0.8)', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', borderRadius: '4px' }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(212, 167, 106, 0.15)' }}>
                <div className="flex justify-between items-center mb-4">
                  <span style={{ color: '#5D4037' }}>Total Bill</span>
                  <span className="text-xl font-bold" style={{ color: '#D4A76A' }}>₹{getOrderTotal()}</span>
                </div>
                <AnimatedButton onClick={submitOrder} disabled={submitting || cart.length === 0} color="#D4A76A" hoverColor="#3E2723" padding="12px 24px" minWidth="140px" height="44px" width="100%">
                  {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Place Order'}
                </AnimatedButton>
              </div>
              </div>
            </div>
          </div>, document.body
      )}

      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-4 rounded-lg shadow-lg text-center animate-bounce" style={{ backdropFilter: 'blur(25px) saturate(150%)', WebkitBackdropFilter: 'blur(25px) saturate(150%)', background: 'rgba(239, 68, 68, 0.9)', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)', color: '#ffffff', margin: '0 16px' }}>
          {error}
        </div>
      )}
    </div>
  )
}