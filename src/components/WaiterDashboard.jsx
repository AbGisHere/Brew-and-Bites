import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
// REMOVED: import { store } from '../store'
import { useAuth } from '../context/AuthContext'
import ReceiptModal from './ReceiptModal'
import API_URL from '../config'; // <--- 1. IMPORT THIS
import { UserGroupIcon } from '@heroicons/react/24/outline'
import { MenuItem, AnimatedButton, colors, animatedButtonStyles, Section, tableButtonStyles, statusBadgeStyles, orderItemStyles, deleteButtonStyles, quantityButtonStyles } from '../styles/shared'; // <--- 1. IMPORT THIS

const statusColors = {
  preparing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-blue-100 text-blue-800',
  served: 'bg-green-100 text-green-800',
  'ready-to-serve': 'bg-blue-100 text-blue-800',
  'preparing-order': 'bg-yellow-100 text-yellow-800'
}

const statusLabels = {
  preparing: 'Preparing',
  ready: 'Ready to Serve',
  served: 'Served',
  'ready-to-serve': 'Ready to Serve',
  'preparing-order': 'Preparing Order'
}

// Helper to map MongoDB _id to the id your UI expects
const mapId = (data) => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(d => ({ ...d, id: d._id || d.id }));
  if (typeof data === 'object') return { ...data, id: data._id || data.id };
  return data;
};

