import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Section, cardStyles } from '../styles/shared/CardStyles'
import { AnimatedButton, animatedButtonStyles } from '../styles/shared/SharedButtonStyles'
import API_URL from '../config'

const PastelPoetryLanding = ({ restaurant }) => {
  const navigate = useNavigate()

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFE5E5 0%, #FCE7F3 100%)',
      fontFamily: 'Georgia, serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '42px', 
              fontWeight: 300, 
              color: '#8B5A2B', 
              margin: 0,
              textShadow: '2px 2px 4px rgba(139, 69, 19, 0.1)'
            }}>
              🎨 {restaurant?.name || 'Pastel Poetry'}
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#666', 
              margin: '8px 0 0 16px',
              fontStyle: 'italic' 
            }}>
              Where every moment is a brushstroke of creativity
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <AnimatedButton
              onClick={() => navigate(`/${restaurant?.slug || 'pastel-poetry'}/admin`)}
              color="#8B5A2B"
              hoverColor="#6B4226"
              minWidth="160px"
              height="44px"
            >
              🎨 Admin Portal
            </AnimatedButton>
            <AnimatedButton
              onClick={() => navigate('/')}
              color="#666"
              hoverColor="#333"
              minWidth="140px"
              height="44px"
            >
              🏠 All Restaurants
            </AnimatedButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ 
        padding: '80px 20px', 
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          padding: '60px 40px',
          maxWidth: '800px',
          margin: '0 auto',
          boxShadow: '0 10px 30px rgba(139, 69, 19, 0.2)'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 300, 
            color: '#8B5A2B', 
            margin: '0 0 20px',
            textShadow: '1px 1px 2px rgba(139, 69, 19, 0.1)'
          }}>
            Welcome to Your Creative Haven
          </h2>
          <p style={{ 
            fontSize: '18px', 
            lineHeight: 1.6, 
            color: '#666', 
            margin: '0 0 30px'
          }}>
            Indulge in our handcrafted pastries and artisanal beverages, 
            where each bite tells a story and every sip inspires creativity.
          </p>
          <AnimatedButton
            onClick={() => navigate(`/${restaurant?.slug || 'pastel-poetry'}/order`)}
            color="#8B5A2B"
            hoverColor="#6B4226"
            minWidth="200px"
            height="52px"
            style={{ 
              fontSize: '18px', 
              fontWeight: 500,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
            }}
          >
            🎨 Begin Your Experience
          </AnimatedButton>
        </div>
      </section>

      {/* Features Section */}
      <Section title="Our Creative Offerings">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '30px' 
        }}>
          <div style={cardStyles.card}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 300, 
              color: '#8B5A2B', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              🎨 Artisan Pastries
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              lineHeight: 1.6,
              textAlign: 'center'
            }}>
              Handcrafted with love and creativity
            </p>
          </div>
          <div style={cardStyles.card}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 300, 
              color: '#8B5A2B', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              ☕ Creative Beverages
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              lineHeight: 1.6,
              textAlign: 'center'
            }}>
              Unique blends and artistic presentations
            </p>
          </div>
          <div style={cardStyles.card}>
            <h3 style={{ 
              fontSize: '24px', 
              fontWeight: 300, 
              color: '#8B5A2B', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              🌸 Ambiance
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              lineHeight: 1.6,
              textAlign: 'center'
            }}>
              Perfect for creative work and inspiration
            </p>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer style={{ 
        background: '#8B5A2B', 
        color: '#FCE7F3', 
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          © 2024 {restaurant?.name || 'Pastel Poetry'}. Crafted with creativity and passion.
        </p>
      </footer>
    </div>
  )
}

export default PastelPoetryLanding
