import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'
import { animatedButtonStyles, colors } from './styles/shared/SharedButtonStyles'
import { cardStyles } from './styles/shared/CardStyles'
import { useAuth } from './context/AuthContext'
import { useSmartCache, useLazyLoad } from './hooks/useSmartCache'
import { registerServiceWorker } from './utils/serviceWorker'

// Smart lazy loading with caching
const createLazyComponent = (importPath, componentName) => {
  return lazy(() =>
    import(`./components/${importPath}.jsx`).then(module => {
      // Cache the component for future use
      if ('caches' in window) {
        caches.open('brew-bites-admin').then(cache => {
          cache.put(`/${componentName.toLowerCase()}`, new Response(JSON.stringify({
            cached: true,
            timestamp: Date.now(),
            component: componentName
          })))
        })
      }
      console.log(`✅ Loaded ${componentName}`)
      return module
    }).catch(error => {
      console.error(`❌ Failed to load ${componentName}:`, error)
      // Return a fallback component
      return { default: () => <div>Error loading {componentName}</div> }
    })
  )
}

// Lazy load admin components with smart caching
const AdminDashboard = createLazyComponent('AdminDashboard', 'AdminDashboard')
const SuperAdminDashboard = createLazyComponent('SuperAdminDashboard', 'SuperAdminDashboard')
const WaiterDashboard = createLazyComponent('WaiterDashboard', 'WaiterDashboard')
const ChefDashboard = createLazyComponent('ChefDashboard', 'ChefDashboard')
const RestaurantHubPage = createLazyComponent('RestaurantHubPage', 'RestaurantHubPage')
const CentralHubLandingPage = createLazyComponent('CentralHubLandingPage', 'CentralHubLandingPage')
const RestaurantLandingPageWrapper = createLazyComponent('RestaurantLandingPageWrapper', 'RestaurantLandingPageWrapper')

// Lazy load landing page components
const Navbar = createLazyComponent('Navbar', 'Navbar')
const Hero = createLazyComponent('Hero', 'Hero')
const Specialties = createLazyComponent('Specialties', 'Specialties')
const About = createLazyComponent('About', 'About')
const Gallery = createLazyComponent('Gallery', 'Gallery')
const Contact = createLazyComponent('Contact', 'Contact')
const Footer = createLazyComponent('Footer', 'Footer')
const Loader = createLazyComponent('Loader', 'Loader')
const LoginModal = createLazyComponent('LoginModal', 'LoginModal')
const TableCodeEntry = createLazyComponent('TableCodeEntry', 'TableCodeEntry')
const CustomerOrdering = createLazyComponent('CustomerOrdering', 'CustomerOrdering')

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (role === 'staff') {
    if (!['waiter', 'chef'].includes(user.role)) return <Navigate to="/" replace />
  } else if (user.role !== role) {
    return <Navigate to="/" replace />
  }
  return children
}

const AdminPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { logAccess('Admin', user?.id, null, null) }, [])

  const isSuperAdmin = user?.username?.toLowerCase() === 'abg'
  const selectedRest = isSuperAdmin ? (() => { try { return JSON.parse(localStorage.getItem('selectedRestaurant')) } catch { return null } })() : null

  const handleExit = () => {
    if (isSuperAdmin) {
      localStorage.removeItem('selectedRestaurant')
      navigate('/superadmin')
    } else {
      logout()
      navigate('/')
    }
  }

  return (
    <>
      {/* ─── Back-to-portal banner, shown when AbG is managing a restaurant ─── */}
      {isSuperAdmin && selectedRest && (
        <div style={{
          ...cardStyles.card,
          borderRadius: 0,
          margin: 0,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 200,
          borderBottom: '1px solid rgba(212,167,106,0.25)',
        }}>
          <style>{animatedButtonStyles.hoverStyles}</style>
          <span style={{ fontSize: 13, color: colors.brown, fontWeight: 600 }}>
            Managing: <strong style={{ color: colors.primaryDark }}>{selectedRest.name}</strong>
          </span>
          <button
            className="close-button"
            onClick={handleExit}
            style={{ ...animatedButtonStyles.closeButton, minWidth: 180, marginLeft: 'auto' }}
          >
            ← Back to Super Admin Portal
          </button>
        </div>
      )}
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(180deg, #0d0806 0%, #0a0605 100%)' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader />
            <p style={{ color: '#D4A76A', marginTop: '20px', fontFamily: 'serif' }}>Loading Admin Dashboard...</p>
          </div>
        </div>
      }>
        <AdminDashboard onExit={handleExit} />
      </Suspense>
    </>
  )
}

const SuperAdminPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  // SuperAdmin gets its own dashboard
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(180deg, #0d0806 0%, #0a0605 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader />
          <p style={{ color: '#D4A76A', marginTop: '20px', fontFamily: 'serif' }}>Loading Super Admin Dashboard...</p>
        </div>
      </div>
    }>
      <SuperAdminDashboard onExit={() => { logout(); navigate('/') }} />
    </Suspense>
  )
}

const WaiterPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { logAccess('Waiter', user?.id, null, null) }, [])
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(180deg, #0d0806 0%, #0a0605 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader />
          <p style={{ color: '#D4A76A', marginTop: '20px', fontFamily: 'serif' }}>Loading Waiter Dashboard...</p>
        </div>
      </div>
    }>
      <WaiterDashboard onExit={() => { logout(); navigate('/') }} />
    </Suspense>
  )
}

const ChefPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { logAccess('Chef', user?.id, null, null) }, [])
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(180deg, #0d0806 0%, #0a0605 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader />
          <p style={{ color: '#D4A76A', marginTop: '20px', fontFamily: 'serif' }}>Loading Chef Dashboard...</p>
        </div>
      </div>
    }>
      <ChefDashboard onExit={() => { logout(); navigate('/') }} />
    </Suspense>
  )
}

const TableDevicePage = () => {
  const { tableId, deviceId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { logAccess('TableDevice', user?.id, tableId, deviceId) }, [tableId, deviceId])
  if (!tableId || !deviceId) { navigate('/'); return null }
  return <CustomerOrdering tableId={tableId} deviceId={deviceId} />
}

const logAccess = async (pageType, userId, tableId, deviceId) => {
  try {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ip: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => 'unknown'),
    }
    await fetch('/api/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageType, userId, tableId, deviceId, deviceInfo }),
    })
  } catch (e) {
    console.error('Failed to log access:', e)
  }
}

function AppWrapper() {
  return <Router><App /></Router>
}

function App() {
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Smart caching for staff users
  const { cacheStatus, clearCache, getCacheStats, isStaff } = useSmartCache()

  // Restore the dashboard background (conic gradient + glassmorphism) on
  // non-landing routes, so dashboards look exactly as they did before the
  // landing page redesign. The landing page controls its own backgrounds.
  useEffect(() => {
    const isDashboard = /^\/(admin|superadmin|waiter|chef|customer-order|[^/]+\/[^/]+)/.test(location.pathname)
    document.body.classList.toggle('dashboard-bg', isDashboard)
    return () => document.body.classList.remove('dashboard-bg')
  }, [location.pathname])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  // Log cache status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      console.log(`👤 User: ${user.role} | 📦 Cache Status:`, cacheStatus)
    }
  }, [user, cacheStatus])

  // Register service worker and handle staff caching
  useEffect(() => {
    const registerSW = async () => {
      try {
        const success = await registerServiceWorker(user?.role)
        if (success && user) {
          console.log(`🚀 Service Worker ready for ${user.role}`)
        }
      } catch (error) {
        console.warn('Service Worker registration failed:', error)
      }
    }

    // Register SW after component mounts
    registerSW()
  }, [user])


  return (
    <div className="min-h-screen flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader />
        </div>
      ) : (
        <Routes>
          {/* MAIN CENTRAL HUB (localhost:5173/) */}
          <Route path="/" element={
            <Suspense fallback={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, border: '4px solid rgba(212, 167, 106, 0.3)', borderTop: '4px solid #D4A76A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <p style={{ color: '#D4A76A', marginTop: '20px', fontFamily: 'serif' }}>Loading Gateway...</p>
                </div>
              </div>
            }>
              <CentralHubLandingPage />
            </Suspense>
          } />

          <Route path="/superadmin" element={<ProtectedRoute role="admin"><SuperAdminPage /></ProtectedRoute>} />

          {/* INDIVIDUAL RESTAURANT LANDING PAGE (localhost:5173/brew-and-bites) */}
          <Route path="/:restaurantSlug" element={
            <Suspense fallback={<Loader />}>
              <RestaurantLandingPageWrapper />
            </Suspense>
          } />
          <Route path="/:restaurantSlug/admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
          <Route path="/waiter" element={<ProtectedRoute role="waiter"><WaiterPage /></ProtectedRoute>} />
          <Route path="/chef" element={<ProtectedRoute role="chef"><ChefPage /></ProtectedRoute>} />
          <Route path="/:tableId/:deviceId" element={<TableDevicePage />} />
          <Route path="/order" element={<Navigate to="/" replace />} />
          <Route path="/customer-order" element={<CustomerOrdering />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  )
}

export default AppWrapper
