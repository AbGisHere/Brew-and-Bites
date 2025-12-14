import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const statusColors = {
  preparing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-blue-100 text-blue-800',
  served: 'bg-green-100 text-green-800'
};

const statusLabels = {
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served'
};

// Helper function to format time with seconds
const formatTime = (dateString) => {
  if (!dateString) return '--:--:--';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
};

// Helper: Generate a VALID 24-char Hex ObjectId for MongoDB
const generateObjectId = () => {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
};

export default function ChefDashboard({ onExit }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Input state for batch view inputs
  const [completedCounts, setCompletedCounts] = useState({});
  
  // Traffic Controller
  const isUpdating = useRef(false);

  // --- 1. LIVE BATCH CALCULATION (ZERO LATENCY) ---
  const batchItems = useMemo(() => {
    const itemsMap = new Map();
    
    // Filter active orders
    const activeOrdersList = orders.filter(order => 
      order.chefStatus !== 'completed' && 
      order.status !== 'completed' && 
      order.status !== 'closed'
    );

    activeOrdersList.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        const orderTime = new Date(order.createdAt || order.updatedAt || new Date());
        
        // Inline table name lookup
        const table = tables.find(t => t._id === order.tableId || t.id === order.tableId);
        const tableName = table ? table.name || `Table ${table.number || '?'}` : 'Unknown Table';
        
        order.items.forEach(item => {
          if (item.status !== 'served') { 
            const itemKey = item.name;
            const existing = itemsMap.get(itemKey) || {
              name: item.name,
              totalQuantity: 0,
              preparedQuantity: 0,
              pendingQuantity: 0,
              orders: [],
              notes: new Set()
            };
            
            // Handle quantity safely
            const itemQuantity = item.qty || item.quantity || 1;
            
            // Treat BOTH 'ready' AND 'prepared' as done
            const isPrepared = item.status === 'ready' || item.status === 'prepared';
            
            existing.totalQuantity += itemQuantity;
            if (isPrepared) {
              existing.preparedQuantity += itemQuantity;
            } else {
              existing.pendingQuantity += itemQuantity;
            }
            
            if (!isPrepared) {
              existing.orders.push({
                tableId: order.tableId,
                tableName: tableName,
                orderTime: orderTime,
                orderId: order._id,
                itemId: item._id || item.id,
                quantity: itemQuantity,
                status: item.status,
                notes: item.notes
              });
            }
            
            if (item.notes) existing.notes.add(item.notes);
            itemsMap.set(itemKey, existing);
          }
        });
      }
    });

    // Return sorted array
    return Array.from(itemsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(item => item.pendingQuantity > 0)
      .map(item => ({
        ...item,
        orders: item.orders
          .sort((a, b) => b.orderTime - a.orderTime)
          .map(order => ({
            ...order,
            timeString: order.orderTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })
          }))
      }));
  }, [orders, tables]);

  // --- 2. SORTED ORDERS ---
  const sortedActiveOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    
    return [...orders].sort((a, b) => {
      const getLatestPreparingTime = (order) => {
        if (!order || !order.items || !Array.isArray(order.items)) return 0;
        const preparingItems = order.items.filter(item => 
          item.status === 'preparing' || !item.status
        );
        if (preparingItems.length === 0) return 0;
        return Math.max(...preparingItems.map(item => new Date(item.createdAt || Date.now()).getTime()));
      };
      return getLatestPreparingTime(b) - getLatestPreparingTime(a);
    });
  }, [orders]);

  const sortedCompletedOrders = useMemo(() => {
    if (!completedOrders || !Array.isArray(completedOrders)) return [];
    return [...completedOrders].sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [completedOrders]);

  const currentOrders = useMemo(() => {
    return activeTab === 'active' ? sortedActiveOrders : 
           activeTab === 'completed' ? sortedCompletedOrders : [];
  }, [activeTab, sortedActiveOrders, sortedCompletedOrders]);

  const hasOrders = (activeTab === 'batch' && batchItems.length > 0) || 
                   (activeTab !== 'batch' && currentOrders.length > 0);

  // --- 3. DATA FETCHING ---
  const fetchData = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setIsLoading(true);
      setError(null);
      
      const [allOrdersRes, tableRes] = await Promise.all([
        fetch(`${API_URL}/api/orders`).then(res => res.json()),
        fetch(`${API_URL}/api/tables`).then(res => res.json())
      ]);
      
      const activeOrders = (allOrdersRes || []).filter(order => 
        order.chefStatus !== 'completed' && 
        order.status !== 'completed' && 
        order.status !== 'closed'
      );
      
      const completedOrdersList = (allOrdersRes || []).filter(order => 
        order.chefStatus === 'completed' || 
        order.status === 'completed' || 
        order.status === 'closed'
      );
      
      if (!isUpdating.current) {
        setOrders(activeOrders);
        setCompletedOrders(completedOrdersList);
        setTables(tableRes || []);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      if (!isBackgroundRefresh) {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // --- 4. ACTION HANDLERS ---
  
  // Helper: Get Table Name (Missing function fixed here)
  const getTableName = (id) => {
    if (!id) return 'Unknown Table';
    const table = tables.find(t => t._id === id || t.id === id);
    return table ? table.name || `Table ${table.number || '?'}` : 'Unknown Table';
  };

  // Helper: Generate a VALID 24-char Hex ObjectId
  const generateBatchId = () => {
    const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
  };

  const handleCompleteBatch = async (itemName, count) => {
    // Ensure count is a number
    let remainingCount = parseInt(count, 10);
    if (isNaN(remainingCount) || remainingCount <= 0) return;

    // 1. LOCK THE POLLER
    isUpdating.current = true;
    const previousOrders = JSON.parse(JSON.stringify(orders)); // Backup
    
    try {
      const updatesToSend = []; // Store updates to send to server later

      // 2. OPTIMISTIC UPDATE LOOP
      const nextOrders = orders.map(order => {
        // Skip if we are done or order has no items
        if (remainingCount <= 0 || !order.items) return order;

        // Check if this order contains the target item (not ready/served)
        const hasTarget = order.items.some(i => i.name === itemName && i.status !== 'ready' && i.status !== 'served');
        if (!hasTarget) return order;

        let orderModified = false;
        const newItemsList = [];

        // Iterate and Process Items
        for (const item of order.items) {
            // Check if this is the item we want to mark done
            if (remainingCount > 0 && item.name === itemName && 
                item.status !== 'ready' && item.status !== 'served') {
                
                if (item.qty > 1) {
                    // CASE A: Split needed
                    newItemsList.push({ ...item, qty: item.qty - 1 }); // Keep remaining
                    
                    newItemsList.push({
                       ...item,
                       _id: generateBatchId(), // New VALID Hex ID
                       qty: 1,
                       status: 'ready',
                       completedAt: new Date().toISOString()
                    });
                    remainingCount--;
                    orderModified = true;
                } else {
                    // CASE B: Exact match (Qty is 1)
                    newItemsList.push({
                        ...item,
                        status: 'ready',
                        completedAt: new Date().toISOString()
                    });
                    remainingCount--;
                    orderModified = true;
                }
            } else {
                // Keep other items unchanged
                newItemsList.push(item);
            }
        }

        if (orderModified) {
            const allReady = newItemsList.every(i => i.status === 'ready' || i.status === 'served');
            const newStatus = allReady ? 'ready' : 'preparing';
            
            // Queue this update for the server
            updatesToSend.push({
                orderId: order._id,
                items: newItemsList,
                status: newStatus
            });

            return {
                ...order,
                items: newItemsList,
                orderStatusChef: newStatus
            };
        }
        return order;
      });

      // 3. APPLY TO UI IMMEDIATELY
      setOrders(nextOrders);
      setCompletedCounts(prev => ({ ...prev, [itemName]: 0 })); // Reset input to 0

      // 4. SEND TO SERVER (Use the main PUT endpoint)
      await Promise.all(updatesToSend.map(update => 
          fetch(`${API_URL}/api/orders/${update.orderId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  items: update.items,
                  status: update.status
              })
          })
      ));
      
      // Refresh data to be sure
      fetchData();

    } catch (err) {
      console.error("Batch update error:", err);
      setOrders(previousOrders); // Revert on error
      alert("Failed to update batch. Reverting.");
    } finally {
      // 5. RELEASE LOCK
      setTimeout(() => { isUpdating.current = false; }, 500);
    }
  };

  const toggleItemStatus = async (orderId, itemUniqueId, currentStatus, markAsNotPrepared = false) => {
    // 1. LOCK THE POLLER
    isUpdating.current = true;

    // 2. Determine New Status
    let newStatus;
    if (markAsNotPrepared && currentStatus === 'ready') {
      newStatus = 'preparing';
    } else if (currentStatus === 'preparing') {
      newStatus = 'ready';
    } else {
      newStatus = currentStatus;
      isUpdating.current = false;
      return;
    }

    if (newStatus === currentStatus) {
        isUpdating.current = false;
        return;
    }

    // 3. OPTIMISTIC UPDATE
    const previousOrders = JSON.parse(JSON.stringify(orders)); // Deep copy for backup

    // Helper: Calculate status based on items
    const calculateOrderStatus = (items) => {
      const allReadyOrServed = items.every(i => i.status === 'ready' || i.status === 'served');
      return allReadyOrServed ? 'ready' : 'preparing';
    };

    // --- CORE LOGIC: CALCULATE NEW STATE ONCE ---
    let payloadItems = [];
    let payloadStatus = 'preparing';
    
    const nextOrders = orders.map(order => {
      if (order._id !== orderId) return order;

      // Deep copy items
      let updatedItems = JSON.parse(JSON.stringify(order.items));
      const [targetItemId, _] = itemUniqueId.split('-');
      
      // Find the item
      const itemIndex = updatedItems.findIndex(i => (i._id || i.id) === targetItemId && i.status === currentStatus);
      
      if (itemIndex > -1) {
        const item = updatedItems[itemIndex];
        
        if (item.qty > 1) {
          // CASE A: SPLIT ITEM (Qty > 1)
          item.qty -= 1; // Decrease original
          
          const splitItem = {
            ...item,
            _id: generateObjectId(), // GENERATE VALID 24-CHAR ID
            qty: 1,
            status: newStatus,
            completedAt: newStatus === 'ready' ? new Date().toISOString() : null,
            createdAt: item.createdAt 
          };
          updatedItems.push(splitItem);
        } else {
          // CASE B: UPDATE DIRECTLY (Qty = 1)
          updatedItems[itemIndex].status = newStatus;
          updatedItems[itemIndex].completedAt = newStatus === 'ready' ? new Date().toISOString() : null;
        }
      }

      // Capture these for the server payload
      payloadItems = updatedItems;
      payloadStatus = calculateOrderStatus(updatedItems);

      return {
        ...order,
        items: updatedItems,
        orderStatusChef: payloadStatus
      };
    });

    // Apply Update to UI
    setOrders(nextOrders);

    // 4. Send Request to Server
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          status: payloadStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update status');
    } catch (err) {
      console.error('Error updating item status:', err);
      setOrders(previousOrders); // Revert on failure
      alert("Sync failed. Reverting changes.");
    } finally {
      // 5. RELEASE THE LOCK
      setTimeout(() => { isUpdating.current = false; }, 500);
    }
  };

  const handleLogout = () => {
    logout();
    if (onExit) onExit();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="font-medium">Error</h3>
          </div>
          <p className="mt-2 text-sm">{error}</p>
          <button
            onClick={() => fetchData(false)}
            className="mt-3 px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Chef Dashboard</h1>
          <p className="text-gray-600 mb-6">Manage your kitchen orders efficiently</p>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Welcome,</span>
            <span className="text-sm font-semibold text-primary">{user?.username}</span>
          </div>
          
          <div className="w-px h-8 bg-gray-300"></div>
          
          <button
            className="animated-button group relative inline-flex items-center justify-center"
            onClick={handleLogout}
            style={{
              '--color': '#8B5A2B',
              '--hover-color': '#5D4037',
              padding: '8px 20px',
              fontSize: '14px',
              minWidth: '120px',
              height: '40px',
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
            <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#8B5A2B', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              <path d="M16 17l5-5-5-5M19.8 12H4M14 7l-3.2 2.4c-.5.4-.8.9-.8 1.6v5c0 .7.3 1.2.8 1.6L14 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              Logout
            </span>
            <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#8B5A2B', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
            <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#8B5A2B', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
              <path d="M8 7l5-5 5 5M13 21V4M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <style jsx>{`
              .animated-button:hover { 
                box-shadow: 0 0 0 8px transparent !important; 
                color: white !important; 
                border-radius: 12px !important; 
              }
              .animated-button:hover .arr-1 { 
                right: -25% !important; 
              }
              .animated-button:hover .arr-2 { 
                left: 16px !important; 
              }
              .animated-button:hover .text { 
                transform: translateX(12px) !important;
                color: white !important;
              }
              .animated-button:active { 
                transform: scale(0.95) !important; 
                box-shadow: 0 0 0 4px #8B5A2B !important; 
              }
              .animated-button:hover .circle { 
                width: 200px !important; 
                height: 200px !important; 
                opacity: 1 !important; 
                background-color: #3E2723 !important; 
              }
              .animated-button:hover {
                background-color: #3E2723 !important;
                color: white !important;
              }
              .animated-button:hover svg, 
              .animated-button:hover .arrow-svg { 
                fill: white !important; 
                color: white !important;
              }
            `}</style>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { id: 'batch', label: 'Batch View', count: batchItems.length },
          { id: 'active', label: 'Active Orders', count: orders.length },
          { id: 'completed', label: 'Order History', count: completedOrders.length },
        ].map(t => {
          const isActive = activeTab === t.id;
          const buttonColor = isActive ? '#D4A76A' : '#D4A76A';
          const hoverColor = '#3E2723';
          
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`animated-button group relative inline-flex items-center justify-center ${
                isActive ? 'active' : ''
              } hover:text-white hover:[&_svg]:fill-white`}
              style={{
                '--color': buttonColor,
                '--hover-color': hoverColor,
                '--box-shadow': `0 0 0 2px ${buttonColor}`,
                '--active-box-shadow': `0 0 0 4px ${buttonColor}`,
                padding: '12px 24px',
                minWidth: '180px',
                margin: '4px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '2px solid',
                borderColor: 'transparent',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: 'transparent',
                borderRadius: '100px',
                color: buttonColor,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                boxShadow: `0 0 0 2px ${buttonColor}`
              }}
            >
              <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '20px', height: '20px', left: '-25%', fill: buttonColor, zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)', display: 'flex', alignItems: 'center' }}>
                {t.icon}
                {t.label}
                {t.count > 0 && (
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {t.count}
                  </span>
                )}
              </span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: buttonColor, borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '20px', height: '20px', right: '16px', fill: buttonColor, zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <style jsx>{`
                .animated-button:hover .arr-1,
                .animated-button:hover .arr-2 {
                  fill: white !important;
                }
                .animated-button:hover { 
                  box-shadow: 0 0 0 12px transparent !important; 
                  color: ${hoverColor} !important; 
                  border-radius: 12px !important; 
                }
                .animated-button:hover .arr-1 { 
                  right: -25% !important; 
                }
                .animated-button:hover .arr-2 { 
                  left: 16px !important; 
                }
                .animated-button:hover .text { 
                  transform: translateX(12px) !important; 
                }
                .animated-button:hover svg { 
                  fill: ${hoverColor} !important; 
                }
                .animated-button:active { 
                  transform: scale(0.95) !important; 
                  box-shadow: 0 0 0 4px ${buttonColor} !important; 
                }
                .animated-button:hover .circle { 
                  width: 220px !important; 
                  height: 220px !important; 
                  opacity: 1 !important; 
                }
                .active { 
                  box-shadow: 0 0 0 4px ${buttonColor} !important; 
                  background-color: ${hoverColor} !important; 
                  color: white !important; 
                }
                .active svg { 
                  fill: white !important; 
                }
              `}</style>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {activeTab === 'batch' ? 'Batch View - Items to Prepare' : 
             activeTab === 'active' ? 'Active Orders' : 'Order History'}
          </h3>
          <div className="flex items-center">
            <button
              onClick={() => fetchData(false)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {activeTab === 'batch' ? (
          <div className="divide-y divide-gray-200">
            {batchItems.length > 0 ? (
              <div className="overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-4">Mark Complete</div>
                </div>
                <div className="bg-white divide-y divide-gray-200">
                  {batchItems.map((item, index) => (
                    <div key={index} className="px-4 py-3 grid grid-cols-12 gap-4 hover:bg-gray-50">
                      <div className="col-span-6">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                      </div>
                      <div className="col-span-2 text-center text-gray-900 font-medium">
                        {item.pendingQuantity}
                      </div>
                      <div className="col-span-4 flex items-center">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={item.pendingQuantity}
                            value={completedCounts[item.name] || 0}
                            onChange={(e) => {
                              const value = Math.min(Math.max(0, parseInt(e.target.value) || 0), item.pendingQuantity);
                              setCompletedCounts(prev => ({
                                ...prev,
                                [item.name]: value
                              }));
                            }}
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-center mr-2"
                          />
                          <button
                            onClick={() => handleCompleteBatch(item.name, completedCounts[item.name] || 0)}
                            disabled={!completedCounts[item.name] || completedCounts[item.name] <= 0}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items to prepare</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All caught up! No items need preparation at the moment.
                </p>
              </div>
            )}
          </div>
        ) : !hasOrders ? (
          <div className="px-4 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'active' 
                ? 'No active orders at the moment.' 
                : 'No completed orders yet.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {currentOrders.map((order) => (
              <li key={order._id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-primary-600 truncate">
                            Table: {getTableName(order.tableId)}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center flex-wrap gap-2">
                            <span className="flex items-center">
                              <span className="mr-1">⌛</span>Order: {formatTime(order.createdAt)}
                            </span>
                            {order.completedAt && (
                              <span className="flex items-center text-green-600 font-medium">
                                <span className="mr-1">✅</span>Completed: {formatTime(order.completedAt)}
                              </span>
                            )}
                          </p>
                        </div>
                        {activeTab === 'completed' && order.updatedAt && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {new Date(order.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Order ID: {order._id.substring(0, 8)}...
                      </p>
                    </div>
                    {activeTab === 'active' && (
                      <div className="ml-2 flex-shrink-0">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.orderStatusChef?.includes('served')
                              ? 'bg-green-100 text-green-800'
                              : order.orderStatusChef?.includes('prepared')
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.orderStatusChef || 'Checking status...'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                    <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {(() => {
                        // Group items by name
                        const itemsByName = {};
                        // Safety check: Ensure items exists
                        if (order.items && Array.isArray(order.items)) {
                          order.items.forEach(item => {
                            if (!itemsByName[item.name]) {
                              itemsByName[item.name] = [];
                            }
                            itemsByName[item.name].push(item);
                          });
                        }

                        return Object.entries(itemsByName).flatMap(([name, items]) => {
                          // Flatten the items array to handle quantities
                          const expandedItems = [];
                          items.forEach(item => {
                            const qty = item.qty || 1;
                            for (let i = 0; i < qty; i++) {
                              expandedItems.push({
                                ...item,
                                // Add a unique key for each instance
                                uniqueId: `${item._id || item.id}-${i}`,
                                // For the first item, keep the original timestamp
                                // For subsequent items, add a small delay to make timestamps unique
                                orderedAt: new Date(new Date(item.createdAt || Date.now()).getTime() + (i * 1000)).toISOString()
                              });
                            }
                          });

                          // Group by status for display
                          const preparingItems = expandedItems.filter(i => !i.status || i.status === 'preparing');
                          const readyItems = expandedItems.filter(i => i.status === 'ready');
                          const servedItems = expandedItems.filter(i => i.status === 'served');

                          return (
                            <div key={name} className="p-3 border-b">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{name} x {expandedItems.length}</p>
                                  <div className="mt-1 text-xs text-gray-500 space-y-2">
                                    {/* Preparing Items */}
                                    {preparingItems.length > 0 && (
                                      <div>
                                        <div className="font-medium text-yellow-700 mb-1">Preparing ({preparingItems.length}):</div>
                                        <div className="flex flex-wrap gap-2">
                                          {preparingItems.map((item, idx) => (
                                            <span key={item.uniqueId} className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded border border-yellow-100">
                                              ⌛ {formatTime(item.orderedAt)}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Ready Items */}
                                    {readyItems.length > 0 && (
                                      <div>
                                        <div className="font-medium text-blue-700 mb-1">Ready ({readyItems.length}):</div>
                                        <div className="flex flex-wrap gap-2">
                                          {readyItems.map((item, idx) => (
                                            <span key={item.uniqueId} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                              ⏳ {formatTime(item.completedAt || item.updatedAt)}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Served/Completed Items */}
                                    {servedItems.length > 0 && (
                                      <div>
                                        <div className="font-medium text-green-700 mb-1">Served ({servedItems.length}):</div>
                                        <div className="flex flex-wrap gap-2">
                                          {servedItems.map((item, idx) => (
                                            <span key={item.uniqueId} className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                                              ✅ {formatTime(item.completedAt)}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span 
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      items.every(i => i.status === 'served') 
                                        ? statusColors.served 
                                        : items.some(i => i.status === 'ready') 
                                          ? statusColors.ready 
                                          : statusColors.preparing
                                    }`}
                                  >
                                    {items.every(i => i.status === 'served') 
                                      ? statusLabels.served 
                                      : items.some(i => i.status === 'ready') 
                                        ? statusLabels.ready 
                                        : statusLabels.preparing}
                                  </span>
                                  {activeTab === 'active' && (
                                    <div className="flex flex-col space-y-2">
                                      {expandedItems.map((item, index) => {
                                        // Create a unique identifier for each item instance
                                        const itemUniqueId = `${item._id || item.id}-${index}`;
                                        return (
                                          <div key={itemUniqueId} className="mt-1">
                                            {item.status === 'preparing' || !item.status ? (
                                              <button
                                                onClick={() => toggleItemStatus(order._id, itemUniqueId, 'preparing')}
                                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                              >
                                                Mark as Ready
                                              </button>
                                            ) : item.status === 'ready' && (
                                              <button
                                                onClick={() => toggleItemStatus(order._id, itemUniqueId, 'ready', true)}
                                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                                              >
                                                Mark as Not Prepared
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {activeTab === 'active' ? (
                        <>
                          <span className="font-medium text-gray-700">
                            {/* Safety check for items */}
                            {(order.items || []).filter(i => i.status === 'ready' || i.status === 'served').length}
                          </span>{' '}
                          of {(order.items || []).length} items ready
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-gray-700">
                            {(order.items || []).filter(i => i.status === 'served').length}
                          </span>{' '}
                          of {(order.items || []).length} items served
                        </>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      Total: ₹{(order.items || []).reduce((sum, item) => sum + (item.price * item.qty || 0), 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}