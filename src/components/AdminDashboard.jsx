import { useEffect, useMemo, useState, useCallback } from 'react'
// REMOVED: import { store } from '../store' 
import { useAuth } from '../context/AuthContext'
import ReceiptModal from './ReceiptModal'
import WaiterDashboard from './WaiterDashboard'
import { FiStar } from 'react-icons/fi'
import API_URL from '../config'; // <--- 1. IMPORT THIS

// --- HELPER: Convert backend data to your UI format ---
const processMenuData = (items) => {
  return items.reduce((acc, item) => {
    // Map MongoDB _id to the 'id' your UI expects
    const uiItem = { ...item, id: item._id };
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(uiItem);
    return acc;
  }, {});
};

function Section({ title, children, className = '' }) {
  return (
    <section className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {children}
    </section>
  )
}

function FeaturedDishesManager() {
  const [menu, setMenu] = useState({})
  const [activeCategory, setActiveCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Fetch Menu Data
  const loadMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu`);
      const data = await res.json();
      const grouped = processMenuData(data);
      setMenu(grouped);
      // Set initial category if needed
      if (!activeCategory && Object.keys(grouped).length > 0) {
        setActiveCategory(Object.keys(grouped)[0]);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadMenu(); }, []);

  // 2. Toggle Featured (API Update)
  const toggleFeatured = async (category, itemId) => {
    try {
      // Find the item to get current status
      const item = menu[category].find(i => i.id === itemId);
      if(!item) return;

      await fetch(`${API_URL}/api/menu/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !item.featured })
      });
      loadMenu(); // Refresh UI
    } catch (err) { console.error(err); }
  }

  const filteredItems = useMemo(() => {
    if (!searchTerm) return menu[activeCategory] || []
    return (menu[activeCategory] || []).filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [menu, activeCategory, searchTerm])

  const featuredCount = useMemo(() => {
    return Object.values(menu).flat().filter(item => item.featured !== false).length
  }, [menu])

  // --- YOUR EXACT UI ---
  return (
    <div className="space-y-6">
      <Section title={
        <div className="flex justify-between items-center">
          <span>Featured Dishes</span>
          <span className="text-sm font-normal bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            {featuredCount} {featuredCount === 1 ? 'item' : 'items'} featured
          </span>
        </div>
      }>
        <p className="text-gray-600 mb-4">
          Select which dishes appear on the homepage. Toggle the star to feature/unfeature items.
        </p>
        
        {/* Search and filter */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search dishes..."
              className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          {Object.keys(menu).map(category => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category)
                setSearchTerm('') 
              }}
              className={`animated-button tab ${activeCategory === category ? 'active' : ''}`}
              style={{
                '--ab-color': activeCategory === category ? '#3b82f6' : '#9CA3AF',
                '--ab-hover': '#1e40af'
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
              <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                {(menu[category] || []).filter(i => i.featured !== false).length}
              </span>
            </button>
          ))}
        </div>

        {/* Dishes list */}
        <div className="space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  item.featured !== false ? 'border-yellow-200 bg-yellow-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{item.name}</div>
                    {item.featured !== false && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{item.description}</div>
                  <div className="text-sm font-semibold text-primary">₹{parseFloat(item.price).toFixed(2)}</div>
                </div>
                <button
                  onClick={() => toggleFeatured(activeCategory, item.id)}
                  className={`animated-button waiter ${item.featured !== false ? 'active' : ''}`}
                  style={{
                    '--ab-color': item.featured !== false ? '#f59e0b' : '#D1D5DB',
                    '--ab-hover': '#1e40af',
                    '--ab-text': item.featured !== false ? '#1e40af' : '#4B5563'
                  }}
                  title={item.featured !== false ? 'Remove from featured' : 'Add to featured'}
                >
                  <FiStar 
                    className={`w-5 h-5 ${item.featured !== false ? 'fill-current' : ''}`} 
                  />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">
                {searchTerm ? 'No matching dishes found. Try a different search term.' : 'No items in this category.'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="animated-button text-sm"
                  style={{
                    '--ab-color': '#3b82f6',
                    '--ab-hover': '#1e40af',
                    padding: '4px 12px',
                    fontSize: '14px',
                    boxShadow: '0 0 0 1px #3b82f6'
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}

function CouponManager() {
  const [coupons, setCoupons] = useState([])
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, active: true })

  // 1. Fetch Coupons
  const loadCoupons = async () => {
    const res = await fetch(`${API_URL}/api/coupons`);
    setCoupons(await res.json());
  };

  useEffect(() => { loadCoupons(); }, []);

  // 2. Create Coupon
  const create = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${API_URL}/api/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      loadCoupons();
      setForm({ code: '', type: form.type, value: 10, active: true })
    } catch (e) { alert("Error creating coupon"); }
  }

  // 3. Delete Coupon
  const del = async (code) => {
    if(!confirm("Delete coupon?")) return;
    await fetch(`${API_URL}/api/coupons/${code}`, { method: 'DELETE' });
    loadCoupons();
  }

  // --- YOUR EXACT UI ---
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={create} className="space-y-3">
        <div>
          <label className="text-sm">Code</label>
          <input className="w-full border rounded px-3 py-2" value={form.code} onChange={e=>setForm(f=>({...f, code: e.target.value}))} placeholder="WELCOME10" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Type</label>
            <select className="w-full border rounded px-3 py-2" value={form.type} onChange={e=>setForm(f=>({...f, type: e.target.value}))}>
              <option value="percent">Percent %</option>
              <option value="flat">Flat ₹</option>
            </select>
          </div>
          <div>
            <label className="text-sm">Value</label>
            <input type="number" step="0.01" className="w-full border rounded px-3 py-2" value={form.value} onChange={e=>setForm(f=>({...f, value: e.target.value}))} required />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f, active: e.target.checked}))} /> Active
        </label>
        <button 
          type="submit"
          className="animated-button"
          style={{
            '--ab-color': '#D4A76A',
            '--ab-hover': '#3E2723',
            padding: '8px 24px',
            fontSize: '14px',
            minWidth: '160px',
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: '2px solid',
            borderColor: 'transparent',
            fontWeight: '500',
            backgroundColor: 'transparent',
            borderRadius: '100px',
            color: '#D4A76A',
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
            boxShadow: '0 0 0 2px #D4A76A',
            height: '40px',
            marginTop: '16px'
          }}
        >
          <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
            Create Coupon
          </span>
          <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
          <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
          </svg>
          <style jsx>{`
            button:hover { box-shadow: 0 0 0 5px transparent !important; color: #3E2723 !important; border-radius: 8px !important; background-color: #F5F0E8 !important; }
            button:hover .arr-1 { right: -25% !important; }
            button:hover .arr-2 { left: 12px !important; }
            button:hover .text { transform: translateX(0) !important; }
            button:active .circle { opacity: 1; width: 200%; height: 500%; }
          `}</style>
        </button>
      </form>

      <div>
        <h4 className="font-semibold mb-2">Existing Coupons</h4>
        <ul className="space-y-2 text-sm">
          {coupons.length===0 && <li className="text-gray-500">No coupons yet.</li>}
          {coupons.map(c => (
            <li key={c.code} className="border rounded p-2 flex justify-between items-center">
              <div>
                <div className="font-medium">{c.code}</div>
                <div className="text-xs text-gray-500">{c.type === 'percent' ? `${c.value}% off` : `₹${Number(c.value).toFixed(2)} off`} • {c.active ? 'Active' : 'Inactive'}</div>
              </div>
              <button 
                className="animated-button" 
                onClick={()=>del(c.code)}
                style={{
                  '--ab-color': '#EF4444',
                  '--ab-hover': '#B91C1C',
                  padding: '4px 12px',
                  fontSize: '14px',
                  boxShadow: '0 0 0 1px #EF4444'
                }}
              >
                <span className="text">Delete</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SettingsPanel({ onBack }) {
  const [settings, setSettings] = useState({ autoSubmitToChef: true })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  // 1. Fetch Settings
  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(setSettings)
      .catch(err => console.error(err));
  }, []);

  // 2. Save Settings
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveStatus('Saving...')
      
      await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      setSaveStatus('Settings saved successfully!')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (error) {
      setSaveStatus('Failed to save settings')
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAutoSubmit = (e) => {
    const newSettings = { ...settings, autoSubmitToChef: e.target.checked }
    setSettings(newSettings)
  }

  // --- YOUR EXACT UI ---
  return (
    <div className="space-y-6">
      <Section title="Application Settings">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">Order Submission</h4>
              <p className="text-sm text-gray-600">
                {settings.autoSubmitToChef 
                  ? 'Orders are automatically sent to the kitchen when items are added.'
                  : 'Orders require manual submission to the kitchen.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.autoSubmitToChef}
                onChange={handleToggleAutoSubmit}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {settings.autoSubmitToChef ? 'Auto-Submit' : 'Manual Submit'}
              </span>
            </label>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-end gap-3 items-center">
              {saveStatus && (
                <span className={`text-sm ${saveStatus.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {saveStatus}
                </span>
              )}
              <button
                onClick={onBack}
                className="animated-button group relative inline-flex items-center justify-center"
                style={{
                  '--color': '#9CA3AF',
                  '--hover-color': '#4B5563',
                  padding: '8px 24px',
                  fontSize: '14px',
                  minWidth: '120px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: '2px solid',
                  borderColor: 'transparent',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  borderRadius: '100px',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                  boxShadow: '0 0 0 2px #9CA3AF'
                }}
                disabled={isSaving}
              >
                <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#9CA3AF', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  Cancel
                </span>
                <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#9CA3AF', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#9CA3AF', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
              </button>
              <button
                onClick={handleSave}
                className="animated-button group relative inline-flex items-center justify-center"
                style={{
                  '--color': '#D4A76A',
                  '--hover-color': '#3E2723',
                  padding: '8px 24px',
                  fontSize: '14px',
                  minWidth: '140px',
                  position: 'relative',
                  display: 'flex',
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
                disabled={isSaving}
              >
                <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </span>
                <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <style jsx>{`
                  .animated-button:hover:not(:disabled) { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
                  .animated-button:hover:not(:disabled) .arr-1 { right: -25% !important; }
                  .animated-button:hover:not(:disabled) .arr-2 { left: 16px !important; }
                  .animated-button:hover:not(:disabled) .text { transform: translateX(12px) !important; }
                  .animated-button:hover:not(:disabled) svg { fill: white !important; }
                  .animated-button:active:not(:disabled) { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                  .animated-button:hover:not(:disabled) .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
                `}</style>
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

export default function AdminDashboard({ onExit }) {
  const { user, logout } = useAuth()
  const [menu, setMenu] = useState({})
  const [tab, setTab] = useState('menu')
  const [tables, setTables] = useState([])
  const [receipts, setReceipts] = useState([])
  const [users, setUsers] = useState([])
  const [salesTotal, setSalesTotal] = useState(0)
  const [preview, setPreview] = useState(null)
  
  // New state for Site Status (requires a new endpoint if you want to persist it)
  const [siteClosed, setSiteClosed] = useState(false);

  // 1. DATA LOADING (Replaces store.getState())
  const loadAllData = useCallback(async () => {
    try {
      // 2. USE API_URL
      const [menuRes, tableRes, receiptRes, userRes, settingRes] = await Promise.all([
         fetch(`${API_URL}/api/menu`),
         fetch(`${API_URL}/api/tables`),
         fetch(`${API_URL}/api/receipts`),
         fetch(`${API_URL}/api/users`),
         fetch(`${API_URL}/api/settings`)
      ]);

      const menuData = await menuRes.json();
      setMenu(processMenuData(menuData)); // Helper to group categories
      setTables(await tableRes.json());
      
      const rData = await receiptRes.json();
      setReceipts(rData);
      setSalesTotal(rData.reduce((sum, r) => sum + r.total, 0));

      setUsers(await userRes.json());
      
      const sData = await settingRes.json();
      setSiteClosed(sData.siteClosed || false);

    } catch (err) { console.error("Load error:", err); }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData])

  const categories = useMemo(() => Object.keys(menu), [menu])

  const [form, setForm] = useState({ id: null, category: 'coffee', name: '', description: '', price: '' })
  const [isEditing, setIsEditing] = useState(false)
  
  // 2. ADD ITEM (API)
  const addItem = async (e) => {
    e.preventDefault()
    const price = parseFloat(form.price)
    if (!form.name || isNaN(price)) return
    
    const payload = { 
      category: form.category,
      name: form.name, 
      description: form.description, 
      price 
    }

    try {
       // If Editing, we PUT. If Adding, we POST.
       if (isEditing) {
         await fetch(`${API_URL}/api/menu/${form.id}`, {
           method: 'PUT',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify(payload)
         });
       } else {
         await fetch(`${API_URL}/api/menu`, {
           method: 'POST',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify(payload)
         });
       }
       loadAllData();
       resetForm();
    } catch(err) { console.error(err); }
  }
  
  const editItem = (category, item) => {
    setForm({
      id: item.id, // Using the _id mapped to id
      category,
      name: item.name,
      description: item.description || '',
      price: item.price
    })
    setIsEditing(true)
  }
  
  const resetForm = () => {
    setForm({ id: null, category: form.category, name: '', description: '', price: '' })
    setIsEditing(false)
  }

  // 3. DELETE ITEM (API)
  const deleteItem = async (cat, id) => {
    if(!confirm("Delete item?")) return;
    await fetch(`${API_URL}/api/menu/${id}`, { method: 'DELETE' });
    loadAllData();
  }

  // 4. ADD TABLE (API)
  const addTable = async () => {
    const name = prompt('Table name')
    if (!name) return
    await fetch(`${API_URL}/api/tables`, {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ name })
    });
    loadAllData();
  }

  // 5. DELETE TABLE (API)
  const deleteTable = async (id) => {
      try {
        await fetch(`${API_URL}/api/tables/${id}`, { method: 'DELETE' });
        loadAllData();
      } catch(e) { alert(e.message) }
  }

  // 6. ADD USER (API)
  const addWaiter = async () => {
    const username = prompt('Waiter username')
    const password = prompt('Waiter password')
    if (!username || !password) return
    try {
      await fetch(`${API_URL}/api/users`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ username, password, role: 'waiter' })
      });
      alert('Waiter added');
      loadAllData();
    } catch (e) { alert(e.message) }
  }

  const addChef = async () => {
    const username = prompt('Chef username')
    const password = prompt('Chef password')
    if (!username || !password) return
    try {
      await fetch(`${API_URL}/api/users`, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({ username, password, role: 'chef' })
      });
      alert('Chef added');
      loadAllData();
    } catch (e) { alert(e.message) }
  }

  // 7. DELETE USER (API)
  const deleteUser = async (id) => {
    if (confirm('Delete user?')) { 
        await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
        loadAllData();
    }
  }

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.username}</span>
          <button className="px-3 py-1 border rounded" onClick={onExit}>Exit</button>
          <button className="px-3 py-1 bg-gray-900 text-white rounded" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {[
          { id: 'menu', label: 'Menu' },
          { id: 'receipts', label: 'Receipts' },
          { id: 'tables', label: 'Tables' },
          { id: 'sales', label: 'Sales' },
          { id: 'users', label: 'Users' },
          { id: 'coupons', label: 'Coupons' },
          { id: 'settings', label: 'Settings' },
        ].map(t => {
          const isActive = tab === t.id;
          const buttonColor = isActive ? '#D4A76A' : '#D4A76A';
          const hoverColor = '#3E2723';
          
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`animated-button group relative inline-flex items-center justify-center ${
                isActive ? 'active' : ''
              }`}
              style={{
                '--color': buttonColor,
                '--hover-color': hoverColor,
                '--box-shadow': `0 0 0 2px ${buttonColor}`,
                '--active-box-shadow': `0 0 0 4px ${buttonColor}`,
                padding: '12px 24px',
                minWidth: '120px',
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
              <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                {t.label}
              </span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: buttonColor, borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '20px', height: '20px', right: '16px', fill: buttonColor, zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <style jsx>{`
                .animated-button:hover { box-shadow: 0 0 0 12px transparent !important; color: ${hoverColor} !important; border-radius: 12px !important; }
                .animated-button:hover .arr-1 { right: -25% !important; }
                .animated-button:hover .arr-2 { left: 16px !important; }
                .animated-button:hover .text { transform: translateX(12px) !important; }
                .animated-button:hover svg { fill: ${hoverColor} !important; }
                .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px ${buttonColor} !important; }
                .animated-button:hover .circle { width: 220px !important; height: 220px !important; opacity: 1 !important; }
                .active { box-shadow: 0 0 0 4px ${buttonColor} !important; background-color: ${hoverColor} !important; color: white !important; }
                .active svg { fill: white !important; }
              `}</style>
            </button>
          );
        })}
      </div>

      {tab==='menu' && (
        <div className="grid md:grid-cols-3 gap-6">
          <Section title="Add / Edit Item">
            <form onSubmit={addItem} className="space-y-3">
              <div>
                <label className="text-sm">Category</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f, category: e.target.value}))} className="w-full border rounded px-3 py-2">
                  {categories.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">Name</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="text-sm">Description</label>
                <input value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">Price</label>
                <input type="number" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f, price: e.target.value}))} className="w-full border rounded px-3 py-2" required />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={resetForm}
                  disabled={!isEditing}
                  className="animated-button group relative inline-flex items-center justify-center flex-1"
                  style={{
                    '--color': '#D4A76A',
                    '--hover-color': '#3E2723',
                    padding: '8px 16px',
                    fontSize: '14px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: '2px solid',
                    borderColor: 'transparent',
                    fontWeight: '600',
                    backgroundColor: 'transparent',
                    borderRadius: '100px',
                    color: '#D4A76A',
                    cursor: !isEditing ? 'not-allowed' : 'pointer',
                    overflow: 'hidden',
                    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                    boxShadow: '0 0 0 2px #D4A76A',
                    opacity: isEditing ? 1 : 0.6
                  }}
                >
                  <span className="text" style={{ position: 'relative', zIndex: 1, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                    Cancel
                  </span>
                  <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                  <style jsx>{`
                    .animated-button:hover:not(:disabled) { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
                    .animated-button:hover:not(:disabled) .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
                    .animated-button:active:not(:disabled) { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                  `}</style>
                </button>
                <button 
                  type="submit"
                  className="animated-button group relative inline-flex items-center justify-center flex-1"
                  style={{
                    '--color': '#D4A76A',
                    '--hover-color': '#3E2723',
                    padding: '8px 16px',
                    fontSize: '14px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
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
                    {isEditing ? 'Update Item' : 'Add Item'}
                  </span>
                  <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                  <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                    <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                  </svg>
                  <style jsx>{`
                    .animated-button:hover { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
                    .animated-button:hover .arr-1 { right: -25% !important; }
                    .animated-button:hover .arr-2 { left: 16px !important; }
                    .animated-button:hover .text { transform: translateX(12px) !important; }
                    .animated-button:hover svg { fill: white !important; }
                    .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                    .animated-button:hover .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
                  `}</style>
                </button>
              </div>
            </form>
          </Section>

          <Section title="Menu Items">
            <div className="space-y-4 max-h-[480px] overflow-auto pr-2">
              {categories.map(cat => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold capitalize">{cat}</h4>
                    {isEditing && form.category === cat && (
                      <button 
                        className="text-sm text-gray-500 hover:text-gray-700"
                        onClick={resetForm}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {menu[cat].map(item => (
                      <li key={item.id} className="border rounded p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.name} <span className="text-primary font-semibold">₹{item.price.toFixed(2)}</span></div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800" 
                            onClick={() => editItem(cat, item)}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800" 
                            onClick={() => deleteItem(cat, item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Tips">
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>Use Save Item to add to the selected category.</li>
              <li>Delete items from the list on the right.</li>
              <li>Changes are now saved to the secure database!</li>
            </ul>
          </Section>
        </div>
      )}

      {tab==='receipts' && (
        <Section title="Receipts">
          <div className="space-y-3">
            {receipts.length===0 && <div className="text-gray-500">No receipts yet.</div>}
            {receipts.map(r => (
              <div key={r.id} className="w-full border rounded p-3 hover:shadow">
                <div className="flex justify-between text-sm">
                  <div>Receipt: {r.id || r._id}</div>
                  <div>Date: {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-sm">Table: {r.tableId}</div>
                <ul className="mt-2 text-sm">
                  {r.items.map((it, idx)=> (
                    <li key={idx} className="flex justify-between">
                      <span>{it.name} x{it.qty}</span>
                      <span>₹{(it.price*it.qty).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-semibold">Total: ₹{r.total.toFixed(2)}</div>
                  <div className="flex gap-2">
                    {/* Note: Edit Receipt not implemented in backend demo for simplicity */}
                    <button className="px-2 py-1 border rounded" onClick={()=>setPreview(r)}>View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ReceiptModal 
            open={!!preview} 
            onClose={()=>{ setPreview(null); loadAllData(); }} 
            receipt={preview} 
            canEdit={false} 
          />
        </Section>
      )}

      {tab==='coupons' && (
        <Section title="Coupons">
          <CouponManager />
        </Section>
      )}

      {tab==='tables' && (
        <Section title="Tables">
          <div className="mb-6">
            <button 
              onClick={addTable}
              className="animated-button group relative inline-flex items-center justify-center"
              style={{
                '--color': '#D4A76A',
                '--hover-color': '#3E2723',
                padding: '8px 24px',
                fontSize: '14px',
                minWidth: '140px',
                position: 'relative',
                display: 'flex',
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
                Add Table
              </span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <style jsx>{`
                .animated-button:hover { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
                .animated-button:hover .arr-1 { right: -25% !important; }
                .animated-button:hover .arr-2 { left: 16px !important; }
                .animated-button:hover .text { transform: translateX(12px) !important; }
                .animated-button:hover svg { fill: white !important; }
                .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                .animated-button:hover .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
              `}</style>
            </button>
          </div>
          <ul className="space-y-2">
            {tables.map(t => (
              <li key={t.id || t._id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-gray-600">Active Order: {t.activeOrderId || 'None'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-red-600 text-sm" onClick={() => deleteTable(t.id || t._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab==='sales' && (
        <Section title="Sales">
          <div className="text-3xl font-bold">₹{salesTotal.toFixed(2)}</div>
        </Section>
      )}

      {tab==='users' && (
        <Section title="Users">
          <div className="mb-6 flex items-center gap-3">
            <button 
              onClick={addWaiter}
              className="animated-button group relative inline-flex items-center justify-center"
              style={{
                '--color': '#D4A76A',
                '--hover-color': '#3E2723',
                padding: '8px 24px',
                fontSize: '14px',
                minWidth: '140px',
                position: 'relative',
                display: 'flex',
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
                Add Waiter
              </span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <style jsx>{`
                .animated-button:hover { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
                .animated-button:hover .arr-1 { right: -25% !important; }
                .animated-button:hover .arr-2 { left: 16px !important; }
                .animated-button:hover .text { transform: translateX(12px) !important; }
                .animated-button:hover svg { fill: white !important; }
                .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                .animated-button:hover .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
              `}</style>
            </button>
            
            <button 
              onClick={addChef}
              className="animated-button group relative inline-flex items-center justify-center"
              style={{
                '--color': '#D4A76A',
                '--hover-color': '#3E2723',
                padding: '8px 24px',
                fontSize: '14px',
                minWidth: '120px',
                position: 'relative',
                display: 'flex',
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
                Add Chef
              </span>
              <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
              <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
              </svg>
              <style jsx>{`
                .animated-button:hover { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
                .animated-button:hover .arr-1 { right: -25% !important; }
                .animated-button:hover .arr-2 { left: 16px !important; }
                .animated-button:hover .text { transform: translateX(12px) !important; }
                .animated-button:hover svg { fill: white !important; }
                .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                .animated-button:hover .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #3E2723 !important; }
              `}</style>
            </button>
          </div>

          {/* Super Admin controls */}
          {user?.username === 'AbG' && (
            <div className="mb-4 p-3 border rounded bg-orange-50">
              <div className="font-semibold mb-2">Super Admin</div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm">Site status:</span>
                <span className="text-sm font-medium">{siteClosed ? 'Closed' : 'Open'}</span>
                <button className="px-3 py-1 border rounded" onClick={async () => {
                   // Toggle site status
                   const newValue = !siteClosed;
                   await fetch(`${API_URL}/api/settings`, {
                     method: 'PUT',
                     headers: {'Content-Type': 'application/json'},
                     body: JSON.stringify({ siteClosed: newValue })
                   });
                   setSiteClosed(newValue);
                   alert(`Site is now ${newValue ? 'CLOSED' : 'OPEN'}`)
                }}>{siteClosed ? 'Open Site' : 'Close Site'}</button>
              </div>
              <div className="text-xs text-gray-600">Closing the site prevents starting new orders.</div>
            </div>
          )}

          <ul className="space-y-2 text-sm">
            {users
              .filter(u => !(u.hidden && user?.username !== 'AbG'))
              .map(u => {
                const canDelete = (user?.username === 'AbG' && u.id !== 'root') || (user?.role === 'admin' && (u.role === 'waiter' || u.role === 'chef'))
                return (
                  <li key={u.id || u._id} className="border rounded p-2 flex justify-between items-center">
                    <span>{u.username} <span className="uppercase text-gray-500">({u.role})</span></span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">id: {u.id || u._id}</span>
                      {canDelete && (
                        <button className="text-red-600" onClick={() => deleteUser(u.id || u._id)}>Delete</button>
                      )}
                    </div>
                  </li>
                )
            })}
          </ul>
        </Section>
      )}

      {tab==='service' && (
        <Section title="Service (Take Orders)">
          <WaiterDashboard embedded onExit={()=>{}} />
        </Section>
      )}

      {tab==='settings' && (
        <SettingsPanel onBack={() => setTab('menu')} />
      )}
    </div>
  )
}