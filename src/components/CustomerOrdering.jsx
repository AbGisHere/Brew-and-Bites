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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageType,
        userId,
        tableId,
        deviceId,
        deviceInfo
      })
    })
  } catch (error) {
    console.error('Failed to log access:', error)
  }
}

export default function CustomerOrdering({ tableId: propTableId, deviceId: propDeviceId }) {
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState([])
  const [table, setTable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentOrder, setCurrentOrder] = useState(null)
  const [orderStatus, setOrderStatus] = useState(null)
  
  // New State for Collapsible Categories
  // Stores true if a category is collapsed (hidden), false if open
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [showCartDetails, setShowCartDetails] = useState(false) // New state for cart visibility

  const navigate = useNavigate()

  useEffect(() => {
    // Log access for customer ordering
    const currentTableId = propTableId || table?.tableCode
    logAccess('CustomerOrdering', null, currentTableId, propDeviceId)

    // 1. Get table info - prioritize props over URL params
    if (propTableId && propDeviceId) {
      // Use props from URL routing
      fetchTableInfo(propTableId)
    } else {
      // Fallback to URL params for backward compatibility
      const urlParams = new URLSearchParams(window.location.search)
      const tableCode = urlParams.get('table')
      
      if (!tableCode) {
        const storedTable = localStorage.getItem('currentTable')
        if (storedTable) {
          const tableData = JSON.parse(storedTable)
          setTable(tableData)
          // Also check for existing orders when using stored table
          fetchExistingOrder(tableData._id)
        } else {
          navigate('/') 
          return
        }
      } else {
        fetchTableInfo(tableCode)
      }
    }

    // 2. Load Menu
    fetchMenu()
  }, [navigate, propTableId, propDeviceId])

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
          }
        } catch (err) {
          console.error('Polling Error:', err)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [currentOrder])

  // --- Helpers ---

  // Group menu items by category efficiently
  const groupedMenu = useMemo(() => {
    return menu.reduce((acc, item) => {
      // Skip unavailable items
      if (item.available === false) return acc;
      
      const category = item.category || 'Others'; // Fallback if no category
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [menu]);

  // Toggle category visibility
  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const fetchTableInfo = async (tableCode) => {
    try {
      const response = await fetch(`${API_URL}/api/tables/by-code/${tableCode}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Invalid table code')
      setTable(data)
      localStorage.setItem('currentTable', JSON.stringify(data))
      
      // Pre-fetch existing order for this table
      await fetchExistingOrder(data._id)
    } catch (err) {
      setError(err.message)
      setTimeout(() => navigate('/'), 2000)
    }
  }

  const fetchExistingOrder = async (tableId) => {
    try {
      // Start/Get active order for this table
      const orderRes = await fetch(`${API_URL}/api/orders/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId })
      })
      
      const orderData = await orderRes.json()
      if (orderRes.ok && orderData.items && orderData.items.length > 0) {
        setCurrentOrder(orderData)
      }
    } catch (err) {
      console.log('No existing order found or failed to fetch:', err.message)
      // Don't show error to user, just continue without pre-populated cart
    }
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

  // --- Cart Management ---
  const addToCart = (item) => {
    const baselineQty = getBaselineQtyForItem(item._id)

    setCart(prev => {
      const existing = prev.find(i => i._id === item._id)
      const existingDelta = existing?.qty || 0

      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: existingDelta + 1 } : i)
      }

      if (baselineQty > 0) {
        return [...prev, { _id: item._id, qty: 1, name: item.name, price: item.price }]
      }

      return [...prev, { ...item, qty: 1 }]
    })
  }

  const getBaselineQtyForItem = (itemId) => {
    const baseline = currentOrder?.items?.reduce((t, it) => {
      if (it.itemId === itemId) return t + (it.qty || 0)
      return t
    }, 0)
    return baseline || 0
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
        if (existing) {
          return prev.map(i => i._id === itemId ? { ...i, qty: desiredDelta } : i)
        }
        return [...prev, { _id: itemId, qty: desiredDelta }]
      })
      return
    }

    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i._id !== itemId))
      return
    }

    setCart(prev => prev.map(i => i._id === itemId ? { ...i, qty: newQty } : i))
  }

  const getTotalPrice = () => {
    // Include both cart items and items under preparation from current order
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0)
    const orderTotal = currentOrder?.items?.reduce((t, i) => t + (i.price * i.qty), 0) || 0
    return cartTotal + orderTotal
  }

  const getTotalItemCount = () => {
    // Include both cart items and items under preparation from current order
    const cartCount = cart.reduce((total, item) => total + item.qty, 0)
    const orderCount = currentOrder?.items?.reduce((t, i) => t + i.qty, 0) || 0
    return cartCount + orderCount
  }

  const getOrderTotal = () => {
    // This function now just returns the same as getTotalPrice since getTotalPrice includes everything
    return getTotalPrice()
  }

  // --- Order Submission ---
  const submitOrder = async () => {
    if (cart.length === 0) return setError('Cart is empty')
    if (!table?._id) return setError('Table info missing')

    setSubmitting(true)
    setError('')

    try {
      // Step A: Start/Get Order
      const orderRes = await fetch(`${API_URL}/api/orders/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: table._id })
      })
      
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to start order')

      // Step B: Only send the delta above what is already on the order.
      // The cart qty is treated as the desired total (baseline + new additions).
      const baselineByItemId = (orderData.items || []).reduce((acc, it) => {
        // Only treat non-served quantities as "already sent to kitchen" baseline.
        // Served items should not block re-ordering the same item.
        if (it.status === 'served') return acc
        acc[it.itemId] = (acc[it.itemId] || 0) + (it.qty || 0)
        return acc
      }, {})

      const deltaItems = cart
        .map((ci) => {
          const baseline = baselineByItemId[ci._id] || 0
          const delta = ci.qty - baseline
          if (delta <= 0) return null
          return {
            itemId: ci._id,
            name: ci.name,
            price: ci.price,
            qty: delta,
            status: 'preparing'
          }
        })
        .filter(Boolean)

      if (deltaItems.length === 0) {
        setSubmitting(false)
        return
      }

      // Step C: Smart Merge - add only delta to an existing non-served row.
      // Never merge into a served row.
      let finalItems = orderData.items ? [...orderData.items] : []
      deltaItems.forEach(deltaItem => {
        const existingIdx = finalItems.findIndex(i => i.itemId === deltaItem.itemId && i.status !== 'served')
        if (existingIdx >= 0) {
          finalItems[existingIdx].qty += deltaItem.qty
        } else {
          finalItems.push(deltaItem)
        }
      })

      // Step D: Update Backend
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #f8f4f1 0%, #e8dcc6 100%)',
      backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(212, 167, 106, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212, 167, 106, 0.05) 0%, transparent 50%)',
      position: 'relative'
    }}>
      <div className="text-center" style={{
        padding: '40px'
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
        <p className="mt-4" style={{ color: '#8B5A2B' }}>Loading menu...</p>
      </div>
    </div>
  )

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
              {table && <p className="text-xs" style={{ color: '#8B5A2B' }}>Table: {table.name}</p>}
          </div>
          <div className="text-right">
            <div className="text-sm font-medium" style={{ color: '#8B5A2B' }}>
              Cart: {getTotalItemCount()} items
            </div>
            <div className="text-lg font-bold" style={{ color: '#3E2723' }}>
              ₹{getTotalPrice()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 grid gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: MENU (Now Categorized) */}
        <div className="lg:col-span-2 space-y-6">
            <Section title="Menu">
            {/* Iterate over Categories */}
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
                            {/* Category Header */}
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
                                    {/* Chevron Icon Logic */}
                                    {isCollapsed ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>

                            {/* Category Items (Collapsible Content) */}
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
                                                  <AnimatedButton
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      addToCart(item)
                                                    }}
                                                    color={colors.primary}
                                                    hoverColor={colors.primaryDark}
                                                    padding="6px 12px"
                                                    minWidth="110px"
                                                    height="32px"
                                                  >
                                                    Add to cart
                                                  </AnimatedButton>
                                                )
                                              }

                                              return (
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      if (showDelete) {
                                                        updateQuantity(item._id, 0)
                                                      } else {
                                                        updateQuantity(item._id, totalQty - 1)
                                                      }
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      if (!showDelete) return
                                                      Object.assign(e.currentTarget.style, {
                                                        background: 'rgba(239, 68, 68, 0.35)',
                                                        border: '1px solid rgba(239, 68, 68, 0.5)',
                                                        color: '#dc2626',
                                                        transform: 'scale(1.02)'
                                                      })
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      if (!showDelete) return
                                                      Object.assign(e.currentTarget.style, deleteButtonStyles.base)
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center cursor-pointer quantity-button"
                                                    style={showDelete ? deleteButtonStyles.base : {
                                                      ...deleteButtonStyles.base,
                                                      background: 'rgba(212, 167, 106, 0.25)',
                                                      border: '1px solid rgba(212, 167, 106, 0.4)',
                                                      color: '#3E2723'
                                                    }}
                                                  >
                                                    {showDelete ? (
                                                      <TrashIcon
                                                        size={16}
                                                        color="#dc2626"
                                                        strokeWidth={2}
                                                        dangerHover={true}
                                                        shakeOnClick={true}
                                                      />
                                                    ) : (
                                                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>-</span>
                                                    )}
                                                  </button>

                                                  <div className="w-12 text-center py-1">
                                                    ×{totalQty}
                                                  </div>

                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      addToCart(item)
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center cursor-pointer quantity-button"
                                                    style={{
                                                      ...deleteButtonStyles.base,
                                                      background: 'rgba(212, 167, 106, 0.25)',
                                                      border: '1px solid rgba(212, 167, 106, 0.4)',
                                                      color: '#3E2723'
                                                    }}
                                                  >
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
                                    <span style={{ color: '#5D4037' }}>{item.name} <span style={{ color: '#8B5A2B' }}>x{item.qty}</span></span>
                                    <span className="text-xs px-3 py-1.5" style={statusBadgeStyles[item.status || 'preparing']}>
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
                                    <button onClick={() => updateQuantity(item._id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-500 font-bold transition-colors" style={{
                                      background: 'rgba(255, 255, 255, 0.8)',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                      borderRadius: '4px'
                                    }}>-</button>
                                    <span className="w-4 text-center text-sm font-medium" style={{ color: '#3E2723' }}>{item.qty}</span>
                                    <button onClick={() => updateQuantity(item._id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-green-500 font-bold transition-colors" style={{
                                      background: 'rgba(255, 255, 255, 0.8)',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                      borderRadius: '4px'
                                    }}>+</button>
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
                    <AnimatedButton
                        onClick={submitOrder} 
                        disabled={submitting || cart.length === 0}
                        color={colors.primary}
                        hoverColor={colors.primaryDark}
                        padding="12px 24px"
                        minWidth="140px"
                        height="44px"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Place Order'
                        )}
                    </AnimatedButton>
                </div>
            </div>
        </div>
      </div>

      {getTotalItemCount() > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <button
            type="button"
            className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
            onClick={() => setShowCartDetails(true)}
            style={{
              position: 'fixed',
              right: '16px',
              bottom: '16px',
              background: '#D4A76A',
              color: '#3E2723',
              padding: '12px 16px',
              fontWeight: 700,
              borderRadius: '9999px',
              zIndex: 60,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
            }}
          >
            Cart ({getTotalItemCount()}) · ₹{getTotalPrice()}
          </button>,
          document.body
        )}

      {/* Cart Details Overlay - Mobile Only - Outside Main Container */}
      {showCartDetails &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4" onClick={() => setShowCartDetails(false)}>
            <div
              className="bg-white rounded-lg shadow-xl p-4 max-h-[80vh] overflow-y-auto w-full"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '520px'
              }}
            >
              <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ color: '#3E2723' }}>Your Order</h3>
                <button
                  onClick={() => setShowCartDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Kitchen Status */}
              {currentOrder?.items?.length > 0 && (
                <div className="mb-6" style={{ borderBottom: '1px solid rgba(212, 167, 106, 0.15)', paddingBottom: '16px' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#8B5A2B' }}>Kitchen Status</h3>
                  <div className="space-y-2">
                    {currentOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span style={{ color: '#5D4037' }}>
                          {item.name} <span style={{ color: '#8B5A2B' }}>x{item.qty}</span>
                        </span>
                        <span className="font-medium px-2 py-0.5 text-xs" style={{
                          ...statusBadgeStyles[item.status === 'served' ? 'available' : item.status === 'ready' ? 'preparing-order' : 'preparing'],
                          fontSize: '11px',
                          fontWeight: '600',
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cart Items */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(212, 167, 106, 0.1)', paddingBottom: '12px' }}>
                    <div className="flex-1">
                      <h4 style={{ color: '#3E2723', fontWeight: '600' }}>{item.name}</h4>
                      <p style={{ color: '#8B5A2B', fontSize: '14px' }}>₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item._id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-500 font-bold transition-colors" style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        borderRadius: '4px'
                      }}>-</button>
                      <span className="w-4 text-center text-sm font-medium" style={{ color: '#3E2723' }}>{item.qty}</span>
                      <button onClick={() => updateQuantity(item._id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-green-500 font-bold transition-colors" style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        borderRadius: '4px'
                      }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(212, 167, 106, 0.15)' }}>
                <div className="flex justify-between items-center mb-4">
                  <span style={{ color: '#5D4037' }}>Total Bill</span>
                  <span className="text-xl font-bold" style={{ color: '#D4A76A' }}>₹{getOrderTotal()}</span>
                </div>
                <AnimatedButton
                  onClick={submitOrder}
                  disabled={submitting || cart.length === 0}
                  color="#D4A76A"
                  hoverColor="#3E2723"
                  padding="12px 24px"
                  minWidth="140px"
                  height="44px"
                  width="100%"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Place Order'
                  )}
                </AnimatedButton>
              </div>
              </div>
            </div>
          </div>,
          document.body
        )}


      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 p-4 rounded-lg shadow-lg text-center animate-bounce" style={{
          backdropFilter: 'blur(25px) saturate(150%)',
          WebkitBackdropFilter: 'blur(25px) saturate(150%)',
          background: 'rgba(239, 68, 68, 0.9)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          margin: '0 16px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
