import { useState, useEffect } from 'react'
import { FiCreditCard, FiUsers, FiDollarSign, FiPlus, FiMinus, FiCheck } from 'react-icons/fi'

export default function PaymentModal({ open, onClose, receipt, onPaymentComplete, tableMap }) {
  if (!open || !receipt) {
    return null
  }

  const [paymentOption, setPaymentOption] = useState('full') // 'full' or 'split'
  const [splitType, setSplitType] = useState('items') // 'items' or 'custom'
  const [customSplits, setCustomSplits] = useState([]) // Array of { name, percentage, amount }
  const [itemAssignments, setItemAssignments] = useState({}) // { itemId: personName }
  const [paymentMethod, setPaymentMethod] = useState('') // 'razorpay' or 'cash'
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate totals
  const subtotal = receipt.items?.reduce((s, it) => s + it.price * it.qty, 0) || 0
  const discount = receipt.discount || 0
  const taxRate = (receipt.taxEnabled && receipt.taxRate) ? receipt.taxRate : 0
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax - discount

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true)
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        setRazorpayLoaded(true)
      }
      document.body.appendChild(script)
    }

    if (paymentMethod === 'razorpay') {
      loadRazorpay()
    }
  }, [paymentMethod])

  // Initialize custom splits with 2 people
  useEffect(() => {
    if (paymentOption === 'split' && splitType === 'custom' && customSplits.length === 0) {
      setCustomSplits([
        { name: 'Person 1', percentage: 50, amount: total * 0.5 },
        { name: 'Person 2', percentage: 50, amount: total * 0.5 }
      ])
    }
  }, [paymentOption, splitType, total])

  // Initialize item assignments for split by items
  useEffect(() => {
    if (paymentOption === 'split' && splitType === 'items' && receipt.items) {
      const assignments = {}
      receipt.items.forEach(item => {
        // Use various possible ID fields
        const itemId = item.id || item.itemId || item._id || Math.random().toString()
        assignments[itemId] = 'Person 1' // Default assignment
      })
      setItemAssignments(assignments)
    }
  }, [paymentOption, splitType, receipt.items])

  // Calculate person totals for item-based split
  const calculatePersonTotals = () => {
    const personTotals = {}
    
    if (splitType === 'items') {
      receipt.items?.forEach(item => {
        // Use various possible ID fields
        const itemId = item.id || item.itemId || item._id || Math.random().toString()
        const person = itemAssignments[itemId] || 'Unassigned'
        if (!personTotals[person]) {
          personTotals[person] = 0
        }
        personTotals[person] += item.price * item.qty
      })
      
      // Add tax and discount proportionally
      Object.keys(personTotals).forEach(person => {
        const personSubtotal = personTotals[person]
        const personTax = personSubtotal * (taxRate / 100)
        const personDiscount = discount * (personSubtotal / subtotal)
        personTotals[person] = personSubtotal + personTax - personDiscount
      })
    } else if (splitType === 'custom') {
      customSplits.forEach(split => {
        personTotals[split.name] = split.amount
      })
    }
    
    return personTotals
  }

  const addCustomSplit = () => {
    const newPerson = `Person ${customSplits.length + 1}`
    const equalPercentage = 100 / (customSplits.length + 1)
    const updatedSplits = customSplits.map(split => ({
      ...split,
      percentage: equalPercentage,
      amount: total * (equalPercentage / 100)
    }))
    updatedSplits.push({
      name: newPerson,
      percentage: equalPercentage,
      amount: total * (equalPercentage / 100)
    })
    setCustomSplits(updatedSplits)
  }

  const removeCustomSplit = (index) => {
    if (customSplits.length <= 2) return
    
    const updatedSplits = customSplits.filter((_, i) => i !== index)
    const equalPercentage = 100 / updatedSplits.length
    const recalculatedSplits = updatedSplits.map(split => ({
      ...split,
      percentage: equalPercentage,
      amount: total * (equalPercentage / 100)
    }))
    setCustomSplits(recalculatedSplits)
  }

  const updateCustomSplit = (index, field, value) => {
    const updatedSplits = [...customSplits]
    updatedSplits[index] = { ...updatedSplits[index], [field]: value }
    
    if (field === 'percentage') {
      updatedSplits[index].amount = total * (value / 100)
    } else if (field === 'amount') {
      updatedSplits[index].percentage = (value / total) * 100
    }
    
    setCustomSplits(updatedSplits)
  }

  const handleRazorpayPayment = async (amount, personName = null) => {
    if (!razorpayLoaded) {
      alert('Payment gateway is loading. Please wait...')
      return
    }

    const options = {
      key: 'rzp_test_1DP5mmOlF5G4ag', // Test key - replace with your production key
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Brew & Bites',
      description: personName ? `Payment for ${personName}` : 'Bill Payment',
      image: '/logo.png', // Add your logo path
      handler: function(response) {
        handlePaymentSuccess('razorpay', response.razorpay_payment_id, personName)
      },
      prefill: {
        name: personName || 'Customer',
        email: 'customer@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#D4A76A'
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const handlePaymentSuccess = (method, paymentId, personName = null) => {
    setIsProcessing(false)
    
    const paymentData = {
      receiptId: receipt.id,
      paymentMethod: method,
      paymentId: paymentId,
      amount: personName ? calculatePersonTotals()[personName] : total,
      personName: personName,
      paymentType: paymentOption,
      splitDetails: paymentOption === 'split' ? {
        type: splitType,
        splits: calculatePersonTotals()
      } : null
    }

    onPaymentComplete(paymentData)
    
    if (paymentOption === 'full' || (paymentOption === 'split' && Object.keys(calculatePersonTotals()).length === 1)) {
      onClose()
    }
  }

  const handleCashPayment = (personName = null) => {
    setIsProcessing(true)
    // Simulate cash payment confirmation
    setTimeout(() => {
      handlePaymentSuccess('cash', `CASH_${Date.now()}`, personName)
    }, 1000)
  }

  const personTotals = calculatePersonTotals()

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          border: '1px solid rgba(212, 167, 106, 0.2)',
          boxShadow: '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
        }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 p-6 rounded-t-2xl"
          style={{
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            background: 'rgba(255, 255, 255, 0.8)',
            borderBottom: '1px solid rgba(212, 167, 106, 0.2)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#3E2723' }}>Payment Options</h2>
              <p className="mt-1" style={{ color: '#6b7280' }}>
                Table {tableMap[receipt.tableId] || receipt.tableId} • Total: ₹{total.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-amber-50/50"
              style={{
                transition: 'all 0.2s ease'
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Payment Option Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#3E2723' }}>Choose Payment Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentOption('full')}
                className="p-4 rounded-xl border-2 transition-all"
                style={{
                  backdropFilter: 'blur(12px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                  background: paymentOption === 'full' 
                    ? 'rgba(212, 167, 106, 0.25)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  border: paymentOption === 'full'
                    ? '2px solid rgba(212, 167, 106, 0.5)'
                    : '2px solid rgba(212, 167, 106, 0.3)',
                  boxShadow: paymentOption === 'full'
                    ? '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                    : '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <FiCreditCard className="w-6 h-6 mx-auto mb-2" style={{ color: '#D4A76A' }} />
                <div className="font-medium" style={{ color: '#3E2723' }}>Pay in Full</div>
                <div className="text-sm mt-1" style={{ color: '#6b7280' }}>Complete payment at once</div>
              </button>
              
              <button
                onClick={() => setPaymentOption('split')}
                className="p-4 rounded-xl border-2 transition-all"
                style={{
                  backdropFilter: 'blur(12px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                  background: paymentOption === 'split' 
                    ? 'rgba(212, 167, 106, 0.25)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  border: paymentOption === 'split'
                    ? '2px solid rgba(212, 167, 106, 0.5)'
                    : '2px solid rgba(212, 167, 106, 0.3)',
                  boxShadow: paymentOption === 'split'
                    ? '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                    : '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <FiUsers className="w-6 h-6 mx-auto mb-2" style={{ color: '#D4A76A' }} />
                <div className="font-medium" style={{ color: '#3E2723' }}>Split Bill</div>
                <div className="text-sm mt-1" style={{ color: '#6b7280' }}>Divide between people</div>
              </button>
            </div>
          </div>

          {/* Split Options */}
          {paymentOption === 'split' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#3E2723' }}>Split Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSplitType('items')}
                  className="p-4 rounded-xl border-2 transition-all"
                  style={{
                    backdropFilter: 'blur(12px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                    background: splitType === 'items' 
                      ? 'rgba(212, 167, 106, 0.25)' 
                      : 'rgba(255, 255, 255, 0.7)',
                    border: splitType === 'items'
                      ? '2px solid rgba(212, 167, 106, 0.5)'
                      : '2px solid rgba(212, 167, 106, 0.3)',
                    boxShadow: splitType === 'items'
                      ? '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                      : '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <FiDollarSign className="w-6 h-6 mx-auto mb-2" style={{ color: '#D4A76A' }} />
                  <div className="font-medium" style={{ color: '#3E2723' }}>Split by Items</div>
                  <div className="text-sm mt-1" style={{ color: '#6b7280' }}>Assign items to people</div>
                </button>
                
                <button
                  onClick={() => setSplitType('custom')}
                  className="p-4 rounded-xl border-2 transition-all"
                  style={{
                    backdropFilter: 'blur(12px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                    background: splitType === 'custom' 
                      ? 'rgba(212, 167, 106, 0.25)' 
                      : 'rgba(255, 255, 255, 0.7)',
                    border: splitType === 'custom'
                      ? '2px solid rgba(212, 167, 106, 0.5)'
                      : '2px solid rgba(212, 167, 106, 0.3)',
                    boxShadow: splitType === 'custom'
                      ? '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                      : '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <FiPlus className="w-6 h-6 mx-auto mb-2" style={{ color: '#D4A76A' }} />
                  <div className="font-medium" style={{ color: '#3E2723' }}>Custom Split</div>
                  <div className="text-sm mt-1" style={{ color: '#6b7280' }}>Custom percentages</div>
                </button>
              </div>
            </div>
          )}

          {/* Split by Items */}
          {paymentOption === 'split' && splitType === 'items' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Items to People</h3>
              <div className="space-y-4">
                {receipt.items?.map(item => {
                  const itemId = item.id || item.itemId || item._id || Math.random().toString()
                  return (
                    <div key={itemId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">{item.qty} × ₹{item.price} = ₹{(item.price * item.qty).toFixed(2)}</div>
                      </div>
                      <select
                        value={itemAssignments[itemId] || ''}
                        onChange={(e) => setItemAssignments({...itemAssignments, [itemId]: e.target.value})}
                        className="ml-4 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select person</option>
                        {Array.from(new Set(Object.values(itemAssignments))).map(person => (
                          <option key={person} value={person}>{person}</option>
                        ))}
                        <option value={`Person ${Object.keys(itemAssignments).length + 1}`}>
                          Person {Object.keys(itemAssignments).length + 1}
                        </option>
                      </select>
                    </div>
                  )
                })}
              </div>
              
              {/* Person Totals */}
              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Individual Totals:</h4>
                {Object.entries(personTotals).map(([person, amount]) => (
                  <div key={person} className="flex justify-between py-2">
                    <span className="text-gray-700">{person}:</span>
                    <span className="font-semibold text-amber-600">₹{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Split */}
          {paymentOption === 'split' && splitType === 'custom' && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Split</h3>
                <button
                  onClick={addCustomSplit}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <FiPlus /> Add Person
                </button>
              </div>
              
              <div className="space-y-3">
                {customSplits.map((split, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={split.name}
                      onChange={(e) => updateCustomSplit(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Person name"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={split.percentage}
                        onChange={(e) => updateCustomSplit(index, 'percentage', parseFloat(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="%"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-gray-600">%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">₹</span>
                      <input
                        type="number"
                        value={split.amount}
                        onChange={(e) => updateCustomSplit(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {customSplits.length > 2 && (
                      <button
                        onClick={() => removeCustomSplit(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiMinus />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Split:</span>
                  <span className={`font-bold ${Math.abs(customSplits.reduce((sum, split) => sum + split.percentage, 0) - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                    {customSplits.reduce((sum, split) => sum + split.percentage, 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#3E2723' }}>Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('razorpay')}
                className="p-4 rounded-xl border-2 transition-all"
                style={{
                  backdropFilter: 'blur(12px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                  background: paymentMethod === 'razorpay' 
                    ? 'rgba(212, 167, 106, 0.25)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  border: paymentMethod === 'razorpay'
                    ? '2px solid rgba(212, 167, 106, 0.5)'
                    : '2px solid rgba(212, 167, 106, 0.3)',
                  boxShadow: paymentMethod === 'razorpay'
                    ? '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                    : '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <FiCreditCard className="w-6 h-6 mx-auto mb-2" style={{ color: '#D4A76A' }} />
                <div className="font-medium" style={{ color: '#3E2723' }}>Online Payment</div>
                <div className="text-sm mt-1" style={{ color: '#6b7280' }}>Pay via Razorpay</div>
              </button>
              
              <button
                onClick={() => setPaymentMethod('cash')}
                className="p-4 rounded-xl border-2 transition-all"
                style={{
                  backdropFilter: 'blur(12px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(120%)',
                  background: paymentMethod === 'cash' 
                    ? 'rgba(212, 167, 106, 0.25)' 
                    : 'rgba(255, 255, 255, 0.7)',
                  border: paymentMethod === 'cash'
                    ? '2px solid rgba(212, 167, 106, 0.5)'
                    : '2px solid rgba(212, 167, 106, 0.3)',
                  boxShadow: paymentMethod === 'cash'
                    ? '0 8px 32px rgba(212, 167, 106, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
                    : '0 4px 16px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <FiDollarSign className="w-6 h-6 mx-auto mb-2" style={{ color: '#D4A76A' }} />
                <div className="font-medium" style={{ color: '#3E2723' }}>Cash Payment</div>
                <div className="text-sm mt-1" style={{ color: '#6b7280' }}>Mark as paid</div>
              </button>
            </div>
          </div>

          {/* Payment Actions */}
          {paymentMethod && (
            <div className="space-y-4">
              {paymentOption === 'full' ? (
                <button
                  onClick={() => paymentMethod === 'razorpay' ? handleRazorpayPayment(total) : handleCashPayment()}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backdropFilter: 'blur(20px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                    background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.8) 0%, rgba(212, 167, 106, 0.6) 100%)',
                    border: '2px solid rgba(212, 167, 106, 0.5)',
                    color: '#3E2723',
                    boxShadow: '0 8px 32px rgba(212, 167, 106, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'razorpay' ? 'Pay ₹' : 'Mark ₹'}{total.toFixed(2)} {paymentMethod === 'razorpay' ? 'Online' : 'as Paid'}
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  {Object.entries(personTotals).map(([person, amount]) => (
                    <button
                      key={person}
                      onClick={() => paymentMethod === 'razorpay' ? handleRazorpayPayment(amount, person) : handleCashPayment(person)}
                      disabled={isProcessing}
                      className="w-full py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6"
                      style={{
                        backdropFilter: 'blur(20px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                        background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.8) 0%, rgba(212, 167, 106, 0.6) 100%)',
                        border: '2px solid rgba(212, 167, 106, 0.5)',
                        color: '#3E2723',
                        boxShadow: '0 8px 32px rgba(212, 167, 106, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span>{person} - Pay ₹{amount.toFixed(2)}</span>
                      {paymentMethod === 'razorpay' ? <FiCreditCard /> : <FiCheck />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
