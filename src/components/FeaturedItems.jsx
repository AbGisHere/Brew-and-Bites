import { useState, useEffect } from 'react'
import API_URL from '../config'
import { useTheme } from '../context/ThemeContext'
import { useInView } from '../hooks/useInView'

// Curated café images per category (Unsplash)
const CATEGORY_IMAGES = {
  coffee:    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-4.0.3',
  espresso:  'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-4.0.3',
  brews:     'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-4.0.3',
  drinks:    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-4.0.3',
  breakfast: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3',
  bites:     'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3',
  food:      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3',
  pastry:    'https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-4.0.3',
  pastries:  'https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-4.0.3',
  dessert:   'https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-4.0.3',
  desserts:  'https://images.unsplash.com/photo-1505252585461-04db1eb84625?ixlib=rb-4.0.3',
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3'

function getCategoryImage(category = '') {
  return CATEGORY_IMAGES[category.toLowerCase()] ?? DEFAULT_IMAGE
}

export default function FeaturedItems() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { isDark } = useTheme()
  const [headerRef, headerVisible] = useInView()
  const [gridRef, gridVisible] = useInView()

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_URL}/api/menu`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setItems(data.filter(item => item.featured).slice(0, 6))
      } catch {
        setItems([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const sectionBg = isDark
    ? 'linear-gradient(180deg, #0d0806 0%, #0a0605 100%)'
    : 'linear-gradient(180deg, #FFF3E8 0%, #FFF8F0 100%)'
  const glowBg = isDark
    ? 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(139,90,43,0.06) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(255,200,130,0.14) 0%, transparent 70%)'
  const eyebrowColor = isDark ? '#D4A76A' : '#8B5A2B'
  const eyebrowLine  = isDark
    ? 'linear-gradient(90deg, transparent, #D4A76A)'
    : 'linear-gradient(90deg, transparent, #8B5A2B)'
  const eyebrowLineR = isDark
    ? 'linear-gradient(90deg, #D4A76A, transparent)'
    : 'linear-gradient(90deg, #8B5A2B, transparent)'
  const titleGradient = isDark
    ? 'linear-gradient(135deg, #F5DEB3, #D4A76A)'
    : 'linear-gradient(135deg, #3d1a08, #8B5A2B)'
  const subText   = isDark ? 'rgba(245,222,179,0.5)' : 'rgba(42,11,0,0.5)'
  const cardBg    = isDark ? 'rgba(18,8,4,0.92)' : 'rgba(255,252,248,0.95)'
  const cardBorder = isDark ? 'rgba(139,90,43,0.22)' : 'rgba(139,90,43,0.14)'
  const cardShadow = isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 24px rgba(139,90,43,0.1)'
  const badgeBg   = isDark ? 'rgba(212,167,106,0.14)' : 'rgba(139,90,43,0.08)'
  const badgeColor = isDark ? '#D4A76A' : '#8B5A2B'
  const nameColor  = isDark ? '#F5DEB3' : '#1a0805'
  const descColor  = isDark ? 'rgba(245,222,179,0.5)' : 'rgba(42,11,0,0.5)'
  const priceColor = isDark ? '#D4A76A' : '#8B5A2B'
  const dividerColor = isDark ? 'rgba(139,90,43,0.2)' : 'rgba(139,90,43,0.12)'

  if (isLoading) {
    return (
      <section className="py-20 relative" style={{ background: sectionBg }}>
        <div className="text-center py-16" style={{ color: isDark ? 'rgba(212,167,106,0.4)' : 'rgba(139,90,43,0.4)' }}>
          <div className="text-sm tracking-widest uppercase">Loading signatures...</div>
        </div>
      </section>
    )
  }

  if (!items.length) return null

  return (
    <section className="py-20 relative overflow-hidden" style={{ background: sectionBg, transition: 'background 0.5s ease' }}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: isDark ? 'linear-gradient(90deg, transparent, rgba(212,167,106,0.22), transparent)' : 'linear-gradient(90deg, transparent, rgba(139,90,43,0.16), transparent)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: glowBg }} />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center mb-16 ${headerVisible ? 'anim-fade-up' : 'anim-hidden'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: eyebrowLine }} />
            <span className="text-xs tracking-[0.4em] uppercase font-semibold" style={{ color: eyebrowColor }}>
              From Our Kitchen
            </span>
            <div className="h-px w-8" style={{ background: eyebrowLineR }} />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ background: titleGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Signatures
          </h2>
          <p className="max-w-md mx-auto text-sm" style={{ color: subText }}>
            The drinks and dishes our regulars keep coming back for — made fresh, every single day.
          </p>
        </div>

        {/* Cards grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item, i) => (
            <div
              key={item._id ?? item.id ?? i}
              className={`group rounded-2xl overflow-hidden transition-transform duration-300 hover:scale-[1.02] hover:-translate-y-1 ${gridVisible ? `anim-scale-in anim-delay-${Math.min(i + 1, 6)}` : 'anim-hidden'}`}
              style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
            >
              {/* Image */}
              <div className="relative overflow-hidden h-48">
                <img
                  src={getCategoryImage(item.category)}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{ background: isDark
                    ? 'linear-gradient(0deg, rgba(18,8,4,0.65) 0%, transparent 55%)'
                    : 'linear-gradient(0deg, rgba(255,252,248,0.5) 0%, transparent 55%)' }}
                />
                {/* Category badge */}
                <span
                  className="absolute top-3 left-3 text-xs font-semibold tracking-[0.15em] uppercase px-3 py-1 rounded-full"
                  style={{ background: badgeBg, color: badgeColor, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: `1px solid ${cardBorder}` }}
                >
                  {item.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-base mb-1.5 leading-snug" style={{ color: nameColor }}>
                  {item.name}
                </h3>
                {item.description && (
                  <p
                    className="text-xs leading-relaxed mb-4 line-clamp-2"
                    style={{ color: descColor }}
                  >
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${dividerColor}` }}>
                  <span className="font-bold text-base" style={{ color: priceColor }}>
                    ₹{Number(item.price).toFixed(0)}
                  </span>
                  <span className="text-xs tracking-widest uppercase" style={{ color: isDark ? 'rgba(212,167,106,0.35)' : 'rgba(139,90,43,0.4)' }}>
                    Featured
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
