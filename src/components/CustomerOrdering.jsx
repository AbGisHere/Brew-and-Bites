// src/components/CustomerOrdering.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import API_URL from '../config'

export default function CustomerOrdering() {
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

  const navigate = useNavigate()

  useEffect(() => {
    // 1. Get table info
    const urlParams = new URLSearchParams(window.location.search)
    const tableCode = urlParams.get('table')
    
    if (!tableCode) {
      const storedTable = localStorage.getItem('currentTable')
      if (storedTable) {
        setTable(JSON.parse(storedTable))
      } else {
        navigate('/') 
        return
      }
    } else {
      fetchTableInfo(tableCode)
    }

    // 2. Load Menu
    fetchMenu()
  }, [navigate])

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
    } catch (err) {
      setError(err.message)
      setTimeout(() => navigate('/'), 2000)
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
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id)
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
        setCart(prev => prev.filter(i => i._id !== itemId))
        return
    }
    setCart(prev => prev.map(i => i._id === itemId ? { ...i, qty: newQty } : i))
  }

  const getTotalPrice = () => cart.reduce((total, item) => total + (item.price * item.qty), 0)

  const getOrderTotal = () => {
    const cartTotal = getTotalPrice()
    const orderTotal = currentOrder?.items?.reduce((t, i) => t + (i.price * i.qty), 0) || 0
    return cartTotal + orderTotal
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

      // Step B: Prepare Items
      const newItems = cart.map(item => ({
        itemId: item._id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        status: 'preparing'
      }))

      // Step C: Smart Merge
      let finalItems = orderData.items ? [...orderData.items] : []
      newItems.forEach(newItem => {
        const existingIdx = finalItems.findIndex(i => i.itemId === newItem.itemId && i.status === 'preparing')
        if (existingIdx >= 0) {
            finalItems[existingIdx].qty += newItem.qty
        } else {
            finalItems.push(newItem)
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow p-4 sticky top-0 z-10 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold text-gray-900">Brew & Bites</h1>
            {table && <p className="text-xs text-gray-500">Table: {table.name}</p>}
        </div>
        <button onClick={() => navigate('/')} className="text-sm text-red-500 font-medium hover:text-red-700">Exit</button>
      </header>

      <div className="max-w-4xl mx-auto p-4 grid gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: MENU (Now Categorized) */}
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu</h2>
            
            {/* Iterate over Categories */}
            {Object.keys(groupedMenu).length === 0 ? (
                <div className="text-center py-10 text-gray-500">No menu items available.</div>
            ) : (
                Object.entries(groupedMenu).map(([category, items]) => {
                    const isCollapsed = collapsedCategories[category];
                    
                    return (
                        <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                            {/* Category Header */}
                            <button 
                                onClick={() => toggleCategory(category)}
                                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <h3 className="text-lg font-bold text-gray-800">{category}</h3>
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
                                <div className="p-4 grid gap-4 sm:grid-cols-2 animate-fadeIn">
                                    {items.map(item => (
                                        <div key={item._id} className="bg-white p-4 rounded-lg border border-gray-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                                                    <span className="text-primary font-bold">₹{item.price}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 mb-3">{item.description}</p>
                                            </div>
                                            <button 
                                                onClick={() => addToCart(item)} 
                                                className="w-full bg-blue-50 text-blue-600 font-semibold py-2 rounded hover:bg-blue-100 transition-colors"
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })
            )}
        </div>

        {/* RIGHT COLUMN: CART & STATUS (Unchanged) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 sticky top-20">
                <h2 className="text-xl font-bold mb-4 text-gray-900">Your Order</h2>
                
                {/* 1. Kitchen Status */}
                {currentOrder?.items?.length > 0 && (
                    <div className="mb-6 border-b pb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kitchen Status</h3>
                        <div className="space-y-2">
                            {currentOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600">{item.name} <span className="text-gray-400">x{item.qty}</span></span>
                                    <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                                        item.status === 'served' ? 'bg-green-100 text-green-700' :
                                        item.status === 'ready' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                        {item.status || 'Ordered'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. New Cart Items */}
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Items (Cart)</h3>
                {cart.length === 0 ? (
                    <p className="text-sm text-gray-400 italic mb-4">Cart is empty</p>
                ) : (
                    <div className="space-y-3 mb-4">
                        {cart.map(item => (
                            <div key={item._id} className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-500">₹{item.price} each</div>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 rounded p-1">
                                    <button onClick={() => updateQuantity(item._id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500 font-bold">-</button>
                                    <span className="w-4 text-center text-sm font-medium">{item.qty}</span>
                                    <button onClick={() => updateQuantity(item._id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-green-500 font-bold">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. Totals */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total Bill</span>
                        <span className="text-xl font-bold text-primary">₹{getOrderTotal()}</span>
                    </div>
                    <button 
                        onClick={submitOrder} 
                        disabled={submitting || cart.length === 0}
                        className="w-full bg-primary hover:bg-opacity-90 text-white font-bold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            'Place Order'
                        )}
                    </button>
                </div>
            </div>
        </div>

      </div>
      
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg text-center animate-bounce">
            {error}
        </div>
      )}
    </div>
  )
}