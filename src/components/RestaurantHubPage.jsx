import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, cardStyles } from '../styles/shared/CardStyles'
import { AnimatedButton, animatedButtonStyles } from '../styles/shared/SharedButtonStyles'
import API_URL from '../config'

// ─── Restaurant Card Component ─────────────────────────────────────────────────
const RestaurantCard = ({ restaurant, onSelect, onManage }) => {
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
      background: restaurant.status === 'active'
        ? 'linear-gradient(135deg, rgba(102, 187, 106, 0.1) 0%, rgba(102, 187, 106, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(232, 232, 232, 0.1) 0%, rgba(232, 232, 232, 0.05) 100%)'
    }}
      onClick={() => onSelect && onSelect(restaurant)}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#3E2723',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '28px' }}>{getTemplateIcon(restaurant.landingPage)}</span>
            {restaurant.name}
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 12px 0',
            flex: 1
          }}>
            {restaurant.domain ? `🌐 ${restaurant.domain}` : '🔗 localhost:5173/' + restaurant.slug}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: '20px',
            background: getStatusColor(restaurant.status),
            color: 'white'
          }}>
            {restaurant.status === 'active' ? 'Active' : 'Suspended'}
          </span>
          {onManage && (
            <AnimatedButton
              onClick={() => onManage(restaurant)}
              color="#3E2723"
              hoverColor="#1A0E0A"
              minWidth="120px"
              height="36px"
            >
              Manage
            </AnimatedButton>
          )}
        </div>
      </div>
    </div>
  )
}

const RestaurantHub = () => {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
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
  }, [])

  if (loading) {
    return (
      <Section id="restaurants" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: '#D4A76A', fontFamily: 'serif' }}>Loading Restaurants...</p>
      </Section>
    )
  }

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <Section id="restaurants" style={{ padding: '60px 20px', background: 'transparent' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: '42px',
          color: '#D4A76A',
          textAlign: 'center',
          marginBottom: '40px',
          fontFamily: 'serif'
        }}>
          Explore Our Locations
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {restaurants.map(rest => (
            <RestaurantCard
              key={rest._id || rest.name}
              restaurant={rest}
              onSelect={(r) => navigate(`/${r.slug || r.name.toLowerCase().replace(/\s+/g, '-')}`)}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}

export default RestaurantHub
