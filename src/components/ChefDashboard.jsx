import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
// REMOVED: import { store } from '../store'
import API_URL from '../config'; // <--- 1. IMPORT THIS

const statusColors = {
  preparing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-blue-100 text-blue-800',
  served: 'bg-green-100 text-green-800'
}

const statusLabels = {
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served'
}

export default function ChefDashboard({ onExit }) {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([]) // Need to fetch tables to show names

  // 1. Fetch Data
  const refresh = async () => {
    try {
      // 2. USE API_URL VARIABLE
      const [orderRes, tableRes] = await Promise.all([
        fetch(`${API_URL}/api/orders?status=open`),
        fetch(`${API_URL}/api/tables`)
      ]);
      const oData = await orderRes.json();
      const tData = await tableRes.json();
      
      setOrders(oData);
      setTables(tData);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [])

  // 2. Toggle Status (API)
  const toggleItemStatus = async (orderId, itemId, currentStatus) => {
    // Don't allow changing status if item is already served
    if (currentStatus === 'served') return;
    
    const newStatus = currentStatus === 'preparing' ? 'ready' : 'preparing';
    
    // Find the order locally to modify the specific item
    const order = orders.find(o => o._id === orderId);
    if(!order) return;

    // Update the specific item in the array
    const updatedItems = order.items.map(item => {
      // MongoDB subdocuments use _id, but your UI might rely on 'id' or 'itemId'
      if (item._id === itemId || item.id === itemId) {
        return { ...item, status: newStatus };
      }
      return item;
    });

    try {
      await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems })
      });
      refresh();
    } catch (e) { 
      console.error("Error updating item status:", e);
      alert("Failed to update item status"); 
    }
  }

  // Helper to get table name
  const getTableName = (id) => {
    const t = tables.find(t => t._id === id || t.id === id);
    return t ? t.name : 'Unknown Table';
  }

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Chef Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.username}</span>
          <button
            className="animated-button group relative inline-flex items-center justify-center"
            onClick={() => { logout(); onExit?.() }}
            style={{
              '--color': '#8B5A2B',
              '--hover-color': '#5D4037',
              padding: '6px 20px',
              fontSize: '14px',
              minWidth: '100px',
              height: '36px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '2px solid',
              borderColor: 'transparent',
              fontWeight: '500',
              backgroundColor: 'transparent',
              borderRadius: '100px',
              color: '#8B5A2B',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              boxShadow: '0 0 0 2px #8B5A2B'
            }}
          >
            <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#8B5A2B', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16 17l5-5-5-5M19.8 12H4M14 7l-3.2 2.4c-.5.4-.8.9-.8 1.6v5c0 .7.3 1.2.8 1.6L14 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>Logout</span>
            <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#8B5A2B', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
            <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#8B5A2B', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M8 7l5-5 5 5M13 21V4M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <style jsx>{`
              .animated-button:hover { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
              .animated-button:hover .arr-1 { right: -25% !important; }
              .animated-button:hover .arr-2 { left: 16px !important; }
              .animated-button:hover .text { transform: translateX(12px) !important; }
              .animated-button:hover svg { fill: white !important; }
              .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #8B5A2B !important; }
              .animated-button:hover .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #5D4037 !important; }
            `}</style>
          </button>
        </div>
      </div>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Open Orders</h3>
            <button className="text-sm text-gray-600" onClick={refresh}>Refresh</button>
          </div>
          <ul className="space-y-3">
            {orders.length === 0 && (
              <li className="text-gray-500">No open orders.</li>
            )}
            {orders.map(o => (
              <li key={o._id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Table: {getTableName(o.tableId)}</div>
                  <div className={`text-xs px-2 py-0.5 rounded ${o.kitchenPrepared ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {o.kitchenPrepared ? 'Prepared' : 'Preparing'}
                  </div>
                </div>
                <ul className="mt-2 text-sm space-y-2">
                  {o.items.map((it, idx) => (
                    <li key={it._id || idx} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{it.name} x{it.qty}</div>
                        <div className="text-xs text-gray-500">₹{it.price.toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[it.status || 'preparing']}`}>
                          {statusLabels[it.status || 'preparing']}
                        </span>
                        <button
                          className={`px-2 py-1 text-sm rounded ${
                            (it.status === 'preparing' || !it.status) 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                          onClick={() => toggleItemStatus(o._id, it._id, it.status || 'preparing')}
                        >
                          {(!it.status || it.status === 'preparing') ? 'Mark Ready' : 'Mark Preparing'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <span className="font-semibold">Total: ₹{o.total.toFixed(2)}</span>
                  <div className="text-sm text-gray-500">
                    {o.items.filter(i => i.status === 'ready' || i.status === 'served').length} of {o.items.length} items ready
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}