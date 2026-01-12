import React from 'react';

// Card styles for consistent glassmorphism effect across the application
export const cardStyles = {
  // Main card container styles - softer amber
  card: {
    backdropFilter: 'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    background: 'rgba(212, 167, 106, 0.05)', // Reduced from 0.08 to 0.05
    borderRadius: '16px',
    border: '1px solid rgba(212, 167, 106, 0.12)', // Reduced from 0.15 to 0.12
    boxShadow: '0 4px 16px -1px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)', // Reduced from 0.1 to 0.08
    transition: 'all 0.2s ease',
    position: 'relative',
    padding: '24px'
  },
  
  // Card title styles
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#3E2723'
  }
};

// Reusable Section component with glassmorphism styling
export const Section = ({ title, children, className = '' }) => {
  return (
    <section className={`rounded-lg ${className}`} style={cardStyles.card}>
      <h3 style={cardStyles.title}>{title}</h3>
      {children}
    </section>
  )
};

// Export individual styles for custom usage
export { cardStyles as default };