export default function WaiterDashboard({ onExit, embedded = false, initialTableId = null }) {
  const { user, logout } = useAuth()
  const [tables, setTables] = useState([])
  const [menu, setMenu] = useState({})
  const [selectedTable, setSelectedTable] = useState(initialTableId)
  const [activeOrder, setActiveOrder] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [preview, setPreview] = useState(null)
  const [receipts, setReceipts] = useState([])
  const [settings, setSettings] = useState({ autoSubmitToChef: true })
  const [activeTab, setActiveTab] = useState('dine-in');

  const isUpdating = useRef(false);
  
  useEffect(() => {
    if (initialTableId) {
        setSelectedTable(initialTableId);
    }
  }, [initialTableId]);
  // --- 1. DATA FETCHING (Replaces store polling) ---
  const refreshData = useCallback(async () => {
    try {
      const [tableRes, menuRes, settingRes, receiptRes] = await Promise.all([
        fetch(`${API_URL}/api/tables`),
        fetch(`${API_URL}/api/menu`),
        fetch(`${API_URL}/api/settings`),
        fetch(`${API_URL}/api/receipts?status=closed`)
      ]);

      if (!tableRes.ok || !menuRes.ok) return;

      const tData = mapId(await tableRes.json());
      setTables(tData || []);

      if (selectedTable && tData && !tData.find(t => t.id === selectedTable)) {
         setSelectedTable(null);
      } else if (!selectedTable && tData && tData.length > 0) {
         setSelectedTable(tData[0].id);
      }

      const mData = await menuRes.json();
      const groupedMenu = (mData || []).reduce((acc, item) => {
        const uiItem = { ...item, id: item._id };
        const cat = item.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(uiItem);
        return acc;
      }, {});
      setMenu(groupedMenu);

      setSettings(await settingRes.json());
      const receiptsData = mapId(await receiptRes.json()) || [];
      // Sort receipts from latest to oldest (newest first)
      const sortedReceipts = receiptsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReceipts(sortedReceipts);

      // Fetch Active Order
      if (selectedTable) {
        const table = tData.find(t => t.id === selectedTable);
        if (table && table.activeOrderId) {
           const ordersRes = await fetch(`${API_URL}/api/orders?status=open`);
           if (ordersRes.ok) {
             const orders = mapId(await ordersRes.json());
             const order = orders.find(o => o.id === table.activeOrderId);
             
             // --- CHANGED: ONLY UPDATE IF NOT CURRENTLY MODIFYING ---
             if (!isUpdating.current) { 
               if(order && order.items) {
                 order.items = order.items.map(i => ({...i, id: i._id || i.id}));
                 setActiveOrder(order);
               } else {
                 setActiveOrder(null);
               }
             }
             // -------------------------------------------------------
           }
        } else {
           // Safe to clear if table has no order
           if (!isUpdating.current) setActiveOrder(null);
        }
      }
    } catch (err) { console.error("Sync error:", err); }
  }, [selectedTable]);

  useEffect(() => {
    refreshData();
    const iv = setInterval(refreshData, 2000); // ✅ Polls every 2s
    return () => clearInterval(iv);
  }, [refreshData]);

  const categories = useMemo(() => Object.keys(menu), [menu])

  // --- 2. ORDER LOGIC (Replaces store methods) ---

  const ensureOrder = async () => {
    if (!selectedTable) return null
    if (activeOrder) return activeOrder;

    try {
      const res = await fetch(`${API_URL}/api/orders/start`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ tableId: selectedTable })
      });
      
      if (!res.ok) {
        console.error("Failed to start order");
        return null;
      }

      const order = mapId(await res.json());
      // Initialize items array if backend didn't send it
      if (!order.items) order.items = [];
      
      setActiveOrder(order);
      return order;
    } catch(e) { console.error(e); return null; }
  }

  const [pendingItems, setPendingItems] = useState([])
  const autoSubmitToChef = settings.autoSubmitToChef !== false 

  // Helper to sync changes to backend
  const updateOrderBackend = async (orderId, newItems) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ items: newItems })
      });
      
      if (!res.ok) throw new Error("Update failed");

      const updated = mapId(await res.json());
      updated.items = updated.items.map(i => ({...i, id: i._id || i.id}));
      setActiveOrder(updated);
    } catch(e) {
      console.error(e);
      // Don't crash, just log
    }
  }

  const handleMenuItemClick = (item) => {
    if (autoSubmitToChef) {
      // Check if item already exists in active order with 'preparing' status
      if (activeOrder?.items) {
        const existingItem = activeOrder.items.find(i => 
          i.name === item.name && i.status === 'preparing'
        );
        
        if (existingItem) {
          // If exists, increase quantity
          changeQty(existingItem.itemId || existingItem.id, 1, 'preparing');
          return;
        }
      }
      // If not exists or no active order, add as new item
      addToOrder(item);
    } else {
      // For pending items (manual mode)
      setPendingItems(prev => {
        const existing = prev.find(i => i.name === item.name);
        if (existing) {
          return prev.map(i => 
            i.name === item.name ? { ...i, qty: i.qty + 1 } : i
          );
        }
        return [...prev, { ...item, qty: 1 }];
      });
    }
  }

  const addToOrder = async (item, status = 'preparing') => {
    // 1. Manual Mode (No change)
    if (!autoSubmitToChef) {
      setPendingItems(prev => {
        const existing = prev.find(i => i.id === item.id && i.status === status)
        if (existing) {
          return prev.map(i => i.id === item.id && i.status === status ? { ...i, qty: i.qty + 1 } : i)
        }
        return [...prev, { ...item, qty: 1, status }]
      })
      return;
    }

    // LOCK THE POLLER
    isUpdating.current = true;

    // 2. OPTIMISTIC UPDATE
    const prevActiveOrder = activeOrder ? JSON.parse(JSON.stringify(activeOrder)) : null;

    if (activeOrder && activeOrder.items) {
      const optimisticItems = [...activeOrder.items];
      // Try to find existing item to increment
      const existingIndex = optimisticItems.findIndex(i => (i.itemId === item.id || i.itemId === item._id) && i.status === status);

      if (existingIndex > -1) {
        optimisticItems[existingIndex] = {
            ...optimisticItems[existingIndex],
            qty: (optimisticItems[existingIndex].qty || 1) + 1
        };
      } else {
        optimisticItems.push({
            itemId: item.id || item._id, 
            id: item.id || item._id,
            name: item.name,
            price: item.price,
            qty: 1,
            status: status
        });
      }
      
      // Update Total Price Optimistically
      const newTotal = (activeOrder.total || 0) + item.price;
      
      setActiveOrder({
        ...activeOrder,
        items: optimisticItems,
        total: newTotal
      });
    }

    // 3. Network Sync
    try {
      const order = await ensureOrder();
      if (!order) {
        if (prevActiveOrder) setActiveOrder(prevActiveOrder); // Revert
        return;
      }

      let updatedItems = order.items ? [...order.items] : [];
      const existingIndex = updatedItems.findIndex(i => (i.itemId === item.id || i.itemId === item._id) && i.status === status);
      
      if (existingIndex > -1) {
        updatedItems[existingIndex].qty += 1;
      } else {
        updatedItems.push({
          itemId: item.id || item._id,
          name: item.name,
          price: item.price,
          qty: 1,
          status: status
        });
      }
      
      await updateOrderBackend(order.id, updatedItems);
    } catch (e) {
      console.error(e);
      if (prevActiveOrder) setActiveOrder(prevActiveOrder); // Revert
      refreshData();
    } finally {
      // RELEASE THE POLLER
      setTimeout(() => { isUpdating.current = false; }, 500);
    }
  }

  const submitPendingItems = async () => {
    if (pendingItems.length === 0) return
    
    // LOCK THE POLLER
    isUpdating.current = true;

    try {
        const order = await ensureOrder();
        if (!order) return;

        let updatedItems = order.items ? [...order.items] : [];
        
        pendingItems.forEach(pItem => {
            const idx = updatedItems.findIndex(i => (i.itemId === pItem.id || i.itemId === pItem._id) && i.status === pItem.status);
            if(idx > -1) {
                updatedItems[idx].qty += pItem.qty;
            } else {
                updatedItems.push({
                    itemId: pItem.id,
                    name: pItem.name,
                    price: pItem.price,
                    qty: pItem.qty,
                    status: pItem.status || 'preparing'
                });
            }
        });

        await updateOrderBackend(order.id, updatedItems);
        setPendingItems([])
    } catch(e) {
        console.error(e);
    } finally {
        setTimeout(() => { isUpdating.current = false; }, 500);
    }
  }

  const toggleItemServed = async (orderId, itemId, currentStatus) => {
    // LOCK THE POLLER
    isUpdating.current = true;

    try {
        const newStatus = currentStatus === 'served' ? 'ready' : 'served';
        
        // Optimistic UI Update
        if (activeOrder) {
             const updatedItems = activeOrder.items.map(i => {
                if(i.itemId === itemId || i.id === itemId) return { ...i, status: newStatus };
                return i;
            });
            setActiveOrder({ ...activeOrder, items: updatedItems });
        }

        const updatedItems = activeOrder.items.map(i => {
            if(i.itemId === itemId || i.id === itemId) return { ...i, status: newStatus };
            return i;
        });
        await updateOrderBackend(orderId, updatedItems);
    } catch(e) {
        console.error(e);
        refreshData();
    } finally {
        setTimeout(() => { isUpdating.current = false; }, 500);
    }
  }

  const changeQty = async (itemId, delta, itemStatus) => {
    if (!activeOrder || itemStatus === 'served') return;

    // LOCK THE POLLER
    isUpdating.current = true;

    // 1. Optimistic Update
    const prevOrderState = JSON.parse(JSON.stringify(activeOrder));
    
    // Calculate new items array
    const optimisticItems = activeOrder.items.map(item => {
      const isTargetItem = (item.itemId === itemId || item.id === itemId) && 
                         (itemStatus ? item.status === itemStatus : true);
      
      if (isTargetItem) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0);

    // Calculate optimistic total price change
    const targetItem = activeOrder.items.find(i => (i.itemId === itemId || i.id === itemId));
    const priceChange = targetItem ? targetItem.price * delta : 0;

    // Apply State
    setActiveOrder({ 
        ...activeOrder, 
        items: optimisticItems,
        total: (activeOrder.total || 0) + priceChange 
    });

    // 2. Network Request
    try {
        await updateOrderBackend(activeOrder.id, optimisticItems);
    } catch (e) {
        console.error("Qty update failed", e);
        setActiveOrder(prevOrderState); // Revert on failure
        refreshData();
    } finally {
        // RELEASE THE POLLER
        setTimeout(() => { isUpdating.current = false; }, 500);
    }
  }

  const removeItem = async (itemId) => {
    if (!activeOrder) return;
    
    // LOCK THE POLLER
    isUpdating.current = true;

    try {
        // Optimistic Update
        const optimisticItems = activeOrder.items.filter(i => i.itemId !== itemId && i.id !== itemId);
        setActiveOrder({ ...activeOrder, items: optimisticItems });

        const updatedItems = activeOrder.items.filter(i => 
          i.itemId !== itemId && i.id !== itemId
        );
        await updateOrderBackend(activeOrder.id, updatedItems);
    } catch(e) {
        console.error(e);
        refreshData();
    } finally {
        setTimeout(() => { isUpdating.current = false; }, 500);
    }
  }

  const closeOrder = async () => {
    if (!activeOrder) return
    const code = window.prompt('Enter coupon code (optional):', '')
    
    // Apply coupon logic first if needed
    if(code && code.trim()) {
        try {
            const cRes = await fetch(`${API_URL}/api/coupons`);
            const coupons = await cRes.json();
            const coupon = coupons.find(c => c.code === code.trim() && c.active);
            if(coupon) {
                const subtotal = activeOrder.items.reduce((s, i) => s + i.price * i.qty, 0);
                const discount = coupon.type === 'percent' ? subtotal * (coupon.value/100) : coupon.value;
                
                await fetch(`${API_URL}/api/orders/${activeOrder.id}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ couponCode: code, discount })
                });
            }
        } catch(e) { console.error(e); }
    }

    try {
        const res = await fetch(`${API_URL}/api/orders/${activeOrder.id}/close`, { method: 'POST' });
        if(!res.ok) throw new Error("Server error");
        const receipt = mapId(await res.json());
        alert(`Order closed. Receipt ${receipt.id}, total ₹${receipt.total.toFixed(2)}`)
        setActiveOrder(null)
        refreshData();
    } catch(e) { alert("Error closing order"); }
  }

  // NOTE: applyCoupon function from store.js isn't used in your UI render, 
  // but logic is handled inside closeOrder prompt above for simplicity.

  // --- YOUR EXACT UI (Untouched) ---
  // Add style tag for hover effects
  const hoverStyles = `
    .menu-item:hover {
      background: rgba(212, 167, 106, 0.15) !important;
      transform: scale(0.98) !important;
      box-shadow: '0 6px 32px -2px rgba(212, 167, 106, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(212, 167, 106, 0.1)' !important;
      border: '1px solid rgba(212, 167, 106, 0.3)' !important;
    }
    
    .menu-item:active {
      background: rgba(212, 167, 106, 0.2) !important;
      transform: scale(0.96) !important;
      border: '2px solid rgba(212, 167, 106, 0.5)' !important;
      outline: 'none' !important;
      box-shadow: '0 4px 20px -2px rgba(212, 167, 106, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(212, 167, 106, 0.15)' !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .menu-item:focus {
      outline: 'none' !important;
      border: '1px solid rgba(212, 167, 106, 0.3)' !important;
    }
    
    .menu-item:hover span,
    .menu-item:hover div {
      color: #3E2723 !important;
    }
    
    .menu-item:hover .text-primary {
      color: #D4A76A !important;
    }
    
    /* Current order button hover states */
    .order-item-btn:hover {
      background: rgba(212, 167, 106, 0.12) !important;
      border: '1px solid rgba(212, 167, 106, 0.3)' !important;
      color: #3E2723 !important;
      outline: none !important;
    }
    
    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.15) !important;
      border: '1px solid rgba(239, 68, 68, 0.3)' !important;
      color: #dc2626 !important;
      outline: none !important;
    }
    
    .status-btn:hover {
      background: rgba(34, 197, 94, 0.2) !important;
      border: '1px solid rgba(34, 197, 94, 0.4)' !important;
      color: #14532d !important;
      outline: none !important;
    }
    
    .status-btn.yellow:hover {
      background: rgba(250, 204, 21, 0.2) !important;
      border: '1px solid rgba(250, 204, 21, 0.4)' !important;
      color: #713f12 !important;
      outline: none !important;
    }
    
    .order-item-btn:focus,
    .delete-btn:focus,
    .status-btn:focus {
      outline: none !important;
      box-shadow: none !important;
    }
    
    /* Table button styles */
    .table-button {
      transition: all 0.2s ease-in-out;
      position: relative;
      overflow: hidden;
    }
    
    .table-button:hover {
      background: linear-gradient(135deg, rgba(245, 233, 221, 0.4) 0%, rgba(245, 233, 221, 0.2) 100%) !important;
      color: #5D4037 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212, 167, 106, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
      backdrop-filter: blur(6px) !important;
      WebkitBackdropFilter: blur(6px) !important;
      border-color: rgba(212, 167, 106, 0.2) !important;
    }
    
    .table-button:active {
      transform: translateY(1px) scale(0.97) !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08) !important;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
      background: linear-gradient(135deg, rgba(232, 216, 200, 0.3) 0%, rgba(232, 216, 200, 0.1) 100%) !important;
      backdrop-filter: blur(4px) !important;
      WebkitBackdropFilter: blur(4px) !important;
    }
    
    .table-button.bg-primary {
      background: linear-gradient(135deg, rgba(62, 39, 35, 0.95) 0%, rgba(62, 39, 35, 0.85) 100%) !important;
      color: white !important;
      border-color: #3E2723 !important;
    }
    
    .table-button.bg-primary:hover {
      background: linear-gradient(135deg, rgba(62, 39, 35, 0.9) 0%, rgba(62, 39, 35, 0.8) 100%) !important;
      box-shadow: 0 4px 12px rgba(62, 39, 35, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(6px) !important;
      WebkitBackdropFilter: blur(6px) !important;
      border-color: rgba(62, 39, 35, 0.9) !important;
    }
  `;

  return (
    <>
      <style>{animatedButtonStyles.hoverStyles}</style>
      <div className={`container mx-auto ${embedded ? 'px-0 py-0' : 'px-2 sm:px-4 py-4 sm:py-8'}`}>
      {/* Mobile Only - Welcome and Logout */}
      {!embedded && (
        <>
          <Section title="" className="md:hidden mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Welcome,</span>
                <span className="text-sm font-semibold text-primary">{user?.username}</span>
              </div>
              <AnimatedButton
                onClick={logout}
                color={colors.brown}
                hoverColor={colors.brownDark}
                padding="8px 20px"
                minWidth="100px"
                height="36px"
              >
                Logout
              </AnimatedButton>
            </div>
          </Section>

          <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left mb-6 md:mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Waiter Dashboard</h1>
              <p className="text-gray-600 md:mb-0">Manage your tables and orders efficiently</p>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Welcome,</span>
                <span className="text-sm font-semibold text-primary">{user?.username}</span>
              </div>
              
              <div className="w-px h-8 bg-gray-300"></div>
              
              <AnimatedButton
                onClick={logout}
                color={colors.brown}
                hoverColor={colors.brownDark}
                padding="8px 20px"
                minWidth="120px"
                height="40px"
              >
                Logout
              </AnimatedButton>
            </div>
          </div>
        </>
      )}

      {/* Tabs */}
      <div className="relative">
        <div className="flex overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:flex-wrap gap-3 mb-6 md:justify-start justify-start scrollbar-hide">
          {[
            { id: 'dine-in', label: 'Dine In' },
          ].map(t => {
            const isActive = activeTab === t.id;
            const buttonColor = isActive ? '#D4A76A' : '#D4A76A';
            const hoverColor = '#3E2723';
            
            return (
              <AnimatedButton
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                color={buttonColor}
                hoverColor={hoverColor}
                padding="12px 24px"
                minWidth="140px"
                margin="4px"
                className={`${isActive ? 'active' : ''}`}
                style={{
                  backgroundColor: isActive ? hoverColor : 'rgba(212, 167, 106, 0.15)',
                  color: isActive ? 'white' : buttonColor,
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  background: isActive 
                    ? hoverColor 
                    : 'linear-gradient(135deg, rgba(212, 167, 106, 0.25) 0%, rgba(212, 167, 106, 0.1) 100%)',
                  border: `1px solid rgba(212, 167, 106, 0.3)`,
                  boxShadow: `0 8px 32px rgba(212, 167, 106, 0.15), 0 0 0 2px ${buttonColor}`,
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {t.label}
              </AnimatedButton>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6" style={{ alignItems: 'start' }}>
        <Section title="Tables">
          <div className="flex flex-col" style={{ height: '100%' }}>
            <ul className="space-y-3 pr-6 py-2 pl-2 w-full" style={{ minHeight: 'auto', maxHeight: 'none' }}>
            {tables.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => setSelectedTable(t.id)}
                  className="w-full text-left border rounded p-2 transition-all table-button"
                  style={{
                    ...tableButtonStyles.base,
                    ...(selectedTable === t.id ? tableButtonStyles.active : {}),
                    ...(selectedTable === t.id && { ...tableButtonStyles.activeHover })
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${selectedTable === t.id ? 'text-white' : 'text-amber-900'}`} />
                      <span className="font-medium text-sm sm:text-base">{t.name}</span>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                      t.activeOrderId 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {t.activeOrderId ? 'Occupied' : 'Available'}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t pt-3 pb-1 flex flex-col" style={{ minHeight: '0' }}>
            <h4 className="font-semibold mb-3 flex-shrink-0">Receipts (table)</h4>
            <ul className="space-y-3 overflow-y-auto overflow-x-auto w-full pr-12 pl-1 text-sm" style={{ overflow: 'visible', overflowY: 'auto', overflowX: 'auto', padding: '8px', maxHeight: '200px' }}>
              {receipts.filter(r=>r.tableId===selectedTable).map(r => (
                <li key={r.id} className="flex justify-between items-center py-1">
                  <span className="flex-shrink-0">{new Date(r.createdAt).toLocaleTimeString()} • ₹{r.total.toFixed(2)}</span>
                  <button
                    className="view-button flex-shrink-0 mr-[10px]"
                    onClick={()=>setPreview(r)}
                    style={animatedButtonStyles.viewButton}
                  >
                    <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '14px', height: '14px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>
                    <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>View</span>
                    <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                    <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '14px', height: '14px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>
                  </button>
                </li>
              ))}
              {receipts.filter(r=>r.tableId===selectedTable).length===0 && (
                <li className="text-gray-500">No receipts yet.</li>
              )}
            </ul>
          </div>
          </div>
        </Section>

        <Section title="Menu" className="md:col-span-2">
          <div className="flex flex-col" style={{ height: '100%' }}>
            <div className="flex-shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(cat => (
              <div key={cat}>
                <h4 className="capitalize text-sm text-gray-500 mb-1">{cat}</h4>
                <div className="space-y-2">
                  {menu[cat].map(item => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      onClick={() => addToOrder(item)}
                      className="w-full text-left"
                    />
                  ))}
                </div>
              </div>
            ))}
              </div>
            </div>

          {/* Pending Items (Manual Mode) */}
          {!autoSubmitToChef && pendingItems.length > 0 && (
            <div className="mt-4 border border-amber-200 bg-amber-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-amber-800">Pending Items</h4>
                <button 
                  onClick={submitPendingItems}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-3 py-1 rounded"
                >
                  Save to Order ({pendingItems.reduce((sum, i) => sum + i.qty, 0)} items)
                </button>
              </div>
              <ul className="space-y-2 text-sm">
                {pendingItems.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>{item.name} x{item.qty}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-800">₹{(item.price * item.qty).toFixed(2)}</span>
                      <button 
                        onClick={() => setPendingItems(prev => 
                          prev.filter((_, i) => i !== idx)
                        )}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 border-t pt-3 flex flex-col" style={{ flex: 1, minHeight: 0 }}>
            <h4 className="font-semibold mb-2 flex-shrink-0">Current Order</h4>
            {!activeOrder && <div className="text-sm text-gray-500">Select a table and add items to start an order.</div>}
            {activeOrder && (!activeOrder.items || activeOrder.items.length === 0) && <div className="text-sm text-gray-500">NO ORDERS</div>}
            {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
              <>
                <div className="mb-3 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      {(() => {
                        const readyItems = activeOrder.items.filter(i => i.status === 'ready').length;
                        const servedItems = activeOrder.items.filter(i => i.status === 'served').length;
                        const totalItems = activeOrder.items.length;
                        
                        let statusText, statusClass;
                        
                        if (readyItems > 0) {
                          statusText = `${readyItems} Item${readyItems > 1 ? 's' : ''} Ready to Serve`;
                          statusClass = statusColors['ready-to-serve'];
                        } else if (servedItems === totalItems) {
                          statusText = 'Order Served';
                          statusClass = statusColors.served;
                        } else if (servedItems > 0) {
                          statusText = `${servedItems} of ${totalItems} Item${totalItems > 1 ? 's' : ''} Served`;
                          statusClass = statusColors.served;
                        } else {
                          statusText = 'Preparing Order';
                          statusClass = statusColors['preparing-order'];
                        }
                        
                        return (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusClass}`} style={{
                          backdropFilter: 'blur(15px) saturate(120%)',
                          WebkitBackdropFilter: 'blur(15px) saturate(120%)',
                          background: statusClass.includes('green') 
                            ? 'rgba(34, 197, 94, 0.08)'
                            : statusClass.includes('blue') 
                            ? 'rgba(59, 130, 246, 0.08)'
                            : 'rgba(212, 167, 106, 0.08)',
                          borderRadius: '6px',
                          border: statusClass.includes('green')
                            ? '1px solid rgba(34, 197, 94, 0.15)'
                            : statusClass.includes('blue')
                            ? '1px solid rgba(59, 130, 246, 0.15)'
                            : '1px solid rgba(212, 167, 106, 0.15)',
                          boxShadow: statusClass.includes('green')
                            ? '0 1px 3px rgba(34, 197, 94, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                            : statusClass.includes('yellow')
                            ? '0 1px 3px rgba(250, 204, 21, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                            : '0 1px 3px rgba(212, 167, 106, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.3s ease'
                        }}>
                            {statusText}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {activeOrder.items.filter(i => i.status === 'served').length} of {activeOrder.items.length} items served
                    </div>
                  </div>
                  {activeOrder.couponCode && !couponError && (
                    <div className="text-green-700">Applied {activeOrder.couponCode} (discount ₹{Number(activeOrder.discount||0).toFixed(2)})</div>
                  )}
                  {couponError && <div className="text-red-600">{couponError}</div>}
                </div>
                <div className="text-sm overflow-x-auto w-full" style={{
                    ...orderItemStyles.base,
                    padding: '16px'
                  }}>
                  {Object.entries(
                    activeOrder.items.reduce((acc, item) => {
                      const key = `${item.name}_${item.status}_${item.itemId || item.id}`;
                      if (!acc[key]) {
                        acc[key] = { ...item, qty: item.qty || 1, originalItems: [item] };
                      } else {
                        acc[key].qty += (item.qty || 1);
                        acc[key].originalItems.push(item);
                      }
                      return acc;
                    }, {})
                  ).map(([key, it], index) => (
                    <div key={key}>
                      <div className="flex items-center justify-between gap-2 min-w-max w-full">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {it.name} {it.originalItems.length > 1 ? `×${it.originalItems.reduce((sum, i) => sum + (i.qty || 1), 0)}` : ''}
                          </div>
                          <div className="text-xs text-gray-500 truncate">₹{it.price.toFixed(2)} each</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center">
                            <span className="text-xs px-2 py-1 rounded" style={statusBadgeStyles[it.status || 'preparing']}>
                            {statusLabels[it.status || 'preparing']}
                            </span>
                            {it.status === 'preparing' && (
                              <div 
                                onClick={() => removeItem(it.itemId || it.id)}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer ml-2 delete-btn"
                                style={deleteButtonStyles.base}
                                title="Remove item"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="white" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {(it.status === 'ready' || it.status === 'served') && (
                            <button
                              className={`px-2 py-1 text-sm rounded status-btn ${
                                it.status === 'ready' ? '' : 'yellow'
                              } ${
                                it.status === 'ready' 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              }`}
                              style={{
                                backdropFilter: 'blur(20px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                                background: it.status === 'ready' 
                                  ? 'rgba(34, 197, 94, 0.15)' 
                                  : 'rgba(250, 204, 21, 0.15)',
                                borderRadius: '8px',
                                border: it.status === 'ready' 
                                  ? '1px solid rgba(34, 197, 94, 0.3)' 
                                  : '1px solid rgba(250, 204, 21, 0.3)',
                                boxShadow: it.status === 'ready'
                                  ? '0 2px 6px rgba(34, 197, 94, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                                  : '0 2px 6px rgba(250, 204, 21, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
                                transition: 'all 0.3s ease'
                              }}
                              onClick={() => toggleItemServed(activeOrder.id, it.itemId || it.id, it.status || 'ready')}
                            >
                              {it.status === 'ready' ? 'Mark Served' : 'Mark Not Served'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {it.status === 'preparing' ? (
                            <>
                              <div 
                                onClick={() => changeQty(it.itemId || it.id, -1, it.status)}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer quantity-button"
                                disabled={it.qty <= 1}
                                style={{
                                  ...quantityButtonStyles.base,
                                  ...(it.qty <= 1 ? { pointerEvents: 'none' } : {})
                                }}
                              >
                                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>-</span>
                              </div>
                              <div className="w-12 text-center py-1">
                                ×{it.originalItems.reduce((sum, i) => sum + (i.qty || 1), 0)}
                              </div>
                              <div 
                                onClick={() => changeQty(it.itemId || it.id, 1, it.status)}
                                className="w-8 h-8 flex items-center justify-center cursor-pointer quantity-button"
                                style={quantityButtonStyles.base}
                              >
                                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-12 text-center py-1">
                              ×{it.qty}
                            </div>
                          )}
                        </div>
                        <div className="w-20 text-right font-semibold">₹{(it.price * it.originalItems.reduce((sum, i) => sum + (i.qty || 1), 0)).toFixed(2)}</div>
                      </div>
                      {index < Object.entries(
                        activeOrder.items.reduce((acc, item) => {
                          const key = `${item.name}_${item.status}_${item.itemId || item.id}`;
                          if (!acc[key]) {
                            acc[key] = { ...item, qty: item.qty || 1, originalItems: [item] };
                          } else {
                            acc[key].qty += (item.qty || 1);
                            acc[key].originalItems.push(item);
                          }
                          return acc;
                        }, {})
                      ).length - 1 && (
                        <div style={{
                          height: '1px',
                          background: 'rgba(212, 167, 106, 0.15)',
                          margin: '12px 0'
                        }} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-start mt-2">
                  <div className="w-40">
                    <button
                      onClick={closeOrder}
                      className="close-button group relative inline-flex items-center justify-center flex-shrink-0 mt-4"
                      style={animatedButtonStyles.closeButton}
                    >
                      Close & Generate Receipt
                    </button>
                  </div>
                  <div className="flex-1"></div>
                  <div className="text-right mt-4">
                    <div className="text-sm">Discount: ₹{Number(activeOrder.discount||0).toFixed(2)}</div>
                    <div className="font-semibold">Total: ₹{(activeOrder.total || 0).toFixed(2)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </Section>
      </div>
      <ReceiptModal 
        open={!!preview}
        onClose={()=>setPreview(null)}
        receipt={{...preview, ...settings}}
        canEdit={false} // Receipts viewed here are historical/read-only
      />
    </div>
    </>
  )
}