import { useMemo, useState, useEffect } from 'react';
// REMOVED: import { store } from '../store';
import API_URL from '../config'; // <--- 1. IMPORT THIS
import './MenuFlipCard.css'; // Import flip card styles
import { useTheme } from '../context/ThemeContext'
import { useInView } from '../hooks/useInView'

export default function Menu() {
  const [menu, setMenu] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDark } = useTheme()
  const [headerRef, headerVisible] = useInView()
  const [cardsRef, cardsVisible] = useInView()
  
  // Calculate categories based on the loaded menu data
  const categories = useMemo(() => Object.keys(menu).filter(cat => menu[cat].length > 0), [menu]);
  const [activeCategory, setActiveCategory] = useState('');

  // 1. Fetch data from Server on mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // 2. USE THE API_URL VARIABLE (Note the backticks ` `)
        const response = await fetch(`${API_URL}/api/menu`);
        
        if (!response.ok) throw new Error('Failed to fetch menu');
        
        const data = await response.json();
        
        // 2. Transform the Flat List from Server into Grouped Categories
        const groupedMenu = data.reduce((acc, item) => {
          // Optional: Only show featured items to match previous behavior
          if (item.featured) { 
            const cat = item.category || 'Uncategorized';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
          }
          return acc;
        }, {});

        setMenu(groupedMenu);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading menu:", err);
        setError("Could not load menu. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, []);

  // Update active category if current one becomes empty or on first load
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    } else if (categories.length === 0) {
      setActiveCategory('');
    }
  }, [categories, activeCategory]);

  const sectionBgLoading = isDark
    ? 'linear-gradient(180deg, #0f0806 0%, #0a0605 100%)'
    : 'linear-gradient(180deg, #FFF3E8 0%, #FFF8F0 100%)'

  if (isLoading) {
    return (
      <div className="py-32 text-center" style={{ background: sectionBgLoading }}>
        <div
          className="text-lg font-medium tracking-wide"
          style={{ color: isDark ? 'rgba(212, 167, 106, 0.6)' : 'rgba(139, 90, 43, 0.6)' }}
        >
          Loading delicious items...
        </div>
      </div>
    );
  }

  // Derive theme values here so they're available in all branches
  const sectionBg = isDark
    ? 'linear-gradient(180deg, #0f0806 0%, #0a0605 100%)'
    : 'linear-gradient(180deg, #FFF3E8 0%, #FFF8F0 100%)'
  const glowBg = isDark
    ? 'radial-gradient(ellipse 70% 40% at 50% 30%, rgba(139,90,43,0.07) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 70% 40% at 50% 30%, rgba(255,200,130,0.18) 0%, transparent 70%)'
  const eyebrowColor = isDark ? '#D4A76A' : '#8B5A2B'
  const eyebrowLineL = isDark ? 'linear-gradient(90deg, transparent, #D4A76A)' : 'linear-gradient(90deg, transparent, #8B5A2B)'
  const eyebrowLineR = isDark ? 'linear-gradient(90deg, #D4A76A, transparent)' : 'linear-gradient(90deg, #8B5A2B, transparent)'
  const titleGradient = isDark ? 'linear-gradient(135deg, #F5DEB3, #D4A76A)' : 'linear-gradient(135deg, #3d1a08, #8B5A2B)'
  const subText = isDark ? 'rgba(245,222,179,0.5)' : 'rgba(42,11,0,0.5)'
  const noItemsText = isDark ? 'rgba(245,222,179,0.4)' : 'rgba(42,11,0,0.4)'
  const filterActiveBg = isDark ? 'linear-gradient(135deg, #D4A76A, #B9864B)' : 'linear-gradient(135deg, #8B5A2B, #693319)'
  const filterActiveColor = isDark ? '#0a0605' : '#FFF8F0'
  const filterActiveGlow = isDark ? '0 0 20px rgba(212,167,106,0.35)' : '0 0 15px rgba(139,90,43,0.2)'
  const filterInactiveBg = isDark ? 'rgba(139, 90, 43, 0.1)' : 'rgba(139, 90, 43, 0.06)'
  const filterInactiveBorder = isDark ? 'rgba(212, 167, 106, 0.2)' : 'rgba(139, 90, 43, 0.2)'
  const filterInactiveColor = isDark ? 'rgba(245, 222, 179, 0.6)' : 'rgba(42, 11, 0, 0.6)'
  const backBtnBg = isDark ? 'rgba(139, 90, 43, 0.12)' : 'rgba(139, 90, 43, 0.08)'
  const backBtnBorder = isDark ? 'rgba(212, 167, 106, 0.35)' : 'rgba(139, 90, 43, 0.3)'
  const backBtnColor = isDark ? '#D4A76A' : '#8B5A2B'

  if (error) {
    return (
      <div className="py-32 text-center" style={{ background: sectionBg }}>
        <div style={{ color: 'rgba(255, 100, 100, 0.7)' }}>{error}</div>
      </div>
    );
  }

  return (
    <section
      id="menu"
      className="py-20 relative overflow-hidden"
      style={{ background: sectionBg, transition: 'background 0.5s ease' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: glowBg }} />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center mb-14 ${headerVisible ? 'anim-fade-up' : 'anim-hidden'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: eyebrowLineL }} />
            <span className="text-xs tracking-[0.4em] uppercase font-semibold" style={{ color: eyebrowColor }}>
              Explore
            </span>
            <div className="h-px w-8" style={{ background: eyebrowLineR }} />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ background: titleGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Our Menu
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: subText }}>
            We carefully select the finest ingredients to create delicious and healthy meals for you.
          </p>
        </div>

        {/* Category pills */}
        <div className={`flex flex-wrap justify-center mb-12 gap-3 ${headerVisible ? 'anim-fade-up' : 'anim-hidden'}`} style={{ animationDelay: '0.15s' }}>
          {categories.length > 0 ? (
            categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="px-6 py-2 rounded-full font-medium text-sm transition-all hover:scale-105"
                style={
                  activeCategory === category
                    ? { background: filterActiveBg, color: filterActiveColor, boxShadow: filterActiveGlow }
                    : { background: filterInactiveBg, border: `1px solid ${filterInactiveBorder}`, color: filterInactiveColor }
                }
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))
          ) : (
            <div style={{ color: noItemsText }} className="py-4">
              No featured categories available
            </div>
          )}
        </div>

        {/* Menu Items (flip cards — existing styles preserved) */}
        <div ref={cardsRef} className="menu-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10 px-4 sm:px-0">
          {activeCategory && menu[activeCategory]?.length > 0 ? (
            menu[activeCategory].map((item, index) => (
              <div key={`${activeCategory}-${index}`} className="card horizontal-flip">
                <div className="content">
                  <div className="back">
                    <div className="back-content">
                      {/* Coffee cup with steam — café themed */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="50px" width="50px" fill="none">
                        {/* Steam wisps */}
                        <path d="M7 4C7 5.2 5.5 5.8 5.5 7S7 8.8 7 10" stroke="#D4A76A" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                        <path d="M12 3C12 4.4 10.5 5 10.5 6.5S12 8.5 12 10" stroke="#D4A76A" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                        <path d="M17 4C17 5.2 15.5 5.8 15.5 7S17 8.8 17 10" stroke="#D4A76A" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
                        {/* Cup body */}
                        <path d="M3 11h18l-1.5 8a2 2 0 01-2 1.5H6.5a2 2 0 01-2-1.5L3 11z" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
                        {/* Handle */}
                        <path d="M19 13.5h1.5a1.5 1.5 0 010 3H19" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
                        {/* Saucer */}
                        <path d="M2 21.5h20" stroke="#D4A76A" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                      <strong>{item.name}</strong>
                    </div>
                  </div>
                  <div className="front">
                    <div className="img">
                      <div className="circle"></div>
                      <div className="circle" id="right"></div>
                      <div className="circle" id="bottom"></div>
                    </div>
                    <div className="front-content">
                      <small className="badge">{item.category || 'Special'}</small>
                      <div className="description">
                        <div className="title">
                          <p className="title">
                            <strong>{item.name}</strong>
                          </p>
                          <svg fillRule="nonzero" height="15px" width="15px" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                            <g style={{ mixBlendMode: 'normal' }} textAnchor="none" fontSize="none" fontWeight="none" fontFamily="none" strokeDashoffset="0" strokeDasharray="" strokeMiterlimit="10" strokeLinejoin="miter" strokeLinecap="butt" strokeWidth="1" stroke="none" fillRule="nonzero" fill="#20c997">
                              <g transform="scale(8,8)">
                                <path d="M25,27l-9,-6.75l-9,6.75v-23h18z"></path>
                              </g>
                            </g>
                          </svg>
                        </div>
                        <p className="card-footer">
                          {item.description || 'Delicious dish'} &nbsp; | &nbsp; ₹{Number(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8" style={{ color: noItemsText }}>
              No featured dishes in this category. Please check back later.
            </div>
          )}
        </div>

        <div className={`text-center mt-16 ${cardsVisible ? 'anim-fade-up' : 'anim-hidden'}`}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="font-semibold py-3 px-10 rounded-full transition-all hover:scale-105"
            style={{
              background: backBtnBg,
              border: `1px solid ${backBtnBorder}`,
              color: backBtnColor,
            }}
          >
            Back to Top
          </button>
        </div>
      </div>
    </section>
  );
}