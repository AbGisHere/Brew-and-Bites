import { useEffect, useState } from 'react'

export default function ReceiptModal({ open, onClose, receipt, canEdit = false, onUpdate, onCouponApply, onCouponRemove, onDelete }) {
  if (!open || !receipt) return null
  const [items, setItems] = useState(receipt.items || [])
  useEffect(()=>{ setItems(receipt.items || []) }, [receipt])
  const [couponInput, setCouponInput] = useState('')
  
  // Function to calculate sequential Order ID (this should match the logic in AdminDashboard)
  const getOrderNumber = (currentReceipt) => {
    // This is a simplified version - in a real app, you'd fetch all receipts and calculate
    // For now, we'll use the receipt ID as a fallback or you can pass the order number as a prop
    return currentReceipt.orderNumber || currentReceipt.id?.slice(-6) || 'N/A'
  }
  
  // --- CALCULATIONS ---
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = receipt.discount || 0
  const taxRate = (receipt.taxEnabled && receipt.taxRate) ? receipt.taxRate : 0
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax - discount

  // --- QR CODE FIX ---
  // 1. Get the current domain (e.g. https://myapp.vercel.app or http://localhost:3000)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // 2. Build the full link. Change '/orders/' to whatever route allows viewing a receipt on your site.
  const receiptLink = `${origin}/orders/${receipt.id}`;
  // 3. Generate QR pointing to that link
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptLink)}`
  
  // --- PRINT FUNCTION (DIRECT / NO NEW TAB) ---
  const doPrint = () => {
    // 1. Get the content
    const printContent = document.querySelector('#invoice-print-root')?.cloneNode(true);
    if (printContent) {
      // Clean up for print
      const editSections = printContent.querySelectorAll('.no-print');
      editSections.forEach(el => el.remove());
    }

    // 2. Create a hidden iframe on the fly
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    document.body.appendChild(iframe);

    // 3. Write content into the iframe and trigger print
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            ${getInvoiceStyles()}
            /* Force Thermal Print Styles */
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body { margin: 0; padding: 10px 5px; width: 80mm; font-family: 'Courier New', Courier, monospace; }
              
              /* Visibility Toggles */
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              
              /* Reset Colors & Borders */
              * { color: #000 !important; border-color: #000 !important; }
              
              /* Reset Containers */
              .master-container { width: 100% !important; box-shadow: none; border: none; gap: 5px; }
              .card { box-shadow: none !important; border: none !important; padding: 0 !important; }
              
              /* Header */
              .header-card { 
                display: flex !important; flex-direction: row !important; align-items: center !important; 
                justify-content: flex-start !important; text-align: left !important;
                padding: 5px 0 !important; gap: 10px !important;
              }
              .logo-img { width: 60px !important; height: 60px !important; filter: grayscale(100%); margin: 0 !important; }
              .restaurant-name { font-size: 18px !important; margin-bottom: 2px !important; }
              .restaurant-info { font-size: 11px !important; line-height: 1.2 !important; }
              
              /* List */
              .title { border-bottom: 1px solid #000 !important; font-weight: 800; justify-content: center; margin-bottom: 10px; }
              .product { border-bottom: none !important; padding: 6px 0 !important; grid-template-columns: 1fr 60px !important; gap: 5px !important; }
              .product-icon { display: none !important; }
              
              /* Footer */
              .checkout--footer { display: none !important; } 
              .total-print-row { 
                 display: flex !important; flex-direction: column; align-items: center; justify-content: center;
                 border-top: 2px dashed #000; border-bottom: 2px dashed #000;
                 padding: 10px 0; margin: 15px 0;
              }
              .total-print-label { font-size: 16px; font-weight: bold; text-transform: uppercase; }
              .total-print-amount { font-size: 38px; font-weight: 900; line-height: 1.1; }
              .legal-info { margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000 !important; }
              .qr-container { display: flex !important; margin-top: 20px !important; align-items: center; justify-content: center; }
              .qr-img { width: 120px !important; height: 120px !important; display: block !important; }
            }
          </style>
        </head>
        <body>
          ${printContent?.innerHTML || ''}
          <script>
            // Wait slightly for images to load, then print
            window.onload = function() { 
              setTimeout(function(){ 
                window.print(); 
                // Clean up iframe after a delay if needed, though leaving it is safer for mobile browsers
              }, 500); 
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  }

  function getInvoiceStyles(){
    return `
    /* --- GLOBAL & RESET --- */
    * { box-sizing: border-box; }
    
    /* --- DESKTOP STYLES (Default) --- */
    .master-container { 
      display: flex; flex-direction: column; gap: 12px; 
      width: 100%; max-width: 100%; margin: 0 auto; 
      font-family: sans-serif; 
    }
    
    /* The "Mini Containers" inside the modal */
    .card { 
      width: 100%; background: #fff; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.08); 
      border-radius: 12px; overflow: hidden; 
      padding-bottom: 10px; 
    }
    
    /* HEADER (Side-by-Side) */
    .header-card { 
        display: flex; flex-direction: row; align-items: center; justify-content: flex-start;
        text-align: left; padding: 20px; gap: 15px;
    }
    .logo-img { width: 70px; height: 70px; object-fit: contain; flex-shrink: 0; }
    .header-text-col { display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0; }

    .restaurant-name { font-size: 20px; font-weight: 700; color: #1a202c; margin-bottom: 4px; line-height: 1.2; }
    .restaurant-info { font-size: 12px; color: #718096; line-height: 1.4; word-wrap: break-word; }
    .restaurant-info div { margin-bottom: 2px; }
    
    .title { height: 40px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #f0f0f0; font-weight: 600; font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; background: #fafafa; }
    
    /* Order Info Styles */
    .order-info { 
      padding: 12px 20px !important; 
      background: #f8f9fa !important; 
      border-bottom: 1px solid #e2e8f0 !important;
      text-align: center !important;
    }
    .order-info .text-center { 
      font-size: 12px !important; 
      color: #6b7280 !important; 
      font-weight: 500 !important;
    }
    
    /* PRODUCT LIST (Desktop Grid) */
    .products { display: flex; flex-direction: column; padding: 10px 20px; }
    /* Desktop: Icon(50) Name(1fr) Qty(80) Price(90) */
    .product { display: grid; grid-template-columns: 50px 1fr 80px 90px; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f5f5f5; align-items: center; }
    .product span { font-size: 14px; font-weight: 600; color: #2d3748; line-height: 1.3; }
    .product p { font-size: 12px; color: #718096; margin: 0; }
    .product-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #fffbeb; border-radius: 8px; color: #d97706; }

    /* Quantity Controls */
    .quantity { height: 28px; display: grid; grid-template-columns: 1fr 1fr 1fr; background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; width: 80px; }
    .quantity button { background: none; border: none; cursor: pointer; font-weight: 600; padding: 0; display: flex; align-items: center; justify-content: center; }
    .quantity label { font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; }
    
    .checkout .details { display: grid; grid-template-columns: 2fr 1fr; padding: 16px 20px; gap: 8px; font-size: 13px; }
    .checkout .details span:nth-child(2n) { text-align: right; font-weight: 600; color: #2d3748; }
    
    /* Helpers */
    .total-print-row { display: none; }
    .print-only { display: none; }
    
    /* Footer */
    .checkout--footer { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: #f8f9fa; border-top: 1px solid #edf2f7; gap: 15px; text-align: center; }
    .price-screen { font-size: 32px; color: #2d3748; font-weight: 800; letter-spacing: -1px; line-height: 1; }
    .btn-group { display: flex; gap: 10px; width: 100%; justify-content: center; }
    .checkout-btn { display: inline-flex; justify-content: center; align-items: center; height: 40px; border-radius: 8px; font-weight: 500; font-size: 14px; padding: 0 24px; cursor: pointer; min-width: 100px; }
    
    .legal-info { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; text-align: center; font-size: 11px; color: #a0aec0; width: 100%; }
    .qr-container { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 15px; width: 100%; }
    .qr-img { width: 100px; height: 100px; mix-blend-mode: multiply; }

    /* --- MOBILE OPTIMIZATION (Max Width 480px) --- */
    @media only screen and (max-width: 480px) {
        /* Force container to never exceed screen width */
        .master-container { width: 100% !important; padding: 0 !important; }
        
        /* Header: Reduce padding */
        .header-card { padding: 12px 10px !important; gap: 10px !important; }
        .logo-img { width: 50px !important; height: 50px !important; }
        .restaurant-name { font-size: 16px !important; }
        
        /* PRODUCT GRID FIX: HIDE ICON, ADJUST COLS */
        /* Name(1fr) Qty(80px) Price(85px) = Fits in 360px screen */
        .product { 
            grid-template-columns: 1fr 80px 85px !important; 
            gap: 5px !important; 
            padding: 10px 0 !important; 
        }
        .product-icon { display: none !important; } /* Hide icon to save space */
        
        /* Smaller font on mobile */
        .product span { font-size: 13px !important; }
        
        /* Reduce Inner Padding inside cards */
        .products { padding: 10px 10px !important; }
        .checkout .details { padding: 10px 12px !important; }
        .checkout--footer { padding: 15px 10px !important; }
        
        /* Ensure buttons don't overflow */
        .btn-group { width: 100%; gap: 8px; }
        .checkout-btn { flex: 1; padding: 0 10px !important; font-size: 13px !important; min-width: 0 !important; }
    }
    `
  }

  const inc = (idx, d) => {
    const next = items.map((it,i) => {
      if (i === idx) {
        const newQty = Math.max(1, it.qty + d)
        return { ...it, qty: newQty }
      }
      return it
    })
    setItems(next)
  }
  const del = (idx) => {
    const next = items.filter((_,i) => i !== idx)
    setItems(next)
  }

  const showHeader = receipt.restaurantLogo || receipt.showRestaurantName || receipt.showRestaurantAddress || receipt.showContactNumber || receipt.showEmail;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-2 md:p-4 overflow-y-auto">
      <style>{getInvoiceStyles()}</style>

      {/* Main Container: p-3 on mobile prevents "running out" of screen */}
      <div className="bg-white rounded-xl shadow-2xl p-3 md:p-6 invoice w-full max-w-md my-4 md:my-8 relative">
        <div id="invoice-print-root" className="master-container">
          
          {/* --- HEADER --- */}
          {showHeader && (
            <div className="card header-card">
              {receipt.restaurantLogo && receipt.showRestaurantLogo && (
                <img src={receipt.restaurantLogo} alt="Logo" className="logo-img" />
              )}
              
              <div className="header-text-col">
                  {receipt.showRestaurantName && receipt.restaurantName && (
                    <div className="restaurant-name">{receipt.restaurantName}</div>
                  )}
                  
                  <div className="restaurant-info">
                    {receipt.showRestaurantAddress && receipt.restaurantAddress && (
                        <div>{receipt.restaurantAddress}</div>
                    )}
                    {(receipt.showContactNumber || receipt.showEmail) && (
                        <div>
                            {receipt.showContactNumber && receipt.contactNumber && <div>📞 {receipt.contactNumber}</div>}
                            {receipt.showEmail && receipt.email && <div>✉️ {receipt.email}</div>}
                        </div>
                    )}
                    {receipt.showRestaurantTiming && (
                      <div className="mt-1 font-medium text-amber-800">
                        {receipt.detailedTimings ? (
                          (() => {
                            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            const today = days[new Date().getDay()];
                            const timing = receipt.detailedTimings[today];
                            if (timing?.closed) return <div className="text-red-500 font-bold uppercase tracking-wider text-[10px]">Closed Today</div>;
                            return <div className="flex items-center gap-1">🕒 <span className="text-[11px]">Today: {timing?.open} - {timing?.close}</span></div>;
                          })()
                        ) : (
                          receipt.restaurantTiming && <div className="flex items-center gap-1">🕒 <span className="text-[11px]">{receipt.restaurantTiming}</span></div>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            </div>
          )}

          {/* --- ORDER INFO --- */}
          {((receipt.showOrderTime && receipt.createdAt) || (receipt.showOrderDate && receipt.createdAt) || receipt.showOrderID) && (
            <div className="card order-info">
              <div className="text-center">
                {receipt.showOrderID && (
                  <div style={{ marginBottom: (receipt.showOrderDate || receipt.showOrderTime) ? '8px' : '0' }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#2d3748',
                      fontFamily: 'monospace'
                    }}>
                      Order #{getOrderNumber(receipt)}
                    </span>
                  </div>
                )}
                {receipt.showOrderDate && receipt.createdAt && (
                  <div style={{ marginBottom: receipt.showOrderTime ? '4px' : '0' }}>
                    {new Date(receipt.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short', 
                      year: 'numeric'
                    })}
                  </div>
                )}
                {receipt.showOrderTime && receipt.createdAt && (
                  <div>
                    {new Date(receipt.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- ITEMS --- */}
          <div className="card cart">
            <label className="title">Order Receipt</label>
            <div className="products">
              {items.map((it, idx) => (
                <div className="product" key={idx}>
                  <div className="product-icon no-print">
                    <span className="text-lg">🍽️</span>
                  </div>
                  <div>
                    <span>{it.name}</span>
                    <div className="print-only" style={{ display: 'none', fontSize: '11px', fontWeight: '500', marginTop: '2px' }}>
                      {it.qty} x ₹{it.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className={canEdit ? "quantity no-print" : "no-print text-center font-bold"}>
                     {canEdit ? (
                        <>
                         <button onClick={(e) => { e.stopPropagation(); inc(idx, -1) }}>-</button>
                         <label>{it.qty}</label>
                         <button onClick={(e) => { e.stopPropagation(); inc(idx, 1) }}>+</button>
                        </>
                     ) : (
                        <span>x{it.qty}</span>
                     )}
                  </div>
                  
                  <div className="text-right">
                    <span className="small">₹{(it.price * it.qty).toFixed(2)}</span>
                    <button onClick={(e) => { e.stopPropagation(); del(idx) }} className="text-red-500 text-xs mt-1 hover:underline no-print block ml-auto">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- PAYMENT --- */}
          <div className="card checkout">
            <div className="details">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
              
              {receipt.couponCode && (
                <>
                  <span>Discount ({receipt.couponCode})</span>
                  <span className="text-green-600">-₹{discount.toFixed(2)}</span>
                </>
              )}
              {receipt.taxEnabled && (
                <>
                  <span>Tax ({receipt.taxRate || 0}%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </>
              )}
            </div>

            <div className="total-print-row">
              <span className="total-print-label">Total Amount</span>
              <span className="total-print-amount">₹{total.toFixed(2)}</span>
            </div>

            <div className="legal-info">
                {(receipt.showGSTNumber || receipt.showFSSAINumber) && (
                  <div style={{marginBottom: '10px'}}>
                    {receipt.showGSTNumber && receipt.gstNumber && <div>GSTIN: <span className="font-mono">{receipt.gstNumber}</span></div>}
                    {receipt.showFSSAINumber && receipt.fssaiNumber && <div>FSSAI: <span className="font-mono">{receipt.fssaiNumber}</span></div>}
                  </div>
                )}
                {receipt.includeQRInInvoice && (
                  <div className="qr-container">
                    <img src={qrUrl} alt="Receipt QR" className="qr-img" />
                    <span className="text-[10px] text-gray-400 mt-1">Scan to view receipt</span>
                  </div>
                )}
            </div>

            <div className="checkout--footer no-print">
              <div className="text-center">
                <div className="total-label">Total Amount</div>
                <div className="price-screen">₹{total.toFixed(2)}</div>
              </div>
              <div className="btn-group">
                <button className="checkout-btn bg-white text-gray-800 border border-gray-300" onClick={onClose}>Close</button>
                <button className="checkout-btn bg-amber-700 text-white" onClick={doPrint}>Print Receipt</button>
              </div>
            </div>
          </div>
        </div>
        
        {canEdit && (
          <div className="mt-6 p-6 border-2 border-gray-100 rounded-2xl no-print bg-white shadow-xl ring-1 ring-gray-200 ring-opacity-50">
            <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
              <div className="w-1 h-6 bg-amber-600 rounded-full mr-3"></div>
              <div className="text-lg font-bold text-gray-900">Edit Receipt</div>
            </div>
            <div className="mb-6 flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Coupon Code</label>
                <div className="relative">
                  <input 
                    value={couponInput} 
                    onChange={e=>setCouponInput(e.target.value)} 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white shadow-sm transition-all duration-200" 
                    placeholder="Enter coupon code" 
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 opacity-0 hover:opacity-5 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5" 
                  onClick={()=>{ if (!couponInput.trim()) return; onCouponApply?.(couponInput.trim()) }}
                >
                  Apply
                </button>
                <button 
                  className="px-6 py-3 border-2 border-red-200 rounded-xl bg-white hover:bg-red-50 text-sm font-semibold text-red-600 shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-200 transform hover:-translate-y-0.5" 
                  onClick={()=> onCouponRemove?.() }
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 shadow-inner">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Tip:</span> Your changes will be saved immediately
                </div>
                <div className="flex gap-3">
                  <button 
                    className="animated-button group relative inline-flex items-center justify-center"
                    onClick={()=>{ onUpdate?.(items) }}
                    style={{
                      '--color': '#D4A76A',
                      '--hover-color': '#3E2723',
                      padding: '10px 28px',
                      fontSize: '14px',
                      minWidth: '150px',
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: '2px solid',
                      borderColor: 'transparent',
                      fontWeight: '600',
                      backgroundColor: 'transparent',
                      borderRadius: '100px',
                      color: '#D4A76A',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                      boxShadow: '0 0 0 2px #D4A76A'
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                      <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                    </svg>
                    <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                      Save Changes
                    </span>
                    <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                    <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                      <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                    </svg>
                    <style>{`
                      .animated-button:hover { 
                        box-shadow: 0 0 0 8px transparent !important; 
                        color: white !important; 
                        border-radius: 12px !important; 
                      }
                      .animated-button:hover .arr-1 { right: -25% !important; }
                      .animated-button:hover .arr-2 { left: 16px !important; }
                      .animated-button:hover .text { transform: translateX(12px) !important; }
                      .animated-button:hover svg { fill: white !important; }
                      .animated-button:active { 
                        transform: scale(0.95) !important; 
                        box-shadow: 0 0 0 4px #D4A76A !important; 
                      }
                      .animated-button:hover .circle { 
                        width: 200px !important; 
                        height: 200px !important; 
                        opacity: 1 !important; 
                        background-color: #3E2723 !important; 
                      }
                    `}</style>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}