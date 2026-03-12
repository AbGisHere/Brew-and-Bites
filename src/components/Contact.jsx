import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useInView } from '../hooks/useInView'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', date: '', time: '', guests: '2', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState({})
  const { isDark } = useTheme()
  const [headerRef, headerVisible] = useInView()
  const [formRef, formVisible] = useInView()
  const [infoRef, infoVisible] = useInView()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const restId = localStorage.getItem('defaultRestaurantId');
        const response = await fetch(`${API_URL}/api/settings`, {
          headers: { 'x-restaurant-id': restId || '' }
        });
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      setFormData({ name: '', email: '', date: '', time: '', guests: '2', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    }, 1500)
  }

  // Theme
  const sectionBg = isDark
    ? 'linear-gradient(180deg, #0a0605 0%, #0f0806 100%)'
    : 'linear-gradient(180deg, #FFF8F0 0%, #FFF3E8 100%)'
  const glowBg = isDark
    ? 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(139,90,43,0.08) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,200,130,0.18) 0%, transparent 70%)'
  const eyebrowColor = isDark ? '#D4A76A' : '#8B5A2B'
  const eyebrowLineL = isDark ? 'linear-gradient(90deg, transparent, #D4A76A)' : 'linear-gradient(90deg, transparent, #8B5A2B)'
  const eyebrowLineR = isDark ? 'linear-gradient(90deg, #D4A76A, transparent)' : 'linear-gradient(90deg, #8B5A2B, transparent)'
  const titleGrad = isDark ? 'linear-gradient(135deg, #F5DEB3, #D4A76A)' : 'linear-gradient(135deg, #3d1a08, #8B5A2B)'
  const subText = isDark ? 'rgba(245,222,179,0.5)' : 'rgba(42,11,0,0.5)'
  const cardBg = isDark ? 'rgba(20,10,5,0.7)' : 'rgba(255,248,240,0.85)'
  const cardBorder = isDark ? 'rgba(139,90,43,0.25)' : 'rgba(139,90,43,0.18)'
  const cardShadow = isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(139,90,43,0.1)'
  const cardTitleColor = isDark ? 'rgba(245,222,179,0.9)' : 'rgba(42,11,0,0.88)'
  const successBg = isDark ? 'rgba(139,90,43,0.2)' : 'rgba(139,90,43,0.1)'
  const successBorder = isDark ? 'rgba(212,167,106,0.4)' : 'rgba(139,90,43,0.3)'
  const successColor = isDark ? '#D4A76A' : '#8B5A2B'
  const fieldBg = isDark ? 'rgba(139,90,43,0.08)' : 'rgba(255,248,240,0.8)'
  const fieldBorder = isDark ? 'rgba(212,167,106,0.2)' : 'rgba(139,90,43,0.25)'
  const fieldFocusBorder = isDark ? 'rgba(212,167,106,0.5)' : 'rgba(139,90,43,0.5)'
  const fieldColor = isDark ? 'rgba(245,222,179,0.85)' : 'rgba(42,11,0,0.85)'
  const labelColor = isDark ? 'rgba(212,167,106,0.7)' : 'rgba(139,90,43,0.7)'
  const submitBg = isDark
    ? 'linear-gradient(135deg, #D4A76A 0%, #B9864B 60%, #8B5A2B 100%)'
    : 'linear-gradient(135deg, #8B5A2B 0%, #693319 60%, #B9864B 100%)'
  const submitColor = isDark ? '#0a0605' : '#FFF8F0'
  const submitGlow = isDark ? '0 0 25px rgba(212,167,106,0.2)' : '0 0 15px rgba(139,90,43,0.15)'
  const iconBg = isDark ? 'rgba(139,90,43,0.18)' : 'rgba(139,90,43,0.1)'
  const iconBorder = isDark ? 'rgba(212,167,106,0.2)' : 'rgba(139,90,43,0.15)'
  const iconColor = isDark ? '#D4A76A' : '#8B5A2B'
  const infoTitleColor = isDark ? 'rgba(245,222,179,0.85)' : 'rgba(42,11,0,0.85)'
  const infoTextColor = isDark ? 'rgba(245,222,179,0.45)' : 'rgba(42,11,0,0.5)'
  const dividerColor = isDark ? 'rgba(139,90,43,0.15)' : 'rgba(139,90,43,0.12)'

  const glassCard = {
    background: cardBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${cardBorder}`,
    boxShadow: cardShadow,
  }
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '600',
    letterSpacing: '0.07em', color: labelColor, marginBottom: '6px', textTransform: 'uppercase',
  }
  const fieldStyle = {
    background: fieldBg, border: `1px solid ${fieldBorder}`, borderRadius: '10px',
    color: fieldColor, outline: 'none', transition: 'border 0.2s ease', width: '100%',
    padding: '10px 14px', fontSize: '14px',
  }

  const infoItems = [
    {
      title: 'Opening Hours',
      lines: (() => {
        const timings = settings.detailedTimings || {};
        const days = [
          { key: 'monday', label: 'Mon – Fri', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
          { key: 'weekend', label: 'Sat – Sun', days: ['saturday', 'sunday'] }
        ];

        return days.map(({ label, days: dayGroup }) => {
          const isOpen = dayGroup.some(day => !timings[day]?.closed);
          if (!isOpen) return null;

          const openTimes = dayGroup
            .filter(day => !timings[day]?.closed)
            .map(day => `${timings[day]?.open || '09:00'} - ${timings[day]?.close || '22:00'}`);

          const uniqueTimes = [...new Set(openTimes)];
          return uniqueTimes.length === 1 ? `${label}: ${uniqueTimes[0]}` : 
            uniqueTimes.length > 1 ? `${label}: ${uniqueTimes[0]} / ${uniqueTimes[1]}` : 
            `${label}: ${settings.restaurantTiming || '7:00 AM – 8:00 PM'}`;
        }).filter(Boolean);
      })(),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      title: 'Our Location',
      lines: settings.restaurantAddress ? 
        settings.restaurantAddress.split('\n') : 
        ['123 Coffee Street', 'Brewtown, CA 90210'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: 'Phone',
      lines: [settings.contactNumber || '+91 99999 99999'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      title: 'Email',
      lines: [settings.email || 'hello@brewandbites.com'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="contact" className="py-20 relative overflow-hidden" style={{ background: sectionBg, transition: 'background 0.5s ease' }}>
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: isDark ? 'linear-gradient(90deg, transparent, rgba(212,167,106,0.22), transparent)' : 'linear-gradient(90deg, transparent, rgba(139,90,43,0.16), transparent)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: glowBg }} />
      <div className="container mx-auto px-6 relative z-10">

        {/* Header */}
        <div ref={headerRef} className={`text-center mb-14 ${headerVisible ? 'anim-fade-up' : 'anim-hidden'}`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: eyebrowLineL }} />
            <span className="text-xs tracking-[0.4em] uppercase font-semibold" style={{ color: eyebrowColor }}>Come Find Us</span>
            <div className="h-px w-8" style={{ background: eyebrowLineR }} />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ background: titleGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Reserve a Table
          </h2>
          <p className="max-w-md mx-auto" style={{ color: subText }}>
            Book ahead or just drop us a line. We're always happy to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Form */}
          <div ref={formRef} className={`rounded-2xl p-8 ${formVisible ? 'anim-fade-left' : 'anim-hidden'}`} style={glassCard}>
            <h3 className="text-xl font-semibold mb-6" style={{ color: cardTitleColor }}>Make a Reservation</h3>

            {submitted && (
              <div className="mb-6 p-4 rounded-xl text-sm font-medium" style={{ background: successBg, border: `1px solid ${successBorder}`, color: successColor }}>
                ✓ Reservation request received — we'll confirm shortly!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} style={fieldStyle} required
                    onFocus={e => (e.target.style.border = `1px solid ${fieldFocusBorder}`)}
                    onBlur={e => (e.target.style.border = `1px solid ${fieldBorder}`)} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} style={fieldStyle} required
                    onFocus={e => (e.target.style.border = `1px solid ${fieldFocusBorder}`)}
                    onBlur={e => (e.target.style.border = `1px solid ${fieldBorder}`)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange}
                    style={{ ...fieldStyle, colorScheme: isDark ? 'dark' : 'light' }}
                    onFocus={e => (e.target.style.border = `1px solid ${fieldFocusBorder}`)}
                    onBlur={e => (e.target.style.border = `1px solid ${fieldBorder}`)} />
                </div>
                <div>
                  <label style={labelStyle}>Time</label>
                  <input type="time" name="time" value={formData.time} onChange={handleChange}
                    style={{ ...fieldStyle, colorScheme: isDark ? 'dark' : 'light' }}
                    onFocus={e => (e.target.style.border = `1px solid ${fieldFocusBorder}`)}
                    onBlur={e => (e.target.style.border = `1px solid ${fieldBorder}`)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Guests</label>
                <select name="guests" value={formData.guests} onChange={handleChange}
                  style={{ ...fieldStyle, height: '42px', appearance: 'none', cursor: 'pointer' }}
                  onFocus={e => (e.target.style.border = `1px solid ${fieldFocusBorder}`)}
                  onBlur={e => (e.target.style.border = `1px solid ${fieldBorder}`)}>
                  {[1, 2, 3, 4, 5, '6+'].map(n => (
                    <option key={n} value={n} style={{ background: isDark ? '#0f0806' : '#FFF8F0' }}>
                      {n} {n === 1 ? 'person' : 'people'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea name="message" rows="3" value={formData.message} onChange={handleChange}
                  placeholder="Any special requests or dietary needs?"
                  style={{ ...fieldStyle, resize: 'none', minHeight: '88px' }}
                  onFocus={e => (e.target.style.border = `1px solid ${fieldFocusBorder}`)}
                  onBlur={e => (e.target.style.border = `1px solid ${fieldBorder}`)} />
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
                style={{
                  background: isSubmitting ? (isDark ? 'rgba(139,90,43,0.5)' : 'rgba(139,90,43,0.4)') : submitBg,
                  color: submitColor,
                  boxShadow: submitGlow,
                }}>
                {isSubmitting ? 'Sending...' : 'Request Reservation'}
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div ref={infoRef} className={`rounded-2xl p-8 flex flex-col ${infoVisible ? 'anim-fade-right' : 'anim-hidden'}`} style={{ ...glassCard, animationDelay: '0.1s' }}>
            <h3 className="text-xl font-semibold mb-7" style={{ color: cardTitleColor }}>Visit Us</h3>

            <div className="space-y-5 flex-1">
              {infoItems.map((item, i) => (
                <div key={item.title}>
                  {i > 0 && <div className="h-px mb-5" style={{ background: dividerColor }} />}
                  <div className={`flex items-start gap-4 ${infoVisible ? `anim-fade-up anim-delay-${i + 1}` : 'anim-hidden'}`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: iconBg, border: `1px solid ${iconBorder}`, color: iconColor }}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1" style={{ color: infoTitleColor }}>{item.title}</h4>
                      {item.lines.map((line, j) => (
                        <p key={j} className="text-sm" style={{ color: infoTextColor }}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom note */}
            <div className="mt-8 p-4 rounded-xl" style={{ background: isDark ? 'rgba(139,90,43,0.08)' : 'rgba(139,90,43,0.06)', border: `1px solid ${isDark ? 'rgba(212,167,106,0.12)' : 'rgba(139,90,43,0.12)'}` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: eyebrowColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Good to know</p>
              <p className="text-sm" style={{ color: infoTextColor }}>
                Walk-ins are always welcome. Reservations are recommended for weekends and groups of 4+. Free parking in front and behind the building.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
