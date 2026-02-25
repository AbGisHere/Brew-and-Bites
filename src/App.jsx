import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Specialties from './components/Specialties'
import About from './components/About'
import FeaturedItems from './components/FeaturedItems'
import Gallery from './components/Gallery'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Loader from './components/Loader'
import LoginModal from './components/LoginModal'
import AdminDashboard from './components/AdminDashboard'
import WaiterDashboard from './components/WaiterDashboard'
import ChefDashboard from './components/ChefDashboard'
import TableCodeEntry from './components/TableCodeEntry'
import CustomerOrdering from './components/CustomerOrdering'
import { useAuth } from './context/AuthContext'

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
  return <AdminDashboard onExit={() => { logout(); navigate('/') }} />
}

const WaiterPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { logAccess('Waiter', user?.id, null, null) }, [])
  return <WaiterDashboard onExit={() => { logout(); navigate('/') }} />
}

const ChefPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { logAccess('Chef', user?.id, null, null) }, [])
  return <ChefDashboard onExit={() => { logout(); navigate('/') }} />
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginRole, setLoginRole] = useState('admin')
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Restore the dashboard background (conic gradient + glassmorphism) on
  // non-landing routes, so dashboards look exactly as they did before the
  // landing page redesign. The landing page controls its own backgrounds.
  useEffect(() => {
    const isDashboard = /^\/(admin|waiter|chef|order|customer-order|[^/]+\/[^/]+)/.test(location.pathname)
    document.body.classList.toggle('dashboard-bg', isDashboard)
    return () => document.body.classList.remove('dashboard-bg')
  }, [location.pathname])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = (loggedInUser) => {
    if (loggedInUser.role === 'admin') navigate('/admin')
    else if (loggedInUser.role === 'chef') navigate('/chef')
    else if (loggedInUser.role === 'waiter') navigate('/waiter')
  }

  const openAdminLogin = () => { setLoginRole('admin'); setLoginOpen(true) }
  const openStaffLogin = () => { setLoginRole('staff'); setLoginOpen(true) }

  return (
    <div className="min-h-screen flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader />
        </div>
      ) : (
        <Routes>
          {/* LANDING PAGE */}
          <Route path="/" element={
            <>
              <Navbar
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                onAdminLogin={openAdminLogin}
                onWaiterLogin={openStaffLogin}
              />
              <main className="flex-grow">
                <Hero onAdminLogin={openAdminLogin} onWaiterLogin={openStaffLogin} />
                <Specialties />
                <About />
                <Gallery />
                <Contact />
              </main>
              <Footer />
              <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                defaultRole={loginRole}
                onLoggedIn={handleLogin}
              />
            </>
          } />

          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
          <Route path="/waiter" element={<ProtectedRoute role="waiter"><WaiterPage /></ProtectedRoute>} />
          <Route path="/chef" element={<ProtectedRoute role="chef"><ChefPage /></ProtectedRoute>} />
          <Route path="/:tableId/:deviceId" element={<TableDevicePage />} />
          <Route path="/order" element={<TableCodeEntry />} />
          <Route path="/customer-order" element={<CustomerOrdering />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  )
}

export default AppWrapper
