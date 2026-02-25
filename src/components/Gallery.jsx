import { useState } from 'react';
import { useTheme } from '../context/ThemeContext'
import { useInView } from '../hooks/useInView'

const galleryImages = [
  { id: 1, src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80', alt: 'Warm café seating with cozy lighting', category: 'ambience' },
  { id: 2, src: 'https://images.unsplash.com/photo-1495474475677-df52a37db44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80', alt: 'Barista crafting the perfect pour', category: 'coffee' },
  { id: 3, src: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80', alt: 'Freshly made breakfast platter', category: 'bites' },
  { id: 4, src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1810&q=80', alt: 'Warm café corner with soft bokeh lighting', category: 'ambience' },
  { id: 5, src: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80', alt: 'Single-origin beans up close', category: 'coffee' },
  { id: 6, src: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1752&q=80', alt: 'House-made pastry & dessert', category: 'bites' },
];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const { isDark } = useTheme()
  const [headerRef, headerVisible] = useInView()
  const [gridRef, gridVisible] = useInView()

  const filteredImages = activeFilter === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeFilter);

  const openModal = (image) => { setSelectedImage(image); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { setSelectedImage(null); document.body.style.overflow = 'unset'; };

  // Theme values
  const sectionBg = isDark
    ? 'linear-gradient(180deg, #0d0806 0%, #0a0605 100%)'
    : 'linear-gradient(180deg, #FFF3E8 0%, #FFF8F0 100%)'
  const glowBg = isDark
    ? 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(139,90,43,0.06) 0%, transparent 70%)'
    : 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(255,200,130,0.15) 0%, transparent 70%)'
  const eyebrowColor = isDark ? '#D4A76A' : '#8B5A2B'
  const eyebrowLineL = isDark ? 'linear-gradient(90deg, transparent, #D4A76A)' : 'linear-gradient(90deg, transparent, #8B5A2B)'
  const eyebrowLineR = isDark ? 'linear-gradient(90deg, #D4A76A, transparent)' : 'linear-gradient(90deg, #8B5A2B, transparent)'
  const titleGradient = isDark ? 'linear-gradient(135deg, #F5DEB3, #D4A76A)' : 'linear-gradient(135deg, #3d1a08, #8B5A2B)'
  const subText = isDark ? 'rgba(245,222,179,0.5)' : 'rgba(42,11,0,0.5)'

  const filterActiveBg = isDark
    ? 'linear-gradient(135deg, #D4A76A, #B9864B)'
    : 'linear-gradient(135deg, #8B5A2B, #693319)'
  const filterActiveColor = isDark ? '#0a0605' : '#FFF8F0'
  const filterActiveGlow = isDark ? '0 0 20px rgba(212,167,106,0.35)' : '0 0 15px rgba(139,90,43,0.2)'
  const filterInactiveBg = isDark ? 'rgba(139, 90, 43, 0.1)' : 'rgba(139, 90, 43, 0.06)'
  const filterInactiveBorder = isDark ? 'rgba(212, 167, 106, 0.2)' : 'rgba(139, 90, 43, 0.2)'
  const filterInactiveColor = isDark ? 'rgba(245, 222, 179, 0.6)' : 'rgba(42, 11, 0, 0.6)'

  const cardBorder = isDark ? 'rgba(139, 90, 43, 0.2)' : 'rgba(139, 90, 43, 0.12)'
  const cardShadow = isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(139,90,43,0.1)'
  const cardGlowBorder = isDark ? 'rgba(212,167,106,0.4)' : 'rgba(139,90,43,0.35)'
  const overlayText = isDark ? '#D4A76A' : '#B9864B'
  const overlaySubText = isDark ? 'rgba(245,222,179,0.8)' : 'rgba(255,248,240,0.9)'
  const overlayGradient = isDark
    ? 'linear-gradient(0deg, rgba(10,6,5,0.85) 0%, transparent 60%)'
    : 'linear-gradient(0deg, rgba(42,11,0,0.75) 0%, transparent 60%)'

  const modalBg = isDark ? 'rgba(5, 2, 1, 0.97)' : 'rgba(20, 8, 0, 0.95)'
  const modalCaptionColor = isDark ? 'rgba(212,167,106,0.6)' : 'rgba(212,167,106,0.7)'

  return (
    <section
      id="gallery"
      className="py-20 relative overflow-hidden"
      style={{ background: sectionBg, transition: 'background 0.5s ease' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: isDark ? 'linear-gradient(90deg, transparent, rgba(212,167,106,0.22), transparent)' : 'linear-gradient(90deg, transparent, rgba(139,90,43,0.16), transparent)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: glowBg }} />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div
          ref={headerRef}
          className={`text-center mb-14 ${headerVisible ? 'anim-fade-up' : 'anim-hidden'}`}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ background: eyebrowLineL }} />
            <span className="text-xs tracking-[0.4em] uppercase font-semibold" style={{ color: eyebrowColor }}>
              Moments & Memories
            </span>
            <div className="h-px w-8" style={{ background: eyebrowLineR }} />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ background: titleGradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            Our Gallery
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: subText }}>
            From latte art to golden-hour corners — a glimpse into life at Brew & Bites
          </p>

          {/* Filters */}
          <div className={`flex flex-wrap justify-center gap-3 mt-8 ${headerVisible ? 'anim-fade-up' : 'anim-hidden'}`} style={{ animationDelay: '0.15s' }}>
            {['all', 'ambience', 'coffee', 'bites'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className="px-5 py-2 rounded-full text-sm font-medium transition-all hover:scale-105"
                style={
                  activeFilter === filter
                    ? { background: filterActiveBg, color: filterActiveColor, boxShadow: filterActiveGlow }
                    : { background: filterInactiveBg, border: `1px solid ${filterInactiveBorder}`, color: filterInactiveColor }
                }
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredImages.map((image, i) => (
            <div
              key={image.id}
              className={`group relative overflow-hidden rounded-xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] ${gridVisible ? `anim-scale-in anim-delay-${Math.min(i + 1, 6)}` : 'anim-hidden'}`}
              style={{ border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
              onClick={() => openModal(image)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div
                className="absolute inset-0 flex items-end justify-start p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: overlayGradient }}
              >
                <div>
                  <span className="text-xs tracking-widest uppercase font-medium" style={{ color: overlayText }}>
                    {image.category}
                  </span>
                  <p className="text-sm font-medium mt-0.5" style={{ color: overlaySubText }}>
                    {image.alt}
                  </p>
                </div>
              </div>
              {/* Glow border on hover */}
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px ${cardGlowBorder}` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: modalBg }}
          onClick={closeModal}
        >
          <div className="relative max-w-4xl w-full anim-scale-in">
            <button
              onClick={(e) => { e.stopPropagation(); closeModal(); }}
              className="absolute -top-12 right-0 transition-colors"
              style={{ color: 'rgba(212,167,106,0.7)' }}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
              style={{ boxShadow: '0 0 60px rgba(212,167,106,0.15)' }}
            />
            <p className="text-center mt-4 text-sm" style={{ color: modalCaptionColor }}>
              {selectedImage.alt}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
