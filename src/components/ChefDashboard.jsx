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
    const newStatus = currentStatus === 'preparing' ? 'ready' : 'preparing'
    
    // Find the order locally to modify the specific item
    const order = orders.find(o => o._id === orderId);
    if(!order) return;

    // Update the specific item in the array
    const updatedItems = order.items.map(item => {
      // MongoDB subdocuments use _id, but your UI might rely on 'id' or 'itemId'
      // We check both just to be safe
      if (item._id === itemId || item.id === itemId) {
        return { ...item, status: newStatus };
      }
      return item;
    });

    try {
      // 2. USE API_URL VARIABLE
      await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems })
      });
      refresh();
    } catch (e) { alert("Connection Error"); }
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
          <button className="px-3 py-1 border rounded" onClick={() => { logout(); onExit?.() }}>Logout</button>
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