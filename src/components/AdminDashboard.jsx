import { useEffect, useMemo, useState, useCallback } from 'react'
// REMOVED: import { store } from '../store' 
import { useAuth } from '../context/AuthContext'
import ReceiptModal from './ReceiptModal'
import WaiterDashboard from './WaiterDashboard'
// Import jsPDF with CommonJS require since the module import is causing issues
const { jsPDF } = window.jspdf || {};
import('jspdf-autotable');
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
              className="input w-full p-3 pl-10"
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
  const [form, setForm] = useState({ 
    code: '', 
    type: 'percent', 
    value: 10, 
    maxUses: null,
    active: true 
  })
  const [isLoading, setIsLoading] = useState(false)

  // 1. Fetch Coupons
  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/coupons`);
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      alert('Failed to load coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCoupons(); }, []);

  // 2. Create Coupon
  const create = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.trim().toUpperCase()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create coupon');
      }
      
      await loadCoupons();
      setForm({ code: '', type: 'percent', value: 10, active: true });
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error creating coupon');
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Delete Coupon
  const del = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/coupons/${code}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete coupon');
      }
      
      await loadCoupons();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Error deleting coupon');
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/2">
        <Section title="Create New Coupon">
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input
                  className="input"
                  value={form.code}
                  onChange={e => setForm(f => ({...f, code: e.target.value.toUpperCase()}))}
                  placeholder="e.g. WELCOME10"
                  required
                  maxLength="20"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    className="input w-full"
                    value={form.type}
                    onChange={e => setForm(f => ({...f, type: e.target.value}))}
                    disabled={isLoading}
                  >
                    <option value="percent">Percentage</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.type === 'percent' ? 'Discount %' : 'Amount (₹)'}
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      step={form.type === 'percent' ? "1" : "0.01"}
                      min="0"
                      max={form.type === 'percent' ? "100" : ""}
                      className="input w-full"
                      value={form.value}
                      onChange={e => setForm(f => ({...f, value: parseFloat(e.target.value) || 0}))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Uses (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input w-full"
                    value={form.maxUses || ''}
                    onChange={e => setForm(f => ({...f, maxUses: e.target.value ? parseInt(e.target.value) : null}))}
                    placeholder="No limit"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={form.active}
                        onChange={e => setForm(f => ({...f, active: e.target.checked}))}
                        disabled={isLoading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {form.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="animated-button group relative inline-flex items-center justify-center"
                style={{
                  padding: '8px 24px',
                  fontSize: '15px',
                  minWidth: '150px',
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                  boxShadow: '0 0 0 2px #D4A76A',
                  opacity: isLoading ? 0.7 : 1,
                  pointerEvents: isLoading ? 'none' : 'auto',
                  height: '40px'
                }}
              >
                <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  {isLoading ? 'Creating...' : 'Create Coupon'}
                </span>
                <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#D4A76A', borderRadius: '50%', opacity: 0, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
                <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#D4A76A', zIndex: 9, transition: 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)' }}>
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <style jsx>{`
                  .animated-button:hover { 
                    box-shadow: 0 0 0 8px transparent !important; 
                    color: white !important; 
                    border-radius: 12px !important; 
                  }
                  .animated-button:hover .arr-1 { right: -25% !important; }
                  .animated-button:hover .arr-2 { left: 16px !important; }
                  .animated-button:hover .text { transform: translateX(12px) !important; }
                  .animated-button:hover svg { fill: white !important; }
                  .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #D4A76A !important; }
                  .animated-button:hover .circle { 
                    width: 200px !important; 
                    height: 200px !important; 
                    opacity: 1 !important; 
                    background-color: #3E2723 !important; 
                  }
                `}</style>
              </button>
            </div>
          </form>
        </Section>
      </div>

      <div className="md:w-1/2">
        <Section title="Existing Coupons">
          {isLoading && coupons.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Uses
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Times Used
                      </th>
                      <th scope="col" className="relative px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No coupons found. Create your first coupon.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => (
                        <tr key={coupon.code} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <code className="px-2 py-1 text-xs font-mono rounded bg-amber-100 text-amber-800">
                                  {coupon.code}
                                </code>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                            {coupon.type === 'percent' 
                              ? `${coupon.value}% off` 
                              : `₹${parseFloat(coupon.value).toFixed(2)} off`}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.maxUses || '∞'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              coupon.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {coupon.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                            {coupon.usedCount || 0}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => del(coupon.code)}
                                disabled={isLoading}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                                title="Delete"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function SettingsPanel({ onBack }) {
  const [settings, setSettings] = useState({ autoSubmitToChef: true })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const { user } = useAuth()
  const isSuperAdmin = user && user.username.toLowerCase() === 'abg'

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

  const handleToggleSiteStatus = (e) => {
    const newSettings = { ...settings, siteClosed: e.target.checked }
    setSettings(newSettings)
  }

  const handleToggleTax = (e) => {
    const newSettings = { 
      ...settings, 
      taxEnabled: e.target.checked,
      // Reset tax rate to 0 if disabling tax
      taxRate: e.target.checked ? (settings.taxRate || 0) : 0
    }
    setSettings(newSettings)
  }

  const handleTaxRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const newSettings = { 
      ...settings, 
      taxRate: Math.min(100, Math.max(0, value)) // Keep between 0-100
    }
    setSettings(newSettings)
  }

  // --- YOUR EXACT UI ---
  return (
    <div className="space-y-6">
      <Section title="Application Settings">
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Order Submission (Waiter)</h4>
                <p className="text-sm text-gray-600">
                  {settings.autoSubmitToChef 
                    ? 'Orders taken by Waiters are automatically sent to the kitchen when items are added.'
                    : 'Orders taken by Waiters require manual submission to the kitchen.'}
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

            {isSuperAdmin && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
                <div>
                  <h4 className="font-medium">Website Status</h4>
                  <p className="text-sm text-gray-600">
                    {settings.siteClosed 
                      ? 'Website is currently CLOSED. Only super admin can log in.'
                      : 'Website is OPEN for all users to log in.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.siteClosed || false}
                    onChange={handleToggleSiteStatus}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {settings.siteClosed ? 'Site Closed' : 'Site Open'}
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">Tax Settings</h4>
                <p className="text-sm text-gray-600">
                  {settings.taxEnabled 
                    ? `Tax is ENABLED at ${settings.taxRate || 0}%`
                    : 'Tax is currently DISABLED'}
                </p>
                {settings.taxEnabled && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={settings.taxRate || 0}
                      onChange={handleTaxRateChange}
                      className="input w-24"
                    />
                  </div>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.taxEnabled || false}
                  onChange={handleToggleTax}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">
                  {settings.taxEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
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
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [tableMap, setTableMap] = useState({});

  // Get filtered and sorted receipts based on current filters and sort
  const getFilteredReceipts = useCallback(() => {
    return [...receipts]
      .filter(receipt => {
        if (!dateFilter.startDate && !dateFilter.endDate) return true;
        
        const receiptDate = new Date(receipt.createdAt).setHours(0, 0, 0, 0);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate).setHours(0, 0, 0, 0) : -Infinity;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate).setHours(23, 59, 59, 999) : Infinity;
        
        return receiptDate >= startDate && receiptDate <= endDate;
      });
  }, [receipts, dateFilter]);

  // Export to CSV function
  const exportToCSV = (receiptsToExport) => {
    const headers = ['Receipt ID', 'Date', 'Table', 'Total (₹)', 'Items'];
    
    const csvContent = [
      headers.join(','),
      ...receiptsToExport.map(receipt => {
        const tableName = receipt.tableId 
          ? (tableMap[receipt.tableId._id || receipt.tableId] || `Table ${receipt.tableId.tableNumber || 'N/A'}`) 
          : 'Takeaway';
        
        const items = receipt.items?.map(item => 
          `${item.quantity}x ${item.name} (₹${item.price})`
        ).join('; ') || '';
        
        return [
          `"${receipt._id.slice(-6)}"`,
          `"${new Date(receipt.createdAt).toLocaleString()}"`,
          `"${tableName}"`,
          `"${receipt.total?.toFixed(2) || '0.00'}"`,
          `"${items}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `receipts_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF function
  const exportToPDF = (receiptsToExport) => {
    try {
      if (typeof jsPDF === 'undefined' || !window.jspdf) {
        console.error('jsPDF is not properly loaded');
        alert('Error: PDF generation library not loaded. Please refresh the page and try again.');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;
      let currentPage = 1;
      let totalSales = 0;

      // Simple currency formatter for PDF
      const formatCurrency = (amount) => {
        // Convert to number, handle undefined/NaN cases
        const num = parseFloat(amount) || 0;
        // Simple number formatting with 2 decimal places
        return `Rs. ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
      };

      // Add summary table (Page 1)
      const addSummaryTable = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('Brew & Bites Café - Sales Summary', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        if (dateFilter.startDate || dateFilter.endDate) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const dateRange = [
            dateFilter.startDate ? `From: ${new Date(dateFilter.startDate).toLocaleDateString()}` : '',
            dateFilter.endDate ? `To: ${new Date(dateFilter.endDate).toLocaleDateString()}` : ''
          ].filter(Boolean).join(' ');
          
          doc.text(dateRange, pageWidth / 2, yPos, { align: 'center' });
          yPos += 10;
        }

        // Prepare table data
        const tableData = receiptsToExport.map(receipt => {
          const tableName = receipt.tableId 
            ? (tableMap[receipt.tableId._id || receipt.tableId] || `Table ${receipt.tableId.tableNumber || 'N/A'}`) 
            : (receipt.deliveryType === 'home' ? 'Home Delivery' : 'Takeaway');
          
          return [
            receipt._id.slice(-6).toUpperCase(),
            new Date(receipt.createdAt).toLocaleString(),
            tableName,
            receipt.items?.length || 0,
            formatCurrency(receipt.total)
          ];
        });

        // Add summary table
        doc.autoTable({
          head: [['Order ID', 'Date', 'Table', 'Items', 'Total']],
          body: tableData,
          startY: yPos,
          margin: { top: yPos },
          styles: { 
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak',
            lineWidth: 0.1,
            textColor: [0, 0, 0]
          },
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 20, cellPadding: 2 },
            1: { cellWidth: 30, cellPadding: 2 },
            2: { cellWidth: 25, cellPadding: 2 },
            3: { cellWidth: 15, cellPadding: 2, halign: 'center' },
            4: { cellWidth: 20, cellPadding: 2, halign: 'right' }
          },
          didDrawPage: function(data) {
            // Add total at the bottom
            const total = receiptsToExport.reduce((sum, r) => sum + (r.total || 0), 0);
            const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : yPos;
            
            // Save current font settings
            const prevFont = doc.getFont();
            const prevSize = doc.getFontSize();
            
            // Set new font settings
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            
            // Calculate text width for right alignment
            const text = `Total Sales: ${formatCurrency(total)}`;
            const textWidth = doc.getTextWidth(text);
            
            // Draw the text
            doc.text(
              text,
              pageWidth - margin - textWidth,
              finalY + 10
            );
            
            // Restore previous font settings
            doc.setFont(prevFont.fontName, prevFont.fontStyle);
            doc.setFontSize(prevSize);
          }
        });

        yPos = doc.lastAutoTable.finalY + 15;
      };

      // Add detailed receipt function
      const addReceipt = (receipt) => {
        // Check for page break (leave room for at least one receipt)
        if (yPos > 200) {
          doc.addPage();
          currentPage++;
          yPos = 20;
        }

        const tableName = receipt.tableId 
          ? (tableMap[receipt.tableId._id || receipt.tableId] || `Table ${receipt.tableId.tableNumber || 'N/A'}`) 
          : (receipt.deliveryType === 'home' ? 'Home Delivery' : 'Takeaway');

        const receiptTotal = receipt.total || 0;
        const tax = receipt.tax || 0;
        const discount = receipt.discount || 0;
        const subtotal = receiptTotal + discount - tax;

        // Receipt header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Order #${receipt._id.slice(-6).toUpperCase()}`, margin, yPos);
        yPos += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Date: ${new Date(receipt.createdAt).toLocaleString()}`, margin, yPos);
        yPos += 5;
        
        doc.text(`Order Type: ${tableName}`, margin, yPos);
        yPos += 10;

        // Items header
        doc.setFont('helvetica', 'bold');
        doc.text('Items Ordered:', margin, yPos);
        yPos += 7;
        
        // Items list
        doc.setFont('helvetica', 'normal');
        receipt.items?.forEach(item => {
          if (!item || !item.name) return; // Skip invalid items
          
          // Handle different possible quantity property names
          const quantity = item.quantity || item.quantityOrdered || 1;
          const price = item.price || 0;
          const itemTotal = quantity * price;
          const itemText = `${quantity} × ${item.name}`;
          const priceText = formatCurrency(itemTotal);
          
          // Split long item names across multiple lines
          const maxWidth = 100; // Reduced max width to accommodate price
          const splitText = doc.splitTextToSize(itemText, maxWidth);
          
          // Add item name (first line)
          doc.text(splitText[0], margin + 5, yPos);
          
          // Add price aligned to the right on the same line as the first line of item text
          doc.text(priceText, pageWidth - margin - 5, yPos, { align: 'right' });
          
          // Handle multi-line item names
          if (splitText.length > 1) {
            for (let i = 1; i < splitText.length; i++) {
              yPos += 5;
              doc.text(splitText[i], margin + 5, yPos);
            }
          }
          
          // Move down for next item
          yPos += 5;
        });

        // Order summary
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Order Summary:', margin, yPos);
        yPos += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Subtotal:`, margin + 5, yPos);
        doc.text(formatCurrency(subtotal), pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        
        if (tax > 0) {
          doc.text(`Tax (${receipt.taxRate || 5}%):`, margin + 5, yPos);
          doc.text(formatCurrency(tax), pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        }
        
        if (discount > 0) {
          doc.text(`Discount:`, margin + 5, yPos);
          doc.text(`-${formatCurrency(discount)}`, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        }
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Total:`, margin + 5, yPos);
        doc.text(formatCurrency(receiptTotal), pageWidth - margin, yPos, { align: 'right' });
        yPos += 10;
        
        // Add separator
        doc.setDrawColor(200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;
      };

      // Generate PDF
      addSummaryTable();  // First page with summary table
      
      // Add a new page for detailed receipts
      doc.addPage();
      currentPage = 2;
      yPos = 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Detailed Receipts', pageWidth / 2, yPos, { align: 'center' });
      yPos = 30;
      
      // Add all receipts
      receiptsToExport.forEach(receipt => addReceipt(receipt));

      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, 
                 pageWidth / 2, 287, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 
                 pageWidth - margin, 287, { align: 'right' });
      }

      // Save the PDF
      doc.save(`BrewBites_Receipts_${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check the console for details.');
    }
  };
  
  // Handle sorting when column headers are clicked
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
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
      
      // Process tables and create a map of _id to table name
      const tablesData = await tableRes.json();
      setTables(tablesData);
      
      // Create a map of table _id to table name
      const tableMapping = {};
      tablesData.forEach(table => {
        tableMapping[table._id] = table.name || `Table ${table.tableNumber || 'N/A'}`;
      });
      setTableMap(tableMapping);
      
      const rData = await receiptRes.json();
      setReceipts(rData);
      setSalesTotal(rData.reduce((sum, r) => sum + (r.total || 0), 0));

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

  // 8. DELETE RECEIPT (API)
  const deleteReceipt = async (receiptId) => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/orders/${receiptId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }
      
      // Refresh the receipts list
      loadAllData();
      // Close the modal if it's open
      if (preview) {
        setPreview(null);
      }
      
      // Show success message
      alert('Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    }
  }

  // 9. UPDATE RECEIPT (API)
  const updateReceipt = async (receiptId, updatedItems) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${receiptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: updatedItems })
      });

      if (!response.ok) {
        throw new Error('Failed to update receipt');
      }

      // Update the local state to reflect the changes
      const updatedReceipt = await response.json();
      
      // Update the receipts list
      setReceipts(prevReceipts => 
        prevReceipts.map(r => 
          r._id === updatedReceipt._id ? { ...r, ...updatedReceipt } : r
        )
      );
      
      // Update the preview if it's open
      if (preview && preview._id === updatedReceipt._id) {
        setPreview(updatedReceipt);
      }
      
      // Update sales total
      setSalesTotal(prevTotal => 
        prevTotal - (preview?.total || 0) + updatedReceipt.total
      );
      
      alert('Receipt updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating receipt:', error);
      alert('Failed to update receipt. Please try again.');
      return false;
    }
  }

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.username}</span>
          <button
            className="animated-button group relative inline-flex items-center justify-center"
            onClick={onExit}
            style={{
              '--color': '#9CA3AF',
              '--hover-color': '#4B5563',
              padding: '6px 20px',
              fontSize: '14px',
              minWidth: '100px',
              height: '36px',
              marginRight: '8px',
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
              color: '#9CA3AF',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              boxShadow: '0 0 0 2px #9CA3AF'
            }}
          >
            <svg viewBox="0 0 24 24" className="arr-2" style={{ position: 'absolute', width: '16px', height: '16px', left: '-25%', fill: '#9CA3AF', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
            <span className="text" style={{ position: 'relative', zIndex: 1, transform: 'translateX(-12px)', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>Exit</span>
            <span className="circle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', backgroundColor: '#9CA3AF', borderRadius: '50%', opacity: 0, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}></span>
            <svg viewBox="0 0 24 24" className="arr-1" style={{ position: 'absolute', width: '16px', height: '16px', right: '16px', fill: '#9CA3AF', zIndex: 9, transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}><path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path></svg>
            <style jsx>{`
              .animated-button:hover { box-shadow: 0 0 0 8px transparent !important; color: white !important; border-radius: 12px !important; }
              .animated-button:hover .arr-1 { right: -25% !important; }
              .animated-button:hover .arr-2 { left: 16px !important; }
              .animated-button:hover .text { transform: translateX(12px) !important; }
              .animated-button:hover svg { fill: white !important; }
              .animated-button:active { transform: scale(0.95) !important; box-shadow: 0 0 0 4px #9CA3AF !important; }
              .animated-button:hover .circle { width: 200px !important; height: 200px !important; opacity: 1 !important; background-color: #4B5563 !important; }
            `}</style>
          </button>
          <button
            className="animated-button group relative inline-flex items-center justify-center"
            onClick={logout}
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
                <select 
                  value={form.category} 
                  onChange={e => setForm(f => ({...f, category: e.target.value}))} 
                  className="input w-full"
                >
                  {categories.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm">Name</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({...f, name: e.target.value}))} 
                  className="input w-full" 
                  placeholder="Item name"
                  required 
                />
              </div>
              <div>
                <label className="text-sm">Description</label>
                <input 
                  value={form.description} 
                  onChange={e => setForm(f => ({...f, description: e.target.value}))} 
                  className="input w-full" 
                  placeholder="Item description (optional)"
                />
              </div>
              <div>
                <label className="text-sm">Price</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={form.price} 
                  onChange={e => setForm(f => ({...f, price: e.target.value}))} 
                  className="input w-full" 
                  placeholder="0.00"
                  required 
                />
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
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-semibold">Receipts</h3>
              <div className="relative group">
                <button 
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 text-sm"
                  onMouseEnter={(e) => {
                    clearTimeout(e.currentTarget.closest('.group')._timer);
                    e.currentTarget.closest('.group').classList.add('is-open');
                  }}
                >
                  Export
                </button>
                <div 
                  className="absolute left-0 mt-1 w-32 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible transition-all duration-200 transform -translate-y-1 group-[.is-open]:opacity-100 group-[.is-open]:visible group-[.is-open]:translate-y-0"
                  onMouseEnter={(e) => {
                    clearTimeout(e.currentTarget.closest('.group')._timer);
                    e.currentTarget.closest('.group').classList.add('is-open');
                  }}
                  onMouseLeave={(e) => {
                    const group = e.currentTarget.closest('.group');
                    group._timer = setTimeout(() => {
                      group.classList.remove('is-open');
                    }, 200);
                  }}
                >
                  <button 
                    onClick={() => exportToCSV(getFilteredReceipts())}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button 
                    onClick={() => exportToPDF(getFilteredReceipts())}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">From:</label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border rounded p-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">To:</label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border rounded p-1 text-sm"
                  min={dateFilter.startDate}
                />
              </div>
              {(dateFilter.startDate || dateFilter.endDate) && (
                <button
                  onClick={() => setDateFilter({ startDate: '', endDate: '' })}
                  className="text-sm text-red-600 hover:underline whitespace-nowrap"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="text-lg font-medium">
              Total Sales: <span className="text-green-600">₹{salesTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('_id')}
                  >
                    <div className="flex items-center">
                      ID
                      {sortConfig.key === '_id' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Date
                      {sortConfig.key === 'createdAt' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left p-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('tableId.name')}
                  >
                    <div className="flex items-center">
                      Table
                      {sortConfig.key === 'tableId.name' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right p-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center justify-end">
                      Total
                      {sortConfig.key === 'total' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredReceipts()
                  .sort((a, b) => {
                    let aValue, bValue;
                    
                    // Handle nested properties
                    if (sortConfig.key === 'tableId.name') {
                      aValue = a.tableId?.name || 'Z';
                      bValue = b.tableId?.name || 'Z';
                      
                      // If both are 'Z' (no table), sort by date
                      if (aValue === 'Z' && bValue === 'Z') {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                      }
                      
                      // If one is 'Z', push it to the end
                      if (aValue === 'Z') return sortConfig.direction === 'asc' ? 1 : -1;
                      if (bValue === 'Z') return sortConfig.direction === 'asc' ? -1 : 1;
                    } else {
                      aValue = a[sortConfig.key];
                      bValue = b[sortConfig.key];
                    }
                    
                    // Handle different data types
                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                      return sortConfig.direction === 'asc' 
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                    } else if (aValue instanceof Date && bValue instanceof Date) {
                      return sortConfig.direction === 'asc'
                        ? aValue - bValue
                        : bValue - aValue;
                    } else {
                      return sortConfig.direction === 'asc'
                        ? (aValue || 0) - (bValue || 0)
                        : (bValue || 0) - (aValue || 0);
                    }
                  })
                  .map((r) => (
                  <tr key={r._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{r._id.slice(-6)}</td>
                    <td className="p-2">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-2">
                      {r.tableId ? (tableMap[r.tableId._id || r.tableId] || `Table ${r.tableId.tableNumber || 'N/A'}`) : 'Takeaway'}
                    </td>
                    <td className="p-2 text-right">₹{r.total?.toFixed(2) || '0.00'}</td>
                    <td className="p-2 text-right space-x-2">
                      <button 
                        onClick={() => setPreview(r)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => deleteReceipt(r._id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview && (
        <ReceiptModal
          open={!!preview}
          onClose={() => setPreview(null)}
          receipt={preview}
          canEdit={true}
          onDelete={deleteReceipt}
          onUpdate={async (items) => {
            const success = await updateReceipt(preview._id, items);
            if (success) {
              // Refresh the data to ensure everything is in sync
              loadAllData();
            }
            return success;
          }}
        />
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