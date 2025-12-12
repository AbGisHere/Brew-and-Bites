import { useEffect, useState } from 'react'
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
import { useAuth } from './context/AuthContext'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginRole, setLoginRole] = useState('admin')
  const { user } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="min-h-screen flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader />
        </div>
      ) : (
        <>
          {!user ? (
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
              />
            </>
          ) : (
            <>
              {user.role === 'admin' ? (
                <AdminDashboard onExit={() => window.location.reload()} />
              ) : user.role === 'chef' ? (
                <ChefDashboard onExit={() => window.location.reload()} />
              ) : (
                <WaiterDashboard onExit={() => window.location.reload()} />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default App
