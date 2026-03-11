import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Hero from './Hero'
import Specialties from './Specialties'
import About from './About'
import Gallery from './Gallery'
import Contact from './Contact'
import Footer from './Footer'
import Loader from './Loader'
import LoginModal from './LoginModal'
import TableCodeEntry from './TableCodeEntry'
import PastelPoetryLanding from './PastelPoetryLanding'
import API_URL from '../config'

const RestaurantLandingPageWrapper = () => {
    const { restaurantSlug } = useParams()
    const navigate = useNavigate()
    const [restaurant, setRestaurant] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    // UI States (passed down from App previously)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const [loginRole, setLoginRole] = useState('admin')
    const [orderOpen, setOrderOpen] = useState(false)

    useEffect(() => {
        const fetchRestaurant = async () => {
            try {
                const response = await fetch(`${API_URL}/api/restaurants`)
                if (response.ok) {
                    const restaurants = await response.json()
                    const currentRest = restaurants.find(r => r.slug === restaurantSlug && r.status === 'active')
                    if (currentRest) {
                        setRestaurant(currentRest)
                        // Optional: dynamically set the document title
                        document.title = `${currentRest.name} | Dining Collection`
                    } else {
                        setError(true) // Not found or suspended
                    }
                } else {
                    setError(true)
                }
            } catch (err) {
                console.error('Error fetching restaurant:', err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }
        fetchRestaurant()
    }, [restaurantSlug])

    const handleLogin = (loggedInUser) => {
        // Determine where to redirect based on user role
        const basePath = `/${restaurantSlug}`
        if (loggedInUser.username.toLowerCase() === 'abg') navigate('/superadmin')
        else if (loggedInUser.role === 'admin') navigate(`${basePath}/admin`)
        else if (loggedInUser.role === 'chef') navigate('/chef')
        else if (loggedInUser.role === 'waiter') navigate('/waiter')
    }

    const openAdminLogin = () => { setLoginRole('admin'); setLoginOpen(true) }
    const openStaffLogin = () => { setLoginRole('staff'); setLoginOpen(true) }

    if (loading) {
        return <Loader />
    }

    if (error || !restaurant) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0605', color: '#D4A76A' }}>
                <h2>Restaurant Not Found</h2>
                <p>The location you are looking for does not exist or is currently suspended.</p>
                <button
                    onClick={() => navigate('/')}
                    style={{ marginTop: '20px', padding: '10px 20px', background: '#D4A76A', color: '#000', borderRadius: '4px' }}
                >
                    Return to Hub
                </button>
            </div>
        )
    }

    if (restaurant.landingPage === 'pastel-poetry') {
        return (
            <>
                <PastelPoetryLanding restaurant={restaurant} />
                <LoginModal
                    open={loginOpen}
                    onClose={() => setLoginOpen(false)}
                    defaultRole={loginRole}
                    onLoggedIn={handleLogin}
                />
                <TableCodeEntry open={orderOpen} onClose={() => setOrderOpen(false)} />
            </>
        )
    }

    // Default 'brew-bites' template structure

    return (
        <>
            <Navbar
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
                onAdminLogin={openAdminLogin}
                onWaiterLogin={openStaffLogin}
                restaurantName={restaurant.name}
            />

            <main className="flex-grow">
                <Hero
                    onOrderNow={() => setOrderOpen(true)}
                    onAdminLogin={openAdminLogin}
                    onWaiterLogin={openStaffLogin}
                    restaurantName={restaurant.name}
                    template={restaurant.landingPage}
                />
                <Specialties />
                <About />
                <Gallery />
                <Contact />
            </main>

            <Footer restaurantName={restaurant.name} />

            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                defaultRole={loginRole}
                onLoggedIn={handleLogin}
            />
            <TableCodeEntry open={orderOpen} onClose={() => setOrderOpen(false)} />
        </>
    )
}

export default RestaurantLandingPageWrapper
