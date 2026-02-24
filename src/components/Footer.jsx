import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext'

export default function Footer() {
  const [version, setVersion] = useState('1.7.0');
  const { isDark } = useTheme()

  useEffect(() => {
    setVersion('1.7.0');
  }, []);

  const footerBg = isDark
    ? 'linear-gradient(180deg, #0a0605 0%, #050302 100%)'
    : 'linear-gradient(180deg, #FFF8F0 0%, #F5E6D0 100%)'
  const topBorderGlow = isDark
    ? 'linear-gradient(90deg, transparent, rgba(212,167,106,0.4), transparent)'
    : 'linear-gradient(90deg, transparent, rgba(139,90,43,0.3), transparent)'
  const ambience = isDark
    ? 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,90,43,0.06) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,200,130,0.15) 0%, transparent 70%)'
  const brandGradient = isDark
    ? 'linear-gradient(135deg, #F5DEB3, #D4A76A)'
    : 'linear-gradient(135deg, #3d1a08, #8B5A2B)'
  const brandSubText = isDark ? 'rgba(245,222,179,0.45)' : 'rgba(42,11,0,0.5)'
  const headingColor = isDark ? '#D4A76A' : '#8B5A2B'
  const dayText = isDark ? 'rgba(245,222,179,0.45)' : 'rgba(42,11,0,0.5)'
  const hoursText = isDark ? 'rgba(245,222,179,0.75)' : 'rgba(42,11,0,0.75)'
  const addressText = isDark ? 'rgba(245,222,179,0.6)' : 'rgba(42,11,0,0.6)'
  const dividerColor = isDark ? 'rgba(139,90,43,0.2)' : 'rgba(139,90,43,0.15)'
  const copyrightText = isDark ? 'rgba(245,222,179,0.3)' : 'rgba(42,11,0,0.35)'
  const githubColor = isDark ? 'rgba(212,167,106,0.5)' : 'rgba(139,90,43,0.5)'
  const dotColor = isDark ? 'rgba(212,167,106,0.2)' : 'rgba(139,90,43,0.2)'
  const versionText = isDark ? 'rgba(245,222,179,0.3)' : 'rgba(42,11,0,0.35)'
  const heartColor = isDark ? 'rgba(212,167,106,0.6)' : 'rgba(139,90,43,0.6)'
  const authorColor = isDark ? 'rgba(245,222,179,0.5)' : 'rgba(42,11,0,0.5)'
  const socialBg = isDark ? 'rgba(139,90,43,0.15)' : 'rgba(139,90,43,0.08)'
  const socialBorder = isDark ? 'rgba(212,167,106,0.2)' : 'rgba(139,90,43,0.15)'
  const socialColor = isDark ? 'rgba(212,167,106,0.6)' : 'rgba(139,90,43,0.6)'

  return (
    <footer
      className="relative overflow-hidden py-14 px-4"
      style={{ background: footerBg, transition: 'background 0.5s ease' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: topBorderGlow }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: ambience }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4 text-center md:text-left">
            <h3
              className="text-2xl font-bold"
              style={{ background: brandGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Brew &amp; Bites
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: brandSubText }}>
              Craft coffee, fresh bites, and cozy vibes in the heart of town.
            </p>
            <div className="flex justify-center md:justify-start gap-1 pt-1">
              {['#', '#', '#'].map((href, i) => (
                <a key={i} href={href}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: socialBg, border: `1px solid ${socialBorder}`, color: socialColor }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="space-y-4 text-center">
            <h4 className="text-sm font-semibold tracking-[0.15em] uppercase" style={{ color: headingColor }}>
              Hours
            </h4>
            <ul className="space-y-2.5">
              {[{ days: 'Mon – Fri', hours: '7:00 AM – 8:00 PM' }, { days: 'Sat – Sun', hours: '8:00 AM – 9:00 PM' }].map(({ days, hours }) => (
                <li key={days} className="flex justify-between max-w-xs mx-auto text-sm">
                  <span style={{ color: dayText }}>{days}</span>
                  <span style={{ color: hoursText }}>{hours}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Location */}
          <div className="space-y-4 text-center md:text-right">
            <h4 className="text-sm font-semibold tracking-[0.15em] uppercase" style={{ color: headingColor }}>
              Location
            </h4>
            <address className="not-italic text-sm leading-relaxed" style={{ color: addressText }}>
              <p>123 Coffee Street</p>
              <p>Brewtown, CA 90210</p>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col items-center space-y-3" style={{ borderTop: `1px solid ${dividerColor}` }}>
          <p className="text-xs" style={{ color: copyrightText }}>
            © {new Date().getFullYear()} Brew &amp; Bites. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/AbGisHere/Brew-and-Bites"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-all hover:scale-110"
              style={{ color: githubColor }}
              aria-label="GitHub Repository"
            >
              <svg strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" stroke="currentColor" fill="none" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
            </a>
            <span style={{ color: dotColor }}>•</span>
            <span className="text-xs" style={{ color: versionText }}>
              v{version} · Made with{' '}
              <span style={{ color: heartColor }}>♥</span>{' '}
              by <span style={{ color: authorColor }}>AbG</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
