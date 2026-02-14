import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Menu from './components/Menu'
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

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/" replace />
  }
  
  // Handle role mapping
  if (role === 'staff') {
    if (!['waiter', 'chef'].includes(user.role)) {
      return <Navigate to="/" replace />
    }
  } else if (user.role !== role) {
    return <Navigate to="/" replace />
  }
  
  return children
}

// Admin Page Component
const AdminPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    // Log access
    logAccess('Admin', user?.id, null, null)
  }, [])
  
  const handleExit = () => {
    logout()
    navigate('/')
  }
  
  return <AdminDashboard onExit={handleExit} />
}

// Waiter Page Component
const WaiterPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    // Log access
    logAccess('Waiter', user?.id, null, null)
  }, [])
  
  const handleExit = () => {
    logout()
    navigate('/')
  }
  
  return <WaiterDashboard onExit={handleExit} />
}

// Chef Page Component
const ChefPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    // Log access
    logAccess('Chef', user?.id, null, null)
  }, [])
  
  const handleExit = () => {
    logout()
    navigate('/')
  }
  
  return <ChefDashboard onExit={handleExit} />
}

// Table/Device Page Component
const TableDevicePage = () => {
  const { tableId, deviceId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    // Log access
    logAccess('TableDevice', user?.id, tableId, deviceId)
  }, [tableId, deviceId])
  
  // Validate tableId and deviceId
  if (!tableId || !deviceId) {
    navigate('/')
    return null
  }
  
  return <CustomerOrdering tableId={tableId} deviceId={deviceId} />
}

// Access Logging Function
const logAccess = async (pageType, userId, tableId, deviceId) => {
  try {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ip: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip).catch(() => 'unknown')
    }
    
    await fetch('/api/log-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageType,
        userId,
        tableId,
        deviceId,
        deviceInfo
      })
    })
  } catch (error) {
    console.error('Failed to log access:', error)
  }
}

// Main App Component with Router
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  )
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginRole, setLoginRole] = useState('admin')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  // Handle redirect after successful login
  const handleLogin = (loggedInUser) => {
    if (loggedInUser.role === 'admin') {
      navigate('/admin')
    } else if (loggedInUser.role === 'chef') {
      navigate('/chef')
    } else if (loggedInUser.role === 'waiter') {
      navigate('/waiter')
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <Loader />
          </div>
        ) : (
          <>
            <Routes>
              {/* 1. LANDING PAGE (No auth required) */}
              <Route path="/" element={
                <>
                  <Navbar 
                    isMenuOpen={isMenuOpen} 
                    setIsMenuOpen={setIsMenuOpen}
                    onAdminLogin={() => { setLoginRole('admin'); setLoginOpen(true) }}
                    onWaiterLogin={() => { setLoginRole('staff'); setLoginOpen(true) }}
                  />
                  <main className="flex-grow">
                    <Hero />
                    <About />
                    <Menu />
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

              {/* 2. MULTI-PAGE STRUCTURE WITH AUTHENTICATION */}
              {/* Admin Page */}
              <Route path="/admin" element={<ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>} />
              
              {/* Waiter Page */}
              <Route path="/waiter" element={<ProtectedRoute role="waiter"><WaiterPage /></ProtectedRoute>} />
              
              {/* Chef Page */}
              <Route path="/chef" element={<ProtectedRoute role="chef"><ChefPage /></ProtectedRoute>} />
              
              {/* Table/Device Page */}
              <Route path="/:tableId/:deviceId" element={<TableDevicePage />} />

              {/* 3. CUSTOMER PORTAL (Legacy) */}
              {/* /order -> The Entry Screen (Enter Code) */}
              <Route path="/order" element={<TableCodeEntry />} />
              
              {/* /customer-order -> The Actual Menu (Ordering System) */}
              <Route path="/customer-order" element={<CustomerOrdering />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        )}
      </div>
  )
}

export default AppWrapper