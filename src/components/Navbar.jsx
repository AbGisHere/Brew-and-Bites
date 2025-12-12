import { useState, useEffect } from 'react'
import { FiMenu, FiX, FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-scroll'
import AnimatedButton from './AnimatedButton'

// Navigation link component with the new style
const NavLink = ({ to, children, onClick, className = '' }) => (
  <Link
    to={to}
    smooth
    duration={500}
    className={`cta ${className}`}
    activeClass="text-primary font-medium"
    spy
    offset={-80}
    onClick={onClick}
  >
    <span className="relative z-10">{children}</span>
    <FiArrowRight className="relative z-10" style={{ width: '15px', height: '10px' }} />
  </Link>
)

export default function Navbar({ isMenuOpen, setIsMenuOpen, onAdminLogin, onWaiterLogin }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    document.addEventListener('scroll', handleScroll, { passive: true })
    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { name: 'Home', to: 'home' },
    { name: 'About', to: 'about' },
    { name: 'Menu', to: 'menu' },
    { name: 'Gallery', to: 'gallery' },
    { name: 'Contact', to: 'contact' },
  ]

  // Add the CSS as a style tag in the component
  const buttonStyles = `
    .cta {
      position: relative;
      margin: 0 5px;
      padding: 10px 16px;
      transition: all 0.2s ease;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      text-decoration: none;
      color: #5D4037;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.02em;
      border-radius: 6px;
    }

    .cta:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      display: block;
      border-radius: 50px;
      background: rgba(139, 90, 43, 0.1);
      width: 45px;
      height: 45px;
      transition: all 0.3s ease;
      z-index: 1;
    }

    .cta span {
      position: relative;
      margin-right: 5px;
      z-index: 2;
    }

    .cta svg {
      position: relative;
      top: 0;
      margin-left: 10px;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke: #8B5A2B; /* Match text color */
      stroke-width: 2;
      transform: translateX(-5px);
      transition: all 0.3s ease;
      z-index: 2;
    }

    .cta:hover:before {
      width: 100%;
      background: rgba(139, 90, 43, 0.1);
    }

    .cta:hover svg {
      transform: translateX(0);
    }

    .cta:active {
      transform: scale(0.95);
    }
  `;

  return (
    <>
      <style>{buttonStyles}</style>
      <header
        className={`fixed w-full z-40 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md py-2' : 'bg-white/70 backdrop-blur py-3'
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link
            to="home"
            smooth
            duration={500}
            className="text-2xl font-bold text-primary cursor-pointer"
            offset={-80}
          >
            Brew & Bites
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.name}
              </NavLink>
            ))}
            <div className="h-6 w-px bg-gray-200" />
            <AnimatedButton 
              onClick={onAdminLogin}
              variant="primary"
              className="font-medium"
            >
              Admin Login
            </AnimatedButton>
            <AnimatedButton 
              onClick={onWaiterLogin}
              variant="secondary"
              className="font-medium"
            >
              Staff Login
            </AnimatedButton>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-700 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile panel */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="container mx-auto px-6 py-4 space-y-4">
              {navItems.map((item) => (
                <div key={`mobile-${item.to}`} className="py-2">
                  <NavLink
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className="block"
                  >
                    {item.name}
                  </NavLink>
                </div>
              ))}
              <div className="pt-2 flex items-center gap-3">
                <AnimatedButton 
                  onClick={() => {
                    onAdminLogin?.()
                    setIsMenuOpen(false)
                  }}
                  variant="primary"
                  className="flex-1 font-medium"
                >
                  Admin Login
                </AnimatedButton>
                <AnimatedButton 
                  onClick={() => {
                    onWaiterLogin?.()
                    setIsMenuOpen(false)
                  }}
                  variant="secondary"
                  className="flex-1 font-medium"
                >
                  Staff Login
                </AnimatedButton>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}