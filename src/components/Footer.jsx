import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Footer({ restaurantName = "Brew & Bites" }) {
  const [settings, setSettings] = useState({});
  const { isDark } = useTheme()

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
              {restaurantName.includes('and') ? (
                <>
                  {restaurantName.split('and')[0].trim()}
                  <span style={{ fontSize: '0.8em', margin: '0 4px', fontStyle: 'italic' }}>&amp;</span>
                  {restaurantName.split('and')[1].trim()}
                </>
              ) : restaurantName}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: brandSubText }}>
              {settings.restaurantDescription || 'Craft coffee, fresh bites, and cozy vibes in the heart of town.'}
            </p>
            <div className="flex justify-center md:justify-start gap-1 pt-1">
              {[
                { url: settings.socialMediaLinks?.facebook, icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z' },
                { url: settings.socialMediaLinks?.twitter, icon: 'M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' },
                { url: settings.socialMediaLinks?.instagram, icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z' },
                { url: settings.socialMediaLinks?.linkedin, icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' }
              ].filter(social => social.url).map((social, i) => (
                <a key={i} href={social.url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: socialBg, border: `1px solid ${socialBorder}`, color: socialColor }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d={social.icon} clipRule="evenodd" />
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
              {(() => {
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
                  const displayTime = uniqueTimes.length === 1 ? uniqueTimes[0] : 
                    uniqueTimes.length > 1 ? `${uniqueTimes[0]} / ${uniqueTimes[1]}` : 
                    settings.restaurantTiming || '7:00 AM – 8:00 PM';

                  return (
                    <li key={label} className="flex justify-between max-w-xs mx-auto text-sm">
                      <span style={{ color: dayText }}>{label}</span>
                      <span style={{ color: hoursText }}>{displayTime}</span>
                    </li>
                  );
                }).filter(Boolean);
              })()}
            </ul>
          </div>

          {/* Location */}
          <div className="space-y-4 text-center md:text-right">
            <h4 className="text-sm font-semibold tracking-[0.15em] uppercase" style={{ color: headingColor }}>
              Location
            </h4>
            <address className="not-italic text-sm leading-relaxed" style={{ color: addressText }}>
              {settings.restaurantAddress ? (
                settings.restaurantAddress.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))
              ) : (
                <>
                  <p>123 Coffee Street</p>
                  <p>Brewtown, CA 90210</p>
                </>
              )}
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col items-center space-y-3" style={{ borderTop: `1px solid ${dividerColor}` }}>
          <p className="text-xs" style={{ color: copyrightText }}>
            © {new Date().getFullYear()} {restaurantName}. All rights reserved.
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
              v{settings.appVersion || '1.7.0'} · Made with{' '}
              <span style={{ color: heartColor }}>♥</span>{' '}
              by <span style={{ color: authorColor }}>AbG</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
