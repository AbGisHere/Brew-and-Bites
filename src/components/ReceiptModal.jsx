import { useEffect, useState } from 'react'

export default function ReceiptModal({ open, onClose, receipt, canEdit = false, onUpdate, onCouponApply, onCouponRemove }) {
  if (!open || !receipt) return null
  const [items, setItems] = useState(receipt.items || [])
  useEffect(()=>{ setItems(receipt.items || []) }, [receipt])
  const [couponInput, setCouponInput] = useState('')
  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = receipt.discount || 0
  const shipping = 0
  const total = receipt.total ?? (subtotal - discount + shipping)

  const doPrint = () => {
    const content = document.querySelector('#invoice-print-root')?.innerHTML || ''
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!doctype html><html><head><title>Receipt ${receipt.id}</title>
      <style>
        body{font-family: Arial, sans-serif;}
        ${getInvoiceStyles()}
      </style>
    </head><body><div class="invoice">${content}</div><script>window.onload=()=>window.print();<\/script></body></html>`)
    win.document.close()
  }

  function getInvoiceStyles(){
    return `
    .master-container{display:grid;grid-template-columns:auto;gap:5px}
    .card{width:400px;background:#fff;box-shadow:0 187px 75px rgba(0,0,0,.01),0 105px 63px rgba(0,0,0,.05),0 47px 47px rgba(0,0,0,.09),0 12px 26px rgba(0,0,0,.1),0 0 0 rgba(0,0,0,.1)}
    .title{width:100%;height:40px;display:flex;align-items:center;padding-left:20px;border-bottom:1px solid #efeff3;font-weight:700;font-size:11px;color:#63656b}
    .cart{border-radius:19px 19px 7px 7px}
    .products{display:flex;flex-direction:column;padding:10px}
    .product{display:grid;grid-template-columns:60px 1fr 80px 1fr;gap:10px}
    .product span{font-size:13px;font-weight:600;color:#47484b;margin-bottom:8px;display:block}
    .product p{font-size:11px;font-weight:600;color:#7a7c81}
    .quantity{height:30px;display:grid;grid-template-columns:1fr 1fr 1fr;margin:auto;background:#fff;border:1px solid #e5e5e5;border-radius:7px}
    .quantity label{width:20px;height:30px;display:flex;align-items:center;justify-content:center;padding-bottom:2px;font-size:15px;font-weight:700;color:#47484b}
    .small{font-size:15px;margin:0 0 auto auto}
    .coupons{border-radius:7px}
    .coupons .form{display:grid;grid-template-columns:1fr 80px;gap:10px;padding:10px}
    .input_field{height:36px;padding:0 0 0 12px;border:1px solid #e5e5e5;border-radius:5px}
    .checkout{border-radius:9px 9px 19px 19px}
    .checkout .details{display:grid;grid-template-columns:3fr 1fr;padding:10px;gap:5px}
    .checkout .details span{font-size:13px;font-weight:600}
    .checkout--footer{display:flex;align-items:center;justify-content:space-between;padding:10px 10px 10px 20px;background:#efeff3}
    .price{position:relative;font-size:22px;color:#2B2B2F;font-weight:900}
    .checkout-btn{display:flex;justify-content:center;align-items:center;width:150px;height:36px;background:#8B5A2B;color:#fff;border:0;border-radius:7px}
    `
  }

  const inc = (idx, d) => {
    const next = items.map((it,i)=> i===idx ? { ...it, qty: Math.max(1, it.qty + d) } : it)
    setItems(next)
  }
  const del = (idx) => {
    const next = items.filter((_,i)=>i!==idx)
    setItems(next)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 invoice">
        <div id="invoice-print-root" className="master-container">
          <div className="card cart">
            <label className="title">Your cart</label>
            <div className="products">
              {items.map((it, idx) => (
                <div className="product" key={idx}>
                  <svg fill="none" viewBox="0 0 60 60" height="60" width="60" xmlns="http://www.w3.org/2000/svg">
                    <rect fill="#FFF6EE" rx="8.25" height="60" width="60"></rect>
                    <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.25" stroke="#FF8413" fill="#FFB672" d="M34.2812 18H25.7189C21.9755 18 18.7931 20.5252 17.6294 24.0434C17.2463 25.2017 17.0547 25.7808 17.536 26.3904C18.0172 27 18.8007 27 20.3675 27H39.6325C41.1993 27 41.9827 27 42.4639 26.3904C42.9453 25.7808 42.7538 25.2017 42.3707 24.0434C41.207 20.5252 38.0246 18 34.2812 18Z"></path>
                  </svg>
                  <div>
                    <span>{it.name}</span>
                    <p>Qty: {it.qty}</p>
                  </div>
                  <div className="quantity"><label>{it.qty}</label></div>
                  <label className="price small">₹{(it.price * it.qty).toFixed(2)}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="card checkout">
            <label className="title">Checkout</label>
            <div className="details">
              <span>Cart subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
              <span>Discount {receipt.couponCode ? `(Code: ${receipt.couponCode})` : ''}:</span>
              <span>₹{discount.toFixed(2)}</span>
              <span>Fees:</span>
              <span>₹{shipping.toFixed(2)}</span>
            </div>
            <div className="checkout--footer">
              <label className="price"><sup>₹</sup>{total.toFixed(2)}</label>
              <div className="flex gap-2">
                <button className="checkout-btn" onClick={doPrint}>Print</button>
                <button className="checkout-btn" onClick={onClose}>Close</button>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-4 p-3 border rounded">
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
                  <button className="text-red-600 text-sm" onClick={()=>del(idx)}>Delete</button>
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
