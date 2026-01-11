import { useEffect, useState } from 'react'

export default function ReceiptModal({ open, onClose, receipt, canEdit = false, onUpdate, onCouponApply, onCouponRemove, onDelete }) {
  if (!open || !receipt) return null
  const [items, setItems] = useState(receipt.items || [])
  useEffect(()=>{ setItems(receipt.items || []) }, [receipt])
  const [couponInput, setCouponInput] = useState('')
  
  // --- CALCULATIONS ---
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = receipt.discount || 0
  const taxRate = (receipt.taxEnabled && receipt.taxRate) ? receipt.taxRate : 0
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax - discount

  // --- QR CODE URL ---
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receipt.id || 'receipt')}`

  const doPrint = () => {
    const printContent = document.querySelector('#invoice-print-root')?.cloneNode(true);
    if (printContent) {
      const editSections = printContent.querySelectorAll('.no-print');
      editSections.forEach(el => el.remove());
    }
    
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>Receipt</title>
      <style>
        ${getInvoiceStyles()}
        /* --- THERMAL PRINT OVERRIDES --- */
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 10px 5px; width: 80mm; font-family: 'Courier New', Courier, monospace; }
          
          /* Utility Classes for Print */
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          
          /* Force Black & White */
          * { color: #000 !important; border-color: #000 !important; }
          
          /* Layout Cleanups */
          .master-container { width: 100% !important; box-shadow: none; border: none; gap: 5px; }
          .card { box-shadow: none !important; border: none !important; padding: 0 !important; }
          
          /* HEADER: Left Logo, Right Text specific adjustments for Print */
          .header-card { 
            display: flex !important; 
            flex-direction: row !important; 
            align-items: center !important; 
            justify-content: flex-start !important; 
            text-align: left !important;
            padding: 5px 0 !important;
            gap: 10px !important;
          }
          .logo-img { 
            width: 60px !important; 
            height: 60px !important; 
            object-fit: contain !important; 
            margin: 0 !important;
            filter: grayscale(100%); 
          }
          .restaurant-name { font-size: 18px !important; margin-bottom: 2px !important; }
          .restaurant-info { font-size: 11px !important; line-height: 1.2 !important; }

          .title { border-bottom: 1px solid #000 !important; font-weight: 800; justify-content: center; margin-bottom: 10px; }
          
          /* Product List Styling */
          .product { border-bottom: none !important; padding: 6px 0 !important; grid-template-columns: 1fr 60px !important; gap: 5px !important; }
          .product-icon { display: none !important; }
          
          /* HIDE default footer in print */
          .checkout--footer { display: none !important; } 
          
          /* --- THE MASSIVE TOTAL SECTION --- */
          .total-print-row { 
             display: flex !important; 
             flex-direction: column; 
             align-items: center; 
             justify-content: center;
             border-top: 2px dashed #000;
             border-bottom: 2px dashed #000;
             padding: 10px 0;
             margin: 15px 0;
          }
          .total-print-label { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .total-print-amount { font-size: 38px; font-weight: 900; line-height: 1.1; }

          /* Regulatory & QR */
          .legal-info { margin-top: 5px; padding-top: 5px; border-top: 1px dashed #000 !important; }
          .qr-container { display: flex !important; margin-top: 20px !important; align-items: center; justify-content: center; }
          .qr-img { width: 120px !important; height: 120px !important; display: block !important; }
        }
      </style>
    </head><body>${printContent?.innerHTML || ''}<script>
      window.onload = function() { setTimeout(function(){ window.print(); }, 500); }
    <\/script></body></html>`)
    win.document.close()
  }

  function getInvoiceStyles(){
    return `
    /* --- SCREEN STYLES --- */
    .master-container { display:flex; flex-direction:column; gap:12px; width:100%; max-width:420px; margin:0 auto; font-family: sans-serif; }
    .card { width:100%; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.08); border-radius:12px; overflow:hidden; padding-bottom:10px; }
    
    /* HEADER STYLES (SIDE BY SIDE) */
    .header-card { 
        display: flex; 
        flex-direction: row; 
        align-items: center; 
        justify-content: flex-start;
        text-align: left; 
        padding: 20px;
        gap: 15px; /* Space between logo and text */
    }
    
    .logo-img { 
        width: 70px; 
        height: 70px; 
        object-fit: contain; 
        /* Ensure logo doesn't shrink */
        flex-shrink: 0; 
    }
    
    /* Container for the text on the right */
    .header-text-col {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1;
    }

    .restaurant-name { font-size: 20px; font-weight: 700; color: #1a202c; margin-bottom: 4px; line-height: 1.2; }
    .restaurant-info { font-size: 12px; color: #718096; line-height: 1.4; }
    .restaurant-info div { margin-bottom: 2px; }
    
    .title { height:40px; display:flex; align-items:center; padding:0 20px; border-bottom:1px solid #f0f0f0; font-weight:600; font-size:13px; color:#718096; text-transform:uppercase; letter-spacing:0.5px; background:#fafafa; }
    
    /* Products List */
    .products { display:flex; flex-direction:column; padding:10px 20px; }
    .product { display:grid; grid-template-columns:50px 1fr 80px 90px; gap:10px; padding:12px 0; border-bottom:1px solid #f5f5f5; align-items:center; }
    .product span { font-size:14px; font-weight:600; color:#2d3748; line-height:1.3; }
    .product p { font-size:12px; color:#718096; margin:0; }
    .product-icon { display:flex; align-items:center; justify-content:center; width:40px; height:40px; background:#fffbeb; border-radius:8px; color:#d97706; }

    /* Quantity Controls (Screen only) */
    .quantity { height:28px; display:grid; grid-template-columns:1fr 1fr 1fr; background:#f8f9fa; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; width:80px; }
    .quantity button { background:none; border:none; cursor:pointer; font-weight:600; padding:0; display:flex; align-items:center; justify-content:center; }
    .quantity label { font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; }
    
    .checkout .details { display:grid; grid-template-columns:2fr 1fr; padding:16px 20px; gap:8px; font-size:13px; }
    .checkout .details span:nth-child(2n) { text-align:right; font-weight:600; color:#2d3748; }
    
    /* Print Specific Helpers (Hidden on Screen) */
    .total-print-row { display: none; }
    .print-only { display: none; }
    
    /* Footer Buttons */
    .checkout--footer { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; background:#f8f9fa; border-top:1px solid #edf2f7; gap: 15px; text-align: center; }
    .price-screen { font-size:32px; color:#2d3748; font-weight:800; letter-spacing:-1px; line-height: 1; }
    .btn-group { display: flex; gap: 10px; width: 100%; justify-content: center; }
    .checkout-btn { display:inline-flex; justify-content:center; align-items:center; height:40px; border-radius:8px; font-weight:500; font-size:14px; padding:0 24px; cursor:pointer; min-width: 100px; }
    .btn-primary { background:#8B5A2B; color:#fff; border:none; }
    .btn-secondary { background:#fff; color:#333; border:1px solid #ddd; }
    
    .legal-info { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; text-align: center; font-size: 11px; color: #a0aec0; width: 100%; }
    .qr-container { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 15px; width: 100%; }
    .qr-img { width: 100px; height: 100px; mix-blend-mode: multiply; }
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <style>{getInvoiceStyles()}</style>

      <div className="bg-white rounded-xl shadow-2xl p-6 invoice w-full max-w-md my-8">
        <div id="invoice-print-root" className="master-container">
          
          {/* --- HEADER (Side-by-Side) --- */}
          {showHeader && (
            <div className="card header-card">
              {/* Left Column: Logo */}
              {receipt.restaurantLogo && (
                <img src={receipt.restaurantLogo} alt="Logo" className="logo-img" />
              )}
              
              {/* Right Column: Text Details */}
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
                  </div>
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
                    {/* PRINT ONLY: Breakdown showing Qty x Price */}
                    <div className="print-only" style={{ display: 'none', fontSize: '11px', fontWeight: '500', marginTop: '2px' }}>
                      {it.qty} x ₹{it.price.toFixed(2)}
                    </div>
                  </div>
                  
                  {/* SCREEN ONLY: Qty Controls */}
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

            {/* --- MASSIVE TOTAL (Visible Only on Print) --- */}
            <div className="total-print-row">
              <span className="total-print-label">Total Amount</span>
              <span className="total-print-amount">₹{total.toFixed(2)}</span>
            </div>

            {/* --- LEGAL & QR --- */}
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

            {/* --- SCREEN FOOTER (Hidden on Print) --- */}
            <div className="checkout--footer no-print">
              <div className="text-center">
                <div className="total-label">Total Amount</div>
                <div className="price-screen">₹{total.toFixed(2)}</div>
              </div>
              <div className="btn-group">
                <button className="checkout-btn btn-secondary" onClick={onClose}>Close</button>
                <button className="checkout-btn btn-primary" onClick={doPrint}>Print Receipt</button>
              </div>
            </div>
          </div>
        </div>

        {/* --- EDIT CONTROLS --- */}
        {canEdit && (
          <div className="mt-4 p-3 border rounded no-print bg-gray-50">
            <div className="font-semibold mb-2">Edit Receipt</div>
            <div className="mb-3 flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Coupon code</label>
                <input value={couponInput} onChange={e=>setCouponInput(e.target.value)} className="border rounded px-2 py-1 w-24" placeholder="CODE" />
              </div>
              <button className="px-3 py-1 border rounded bg-white" onClick={()=>{ if (!couponInput.trim()) return; onCouponApply?.(couponInput.trim()) }}>Apply</button>
              <button className="px-3 py-1 border rounded bg-white text-red-500" onClick={()=> onCouponRemove?.() }>Clear</button>
            </div>
            <div className="text-right mt-3">
              <button className="px-4 py-2 bg-amber-700 text-white rounded font-medium" onClick={()=>{ onUpdate?.(items) }}>Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}