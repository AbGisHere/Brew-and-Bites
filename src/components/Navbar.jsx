import { useState, useEffect } from 'react'
import { FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi'
import { Link } from 'react-scroll'
import { useTheme } from '../context/ThemeContext'

export default function Navbar({ isMenuOpen, setIsMenuOpen, onAdminLogin, onWaiterLogin, restaurantName = "Brew & Bites" }) {
  const [scrolled, setScrolled] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
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

  // Theme-aware colors
  const linkColor = isDark ? 'rgba(245, 222, 179, 0.7)' : 'rgba(42, 11, 0, 0.65)'
  const linkHoverColor = isDark ? '#D4A76A' : '#8B5A2B'
  const logoGradient = isDark
    ? 'linear-gradient(135deg, #F5DEB3 0%, #D4A76A 50%, #FF8C42 100%)'
    : 'linear-gradient(135deg, #3d1a08 0%, #8B5A2B 50%, #B9864B 100%)'
  const logoGlow = isDark ? 'drop-shadow(0 0 12px rgba(212,167,106,0.4))' : 'none'

  const headerBgScrolled = isDark
    ? 'rgba(8, 4, 2, 0.92)'
    : 'rgba(255, 248, 240, 0.96)'
  const headerBorderScrolled = isDark
    ? 'rgba(139, 90, 43, 0.25)'
    : 'rgba(139, 90, 43, 0.18)'

  const mobileMenuBg = isDark
    ? 'rgba(8, 4, 2, 0.97)'
    : 'rgba(255, 248, 240, 0.98)'
  const mobileMenuBorder = isDark
    ? 'rgba(139, 90, 43, 0.2)'
    : 'rgba(139, 90, 43, 0.15)'

  const hamburgerColor = isDark ? '#D4A76A' : '#8B5A2B'
  const dividerColor = isDark ? 'rgba(139, 90, 43, 0.4)' : 'rgba(139, 90, 43, 0.25)'

  const primaryBtnBg = isDark
    ? 'linear-gradient(135deg, #D4A76A 0%, #B9864B 60%, #8B5A2B 100%)'
    : 'linear-gradient(135deg, #8B5A2B 0%, #693319 60%, #B9864B 100%)'
  const primaryBtnColor = isDark ? '#0a0605' : '#FFF8F0'
  const primaryBtnGlow = isDark ? '0 0 18px rgba(212,167,106,0.25)' : '0 0 12px rgba(139,90,43,0.2)'

  const staffBtnBg = isDark ? 'rgba(139, 90, 43, 0.12)' : 'rgba(139, 90, 43, 0.08)'
  const staffBtnBorder = isDark ? 'rgba(212, 167, 106, 0.35)' : 'rgba(139, 90, 43, 0.3)'
  const staffBtnColor = isDark ? '#D4A76A' : '#8B5A2B'

  const themeBtnColor = isDark ? 'rgba(212,167,106,0.7)' : 'rgba(139,90,43,0.7)'
  const themeBtnHoverBg = isDark ? 'rgba(212,167,106,0.1)' : 'rgba(139,90,43,0.1)'

  const headerStyle = scrolled
    ? {
      background: headerBgScrolled,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: `1px solid ${headerBorderScrolled}`,
      padding: '10px 0',
    }
    : {
      background: 'transparent',
      padding: '18px 0',
    }

  return (
    <header
      className="fixed w-full z-40 transition-all duration-400 overflow-x-hidden"
      style={headerStyle}
    >
      <div className="w-full max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="home"
          smooth
          duration={500}
          offset={-80}
          className="cursor-pointer text-2xl font-bold tracking-tight select-none"
          style={{
            background: logoGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: logoGlow,
          }}
        >
          {restaurantName.includes('and') ? (
            <>
              {restaurantName.split('and')[0].trim()}
              <span style={{ fontSize: '0.8em', margin: '0 4px', fontStyle: 'italic' }}>&amp;</span>
              {restaurantName.split('and')[1].trim()}
            </>
          ) : restaurantName}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              smooth
              duration={500}
              spy
              offset={-80}
              className="relative cursor-pointer px-4 py-2 text-sm font-medium rounded-md transition-colors hover:opacity-100"
              style={{ color: linkColor }}
              activeStyle={{ color: linkHoverColor }}
            >
              {item.name}
            </Link>
          ))}

          <div className="h-5 w-px mx-1" style={{ background: dividerColor }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ color: themeBtnColor, background: themeBtnHoverBg }}
            aria-label="Toggle theme"
          >
            {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>

          <div className="h-5 w-px mx-1" style={{ background: dividerColor }} />

          <button
            onClick={onAdminLogin}
            className="px-5 py-2 text-sm font-semibold rounded-full transition-all hover:scale-105 hover:shadow-lg"
            style={{
              background: primaryBtnBg,
              color: primaryBtnColor,
              boxShadow: primaryBtnGlow,
            }}
          >
            Admin Login
          </button>
          <button
            onClick={onWaiterLogin}
            className="px-5 py-2 text-sm font-semibold rounded-full transition-all hover:scale-105"
            style={{
              background: staffBtnBg,
              border: `1px solid ${staffBtnBorder}`,
              color: staffBtnColor,
              backdropFilter: 'blur(8px)',
            }}
          >
            Staff Login
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
            style={{ color: themeBtnColor, background: themeBtnHoverBg }}
            aria-label="Toggle theme"
          >
            {isDark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
          </button>
          <button
            className="focus:outline-none transition-colors p-1.5 rounded"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            style={{ color: hamburgerColor }}
          >
            {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {isMenuOpen && (
        <div
          className="md:hidden"
          style={{
            background: mobileMenuBg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTop: `1px solid ${mobileMenuBorder}`,
          }}
        >
          <div className="px-6 py-5 space-y-1">
            {navItems.map((item) => (
              <div key={`m-${item.to}`}>
                <Link
                  to={item.to}
                  smooth
                  duration={500}
                  offset={-80}
                  onClick={() => setIsMenuOpen(false)}
                  className="block cursor-pointer px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                  style={{ color: linkColor }}
                >
                  {item.name}
                </Link>
              </div>
            ))}
            <div className="pt-4 flex gap-3">
              <button
                onClick={() => { onAdminLogin?.(); setIsMenuOpen(false) }}
                className="flex-1 py-3 text-sm font-semibold rounded-full transition-all"
                style={{ background: primaryBtnBg, color: primaryBtnColor }}
              >
                Admin Login
              </button>
              <button
                onClick={() => { onWaiterLogin?.(); setIsMenuOpen(false) }}
                className="flex-1 py-3 text-sm font-semibold rounded-full transition-all"
                style={{
                  background: staffBtnBg,
                  border: `1px solid ${staffBtnBorder}`,
                  color: staffBtnColor,
                }}
              >
                Staff Login
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
