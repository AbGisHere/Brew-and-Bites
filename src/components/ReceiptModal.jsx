import { useEffect, useState } from 'react'

export default function ReceiptModal({ open, onClose, receipt, canEdit = false, onUpdate, onCouponApply, onCouponRemove, onDelete }) {
  if (!open || !receipt) return null
  const [items, setItems] = useState(receipt.items || [])
  useEffect(()=>{ setItems(receipt.items || []) }, [receipt])
  const [couponInput, setCouponInput] = useState('')
  
  // Calculate values based on current items
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = receipt.discount || 0
  const taxRate = receipt.taxRate || 0
  const tax = subtotal * (taxRate / 100)
  const shipping = 0
  const total = subtotal + tax - discount + shipping

  const doPrint = () => {
    // Hide edit controls before printing
    const printContent = document.querySelector('#invoice-print-root')?.cloneNode(true);
    if (printContent) {
      const editSections = printContent.querySelectorAll('.no-print');
      editSections.forEach(el => el.remove());
    }
    
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>Receipt ${receipt.id}</title>
      <style>
        body{font-family: Arial, sans-serif;}
        ${getInvoiceStyles()}
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head><body><div class="invoice">${printContent?.innerHTML || ''}</div><script>window.onload=()=>window.print();<\/script></body></html>`)
    win.document.close()
  }

  function getInvoiceStyles(){
    return `
    .master-container{display:grid;grid-template-columns:auto;gap:12px;max-width:420px;margin:0 auto}
    .card{width:100%;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.1);border-radius:12px;overflow:hidden}
    .title{width:100%;height:48px;display:flex;align-items:center;padding:0 20px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:14px;color:#333;text-transform:uppercase;letter-spacing:0.5px}
    .cart{border-radius:12px}
    .products{display:flex;flex-direction:column;padding:16px 20px}
    .product{display:grid;grid-template-columns:50px 1fr 80px 90px;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;align-items:center}
    .product:last-child{border-bottom:none}
    .product span{font-size:14px;font-weight:600;color:#2d3748;display:block;line-height:1.3}
    .product p{font-size:12px;font-weight:500;color:#718096;margin-top:2px}
    .quantity{height:28px;display:grid;grid-template-columns:1fr 1fr 1fr;margin:0 auto;background:#f8f9fa;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;width:80px}
    .quantity button{background:none;border:none;cursor:pointer;color:#4a5568;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;padding:0 8px}
    .quantity button:first-child{border-right:1px solid #e2e8f0}
    .quantity button:last-child{border-left:1px solid #e2e8f0}
    .quantity label{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#2d3748}
    .small{font-size:14px;font-weight:600;color:#2d3748}
    .checkout{border-radius:12px;margin-top:8px}
    .checkout .details{display:grid;grid-template-columns:2fr 1fr;padding:16px 20px;gap:10px;font-size:13px}
    .checkout .details span{font-size:13px;font-weight:500;color:#4a5568}
    .checkout .details span:nth-child(2n){text-align:right;font-weight:600;color:#2d3748}
    .checkout--footer{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#f8f9fa;border-top:1px solid #edf2f7}
    .price{font-size:20px;color:#2d3748;font-weight:700;letter-spacing:-0.5px}
    .checkout-btn{display:inline-flex;justify-content:center;align-items:center;height:40px;background:#8B5A2B;color:#fff;border:0;border-radius:8px;font-weight:500;font-size:14px;padding:0 20px;cursor:pointer;transition:all 0.2s ease;min-width:100px}
    .checkout-btn:hover{background:#744a24;transform:translateY(-1px)}
    .checkout-btn:active{transform:translateY(0)}
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl p-6 invoice w-full max-w-md my-8">
        <div id="invoice-print-root" className="master-container">
          <div className="card cart">
            <label className="title">Order Summary</label>
            <div className="products">
              {items.map((it, idx) => (
                <div className="product" key={idx}>
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-50 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                    </svg>
                  </div>
                  <div>
                    <span>{it.name}</span>
                    <p className={canEdit ? "" : "no-print"}>Qty: {it.qty}</p>
                  </div>
                  <div className="quantity no-print">
                    <button onClick={(e) => { e.stopPropagation(); inc(idx, -1) }}>-</button>
                    <label>{it.qty}</label>
                    <button onClick={(e) => { e.stopPropagation(); inc(idx, 1) }}>+</button>
                  </div>
                  <div className="text-right">
                    <span className="price small">₹{(it.price * it.qty).toFixed(2)}</span>
                    <span className="print-only block text-xs mt-1">Qty: {it.qty}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); del(idx) }}
                      className="text-red-500 text-xs mt-1 hover:underline no-print"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card checkout">
            <label className="title">Payment Summary</label>
            <div className="details">
              <span>Subtotal ({items.reduce((sum, item) => sum + item.qty, 0)} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
              
              {receipt.couponCode && (
                <>
                  <span>Discount ({receipt.couponCode})</span>
                  <span className="text-green-600">-₹{discount.toFixed(2)}</span>
                </>
              )}
              
              <span>Tax ({receipt.taxRate || 0}%)</span>
              <span>₹{tax.toFixed(2)}</span>
              
              <span className="font-medium">Total Amount</span>
              <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
            </div>
            <div className="checkout--footer">
              <div>
                <div className="text-sm text-gray-500">Total</div>
                <div className="price">₹{total.toFixed(2)}</div>
              </div>
              <div className="flex gap-3">
                <button 
                  className="checkout-btn bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
                  onClick={onClose}
                >
                  Close
                </button>
                <button 
                  className="checkout-btn bg-amber-700 hover:bg-amber-800"
                  onClick={doPrint}
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-4 p-3 border rounded no-print">
            <div className="font-semibold mb-2">Edit Receipt (won't show on print)</div>
            <div className="mb-3 flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Coupon code</label>
                <input value={couponInput} onChange={e=>setCouponInput(e.target.value)} className="border rounded px-2 py-1" placeholder="WELCOME10" />
              </div>
              <button className="px-3 py-1 border rounded" onClick={()=>{ if (!couponInput.trim()) return; onCouponApply?.(couponInput.trim()) }}>Apply</button>
              <button className="px-3 py-1 border rounded" onClick={()=> onCouponRemove?.() }>Remove</button>
              <div className="text-sm ml-2">Current: {receipt.couponCode ? receipt.couponCode : 'None'}</div>
            </div>
            <ul className="space-y-2 text-sm">
              {items.map((it, idx)=> (
                <li key={idx} className="flex justify-between items-center border rounded p-2">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-gray-500">₹{it.price.toFixed(2)} each</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>inc(idx,-1)}>-</button>
                    <span>{it.qty}</span>
                    <button className="px-2 py-1 border rounded" onClick={()=>inc(idx,1)}>+</button>
                  </div>
                  <div className="w-20 text-right font-semibold">₹{(it.price*it.qty).toFixed(2)}</div>
                  <button className="text-red-600 text-sm no-print" onClick={()=>del(idx)}>Delete</button>
                </li>
              ))}
            </ul>
            <div className="text-right mt-3">
              <button className="px-3 py-1 bg-primary text-white rounded" onClick={()=>{ onUpdate?.(items) }}>Save Changes</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
