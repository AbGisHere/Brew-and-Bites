import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useInView } from '../hooks/useInView'

const pillars = [
  {
    number: '01',
    title: 'THE POUR',
    subtitle: 'Single-Origin Espresso',
    description: 'We source, roast, and dial in every bean ourselves. From a 34-hour cold brew to a 28-second espresso pull — precision is our religion.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M7 4c0 1.5-2 2-2 3.5S7 9 7 10.5" />
        <path d="M12 3c0 1.5-2 2-2 3.5S12 8 12 9.5" />
        <path d="M3 12h18l-2 8a2 2 0 01-2 2H7a2 2 0 01-2-2L3 12z" />
        <path d="M19 14h1.5a1.5 1.5 0 010 3H19" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'THE PLATE',
    subtitle: 'Farm-to-Table Bites',
    description: 'Breakfast done right. Fresh seasonal produce, house-baked bread, and plates worth slowing down for. Food that actually tastes like something.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M3 17h18" />
        <path d="M12 3C7.86 3 4.49 6.15 4.06 10.5H19.94C19.51 6.15 16.14 3 12 3z" />
        <path d="M8 17v3M16 17v3" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'THE SPACE',
    subtitle: 'Your Third Place',
    description: "Designed for lingering. Warm lighting, good acoustics, zero rush. Whether you're on your third coffee or your first meeting — stay as long as you like.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M6 12H4a2 2 0 00-2 2v3a2 2 0 002 2h16a2 2 0 002-2v-3a2 2 0 00-2-2h-2" />
        <path d="M6 12V7a2 2 0 012-2h8a2 2 0 012 2v5" />
        <path d="M7 19v2M17 19v2" />
      </svg>
    ),
  },
]

function TiltCard({ children }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const handleMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    setTilt({
      x: ((e.clientX - left) / width - 0.5) * 18,
      y: ((e.clientY - top) / height - 0.5) * -14,
    })
  }
  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="h-full"
      style={{
        transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: 'transform 0.18s ease',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  )
}

export default function Specialties() {
  const { isDark } = useTheme()
  const [headerRef, headerVisible] = useInView()
  const [cardsRef, cardsVisible] = useInView()

  const sectionBg = isDark
    ? 'linear-gradient(180deg, #0a0605 0%, #0d0806 100%)'
    : 'linear-gradient(180deg, #F5E6D0 0%, #FFF3E8 100%)'
  const cardBg = isDark ? 'rgba(18,10,5,0.85)' : 'rgba(255,248,240,0.88)'
  const cardBorder = isDark ? 'rgba(139,90,43,0.22)' : 'rgba(139,90,43,0.16)'
  const cardShadow = isDark ? '0 8px 48px rgba(0,0,0,0.55)' : '0 8px 32px rgba(139,90,43,0.1)'
  const numColor = isDark ? 'rgba(139,90,43,0.11)' : 'rgba(139,90,43,0.07)'
  const iconColor = isDark ? '#D4A76A' : '#8B5A2B'
  const titleColor = isDark ? '#F5DEB3' : '#1a0805'
  const accentColor = isDark ? '#D4A76A' : '#8B5A2B'
  const bodyColor = isDark ? 'rgba(245,222,179,0.5)' : 'rgba(26,8,5,0.5)'
  const accentLine = isDark ? 'rgba(212,167,106,0.55)' : 'rgba(139,90,43,0.45)'
  const glowBg = isDark
    ? 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,90,43,0.06) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,200,130,0.14) 0%, transparent 70%)'

  const topDivider = isDark
    ? 'linear-gradient(90deg, transparent, rgba(212,167,106,0.22), transparent)'
    : 'linear-gradient(90deg, transparent, rgba(139,90,43,0.16), transparent)'

  return (
    <section className="py-20 relative overflow-hidden" style={{ background: sectionBg, transition: 'background 0.5s ease' }}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: topDivider }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: glowBg }} />
      <div className="container mx-auto px-6 relative z-10">

        {/* Header */}
        <div
          ref={headerRef}
          className={`mb-12 ${headerVisible ? 'anim-fade-up' : 'anim-hidden'}`}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: isDark ? 'linear-gradient(90deg, #D4A76A, transparent)' : 'linear-gradient(90deg, #8B5A2B, transparent)' }} />
            <span className="text-xs tracking-[0.4em] uppercase font-semibold" style={{ color: accentColor }}>
              Why We're Different
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold leading-snug" style={{ color: titleColor }}>
            Three reasons<br />
            <span style={{ color: accentColor }}>to come back.</span>
          </h2>
        </div>

        {/* Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <div
              key={p.number}
              className={cardsVisible ? `anim-fade-up anim-delay-${i + 1}` : 'anim-hidden'}
            >
              <TiltCard>
                <div
                  className="relative rounded-2xl p-8 overflow-hidden h-full"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
                >
                  {/* Ghost number */}
                  <div
                    className="absolute top-4 right-4 font-black select-none leading-none"
                    style={{ fontSize: '6rem', color: numColor, lineHeight: 1 }}
                  >
                    {p.number}
                  </div>

                  {/* Accent line */}
                  <div className="w-8 h-0.5 mb-6 rounded-full" style={{ background: accentLine }} />

                  {/* Icon */}
                  <div className="mb-5" style={{ color: iconColor }}>{p.icon}</div>

                  {/* Subtitle */}
                  <p className="text-xs tracking-[0.18em] uppercase font-semibold mb-2" style={{ color: accentColor }}>
                    {p.subtitle}
                  </p>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-4" style={{ color: titleColor }}>
                    {p.title}
                  </h3>

                  {/* Body */}
                  <p className="text-sm leading-relaxed" style={{ color: bodyColor }}>
                    {p.description}
                  </p>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
