import React, { useState, useEffect } from 'react'
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
  const navigate = useNavigate()

  useEffect(() => {
    // Get table info from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const tableCode = urlParams.get('table')
    
    if (!tableCode) {
      const storedTable = localStorage.getItem('currentTable')
      if (storedTable) {
        setTable(JSON.parse(storedTable))
      } else {
        navigate('/order')
        return
      }
    } else {
      // Validate table code
      fetchTableInfo(tableCode)
    }

    // Load menu
    fetchMenu()
  }, [navigate])

  // Poll for order status if order exists
  useEffect(() => {
    if (currentOrder && currentOrder._id) {
      console.log('Starting polling for order:', currentOrder._id)
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/api/orders/${currentOrder._id}`)
          if (response.ok) {
            const orderData = await response.json()
            setOrderStatus(orderData.status)
            setCurrentOrder(orderData)
          } else {
            console.error('Failed to poll order status:', response.status)
          }
        } catch (err) {
          console.error('Error polling order status:', err)
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(interval)
    }
  }, [currentOrder])

  const fetchTableInfo = async (tableCode) => {
    try {
      const response = await fetch(`${API_URL}/api/tables/by-code/${tableCode}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid table code')
      }
      
      setTable(data)
      localStorage.setItem('currentTable', JSON.stringify(data))
    } catch (err) {
      setError(err.message)
      setTimeout(() => navigate('/order'), 2000)
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

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        )
      }
      return [...prevCart, { ...item, qty: 1 }]
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId))
  }

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item._id === itemId ? { ...item, qty: newQty } : item
      )
    )
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0)
  }

  const getOrderTotal = () => {
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0)
    const orderTotal = currentOrder && currentOrder.items 
      ? currentOrder.items.reduce((total, item) => total + (item.price * item.qty), 0)
      : 0
    return cartTotal + orderTotal
  }

  const submitOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    if (!table || !table._id) {
      setError('Table information not available')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      console.log('Submitting order for table:', table)
      console.log('Table ID:', table._id)
      console.log('Table object:', JSON.stringify(table, null, 2))
      
      // Start order for the table (this will return existing order if one exists)
      const orderResponse = await fetch(`${API_URL}/api/orders/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableId: table._id })
      })

      const orderData = await orderResponse.json()
      console.log('Order response status:', orderResponse.status)
      console.log('Order response:', orderData)

      if (!orderResponse.ok) {
        throw new Error(orderData.error || `Failed to create order (Status: ${orderResponse.status})`)
      }

      // Prepare items to add
      const newItems = cart.map(item => ({
        itemId: item._id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        status: 'preparing'
      }))

      // Combine with existing items if order has items
      let finalItems
      let isNewOrder = false
      
      if (!orderData.items || orderData.items.length === 0) {
        finalItems = newItems
        isNewOrder = true
      } else {
        // Merge new items with existing items
        finalItems = [...orderData.items]
        isNewOrder = false
        
        newItems.forEach(newItem => {
          const existingItemIndex = finalItems.findIndex(item => item.itemId === newItem.itemId)
          if (existingItemIndex >= 0) {
            // Update quantity of existing item
            finalItems[existingItemIndex].qty += newItem.qty
          } else {
            // Add new item
            finalItems.push(newItem)
          }
        })
      }

      // Update the order with all items
      const updateResponse = await fetch(`${API_URL}/api/orders/${orderData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: finalItems })
      })

      const updatedOrder = await updateResponse.json()
      console.log('Updated order:', updatedOrder)

      if (!updateResponse.ok) {
        throw new Error('Failed to add items to order')
      }

      // Set current order and start status tracking
      console.log('Setting current order:', updatedOrder)
      setCurrentOrder(updatedOrder)
      setOrderStatus('preparing')
      setCart([]) // Clear cart after successful order
      setSubmitting(false)
      setError('')
      
      const message = isNewOrder ? 'Order placed successfully!' : 'Items added to your existing order!'
      alert(`${message} The kitchen will start preparing your items.`)
      
    } catch (err) {
      console.error('Order submission error:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error && !table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <p>Redirecting...</p>
        </div>
      </div>
    )
  }

  // Group menu items by category
  const menuByCategory = menu.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Brew & Bites</h1>
              {table && <p className="text-sm text-gray-500">Table: {table.name}</p>}
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>
            
            {Object.entries(menuByCategory).map(([category, items]) => (
              <div key={category} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(item => (
                    <div key={item._id} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <p className="text-lg font-bold text-primary mt-2">
                            ₹{item.price.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => addToCart(item)}
                          className="ml-4 bg-primary hover:bg-opacity-90 text-white p-2 rounded-lg transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cart</h2>
              
              {/* Combined Items Display */}
              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {/* Cart Items (not yet ordered) */}
                {cart.map(item => (
                  <div key={`cart-${item._id}`} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.qty - 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.qty + 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Existing Order Items (already ordered with status) */}
                {currentOrder && currentOrder.items && currentOrder.items.map((item, index) => (
                  <div key={`order-${item.itemId}-${index}`} className="flex items-center justify-between border-l-4 border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'served' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'ready' ? 'Prepared' : 
                           item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">×{item.qty}</span>
                      <span className="font-semibold text-primary">₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Cart Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Order Total:</span>
                  <span className="text-xl font-bold text-primary">
                    ₹{getOrderTotal().toFixed(2)}
                  </span>
                </div>
                
                <button
                  onClick={submitOrder}
                  disabled={submitting || cart.length === 0}
                  className="w-full bg-primary hover:bg-opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
