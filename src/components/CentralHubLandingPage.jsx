import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, cardStyles } from '../styles/shared/CardStyles'
import { AnimatedButton, animatedButtonStyles } from '../styles/shared/SharedButtonStyles'
import LoginModal from './LoginModal'
import API_URL from '../config'

// ─── Restaurant Card Component ─────────────────────────────────────────────────
const RestaurantCard = ({ restaurant, onSelect }) => {
    const getTemplateIcon = (template) => {
        switch (template) {
            case 'brew-bites': return '☕'
            case 'pastel-poetry': return '🎨'
            default: return '🍽'
        }
    }

    const getStatusColor = (status) => {
        return status === 'active' ? '#66BB6A' : '#E88B5E'
    }

    return (
        <div style={{
            ...cardStyles.card,
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: `2px solid ${getStatusColor(restaurant.status)}`,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}
            onClick={() => onSelect && onSelect(restaurant)}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h3 style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        margin: '0 0 12px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontFamily: 'serif'
                    }}>
                        <span style={{ fontSize: '32px' }}>{getTemplateIcon(restaurant.landingPage)}</span>
                        {restaurant.name}
                    </h3>
                    <p style={{
                        fontSize: '15px',
                        color: '#D4A76A',
                        margin: '0',
                        fontWeight: 500
                    }}>
                        {restaurant.domain ? `🌐 ${restaurant.domain}` : '🔗 localhost:5173/' + restaurant.slug}
                    </p>
                </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px' }}>
                <AnimatedButton
                    color="#D4A76A"
                    hoverColor="#C09050"
                    minWidth="140px"
                    height="40px"
                    onClick={(e) => { e.stopPropagation(); onSelect && onSelect(restaurant); }}
                >
                    Visit Site →
                </AnimatedButton>
            </div>
        </div>
    )
}

const CentralHubLandingPage = () => {
    const [restaurants, setRestaurants] = useState([])
    const [loading, setLoading] = useState(true)
    const [loginOpen, setLoginOpen] = useState(false)
    const navigate = useNavigate()

    const handleLogin = (loggedInUser) => {
        if (loggedInUser.username.toLowerCase() === 'abg') {
            navigate('/superadmin')
        } else {
            // Can't manage a specific restaurant from here unless we know which one
            // So default behavior for other users logging in here:
            if (loggedInUser.role === 'admin') navigate('/superadmin')
            else if (loggedInUser.role === 'chef') navigate('/chef')
            else if (loggedInUser.role === 'waiter') navigate('/waiter')
        }
    }

    useEffect(() => {
        // Force a specific dark/premium background on the hub
        document.body.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
        document.body.style.color = '#fff';

        const fetchRestaurants = async () => {
            try {
                const response = await fetch(`${API_URL}/api/restaurants`)
                if (response.ok) {
                    const data = await response.json()
                    setRestaurants(data.filter(r => r.status === 'active'))
                }
            } catch (error) {
                console.error('Error fetching restaurants:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchRestaurants()

        return () => {
            document.body.style.background = '';
            document.body.style.color = '';
        }
    }, [])

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh'
            }}>
                <div style={{ width: 50, height: 50, border: '4px solid rgba(212, 167, 106, 0.3)', borderTop: '4px solid #D4A76A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: '#D4A76A', marginTop: '24px', fontFamily: 'serif', fontSize: '1.2rem', letterSpacing: '2px' }}>DISCOVERING LOCATIONS...</p>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    color: '#fff',
                    fontFamily: 'serif',
                    margin: '0 0 16px',
                    letterSpacing: '1px'
                }}>
                    Welcome to Our
                    <span style={{ color: '#D4A76A', fontStyle: 'italic', display: 'block', marginTop: '8px' }}>Dining Collection</span>
                </h1>
                <p style={{
                    fontSize: '1.2rem',
                    color: 'rgba(255,255,255,0.7)',
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: '1.6'
                }}>
                    Select from our curated portfolio of exceptional dining experiences. Each location offers its own unique atmosphere and culinary journey.
                </p>
            </header>

            <section style={{ padding: '60px 20px', flex: 1 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {restaurants.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                            <h3 style={{ color: '#D4A76A', fontSize: '1.5rem', marginBottom: '16px' }}>No Active Locations Found</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Check back later or contact the administrator.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                            gap: '32px'
                        }}>
                            {restaurants.map(rest => (
                                <RestaurantCard
                                    key={rest._id || rest.name}
                                    restaurant={rest}
                                    onSelect={(r) => navigate(`/${r.slug}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <footer style={{
                padding: '30px',
                textAlign: 'center',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.9rem'
            }}>
                <p>&copy; {new Date().getFullYear()} Dining Collection. All rights reserved.</p>
                <div style={{ marginTop: '16px' }}>
                    <span
                        onClick={() => setLoginOpen(true)}
                        style={{ cursor: 'pointer', color: '#D4A76A', opacity: 0.8 }}
                    >
                        Super Admin Portal Login
                    </span>
                </div>
            </footer>

            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                defaultRole="admin"
                isSuperAdmin={true}
                onLoggedIn={handleLogin}
            />
        </div>
    )
}

export default CentralHubLandingPage
