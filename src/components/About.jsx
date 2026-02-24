import { useTheme } from '../context/ThemeContext'
import { useInView } from '../hooks/useInView'

const stats = [
  { value: '9+', label: 'Years Brewing' },
  { value: '50+', label: 'Menu Items' },
  { value: '10K+', label: 'Happy Guests' },
  { value: '4.9★', label: 'Avg. Rating' },
]

export default function About() {
  const { isDark } = useTheme()
  const [textRef, textVisible] = useInView()
  const [imgRef, imgVisible] = useInView()

  const sectionBg = isDark
    ? 'linear-gradient(180deg, #0d0806 0%, #0a0605 100%)'
    : 'linear-gradient(180deg, #FFF8F0 0%, #FFF3E8 100%)'
  const glowBg = isDark
    ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,90,43,0.07) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,200,130,0.18) 0%, transparent 70%)'
  const eyebrowColor = isDark ? '#D4A76A' : '#8B5A2B'
  const eyebrowLine = isDark ? 'linear-gradient(90deg, #D4A76A, transparent)' : 'linear-gradient(90deg, #8B5A2B, transparent)'
  const titleColor = isDark ? '#F5DEB3' : '#1a0805'
  const accentColor = isDark ? '#D4A76A' : '#8B5A2B'
  const bodyText = isDark ? 'rgba(245,222,179,0.55)' : 'rgba(26,8,5,0.55)'
  const pillBg = isDark ? 'rgba(139,90,43,0.15)' : 'rgba(139,90,43,0.08)'
  const pillBorder = isDark ? 'rgba(212,167,106,0.25)' : 'rgba(139,90,43,0.2)'
  const imgBorder = isDark ? 'rgba(139,90,43,0.2)' : 'rgba(139,90,43,0.15)'
  const imgShadow = isDark
    ? '0 0 60px rgba(212,167,106,0.12), 0 20px 60px rgba(0,0,0,0.6)'
    : '0 0 40px rgba(139,90,43,0.12), 0 20px 40px rgba(0,0,0,0.1)'
  const statCardBg = isDark ? 'rgba(12,6,2,0.88)' : 'rgba(255,248,240,0.92)'
  const statCardBorder = isDark ? 'rgba(212,167,106,0.22)' : 'rgba(139,90,43,0.18)'

  return (
    <section
      id="about"
      className="py-28 relative overflow-hidden"
      style={{ background: sectionBg, transition: 'background 0.5s ease' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: glowBg }} />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* Left: Text */}
          <div ref={textRef} className={textVisible ? 'anim-fade-left' : 'anim-hidden'}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-8" style={{ background: eyebrowLine }} />
              <span className="text-xs tracking-[0.4em] uppercase font-semibold" style={{ color: eyebrowColor }}>Our Story</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold mb-6 leading-tight" style={{ color: titleColor }}>
              We didn't open<br />
              a coffee shop.<br />
              <span style={{ color: accentColor }}>We built a place</span><br />
              people actually<br />
              want to be in.
            </h2>

            <p className="text-sm leading-relaxed mb-4" style={{ color: bodyText }}>
              Since 2015, Brew &amp; Bites has been more than a café. It's where regulars have their usual
              tables, where ideas get started over a flat white, and where nobody checks the clock.
            </p>
            <p className="text-sm leading-relaxed mb-8" style={{ color: bodyText }}>
              Every bean is sourced with intention. Every bite is made fresh. Every person who walks
              in is treated like they belong here — because they do.
            </p>

            <div className="flex flex-wrap gap-2">
              {['Fresh Daily', 'Artisan Roasts', 'Cozy Vibes', 'Made with ♥'].map((tag, i) => (
                <span
                  key={tag}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide ${textVisible ? `anim-scale-in anim-delay-${i + 1}` : 'anim-hidden'}`}
                  style={{ background: pillBg, border: `1px solid ${pillBorder}`, color: accentColor }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Image + stats */}
          <div ref={imgRef} className={imgVisible ? 'anim-fade-right' : 'anim-hidden'} style={{ animationDelay: '0.15s' }}>
            <div className="rounded-2xl overflow-hidden relative" style={{ boxShadow: imgShadow, border: `1px solid ${imgBorder}` }}>
              <img
                src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80"
                alt="Barista pouring latte art"
                className="w-full object-cover h-80 md:h-[440px]"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, transparent 55%, rgba(10,6,5,0.5) 100%)' }}
              />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mt-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: statCardBg, border: `1px solid ${statCardBorder}`, backdropFilter: 'blur(12px)' }}
                >
                  <div className="text-lg font-bold mb-0.5" style={{ color: accentColor }}>{stat.value}</div>
                  <div className="text-xs leading-tight" style={{ color: bodyText }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
