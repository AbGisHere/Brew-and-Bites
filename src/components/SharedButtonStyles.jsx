import React from 'react'

// Exact button styles from WaiterDashboard
export const animatedButtonStyles = {
  // Main animated button style
  button: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: '2px solid',
    borderColor: 'transparent',
    fontWeight: '500',
    backgroundColor: 'transparent',
    borderRadius: '100px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
    fontSize: '14px'
  },

  // Menu item style
  menuItem: {
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    background: 'rgba(212, 167, 106, 0.25)',
    borderRadius: '22px',
    border: '1px solid rgba(212, 167, 106, 0.2)',
    boxShadow: '0 4px 24px -1px rgba(212, 167, 106, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(212, 167, 106, 0.15)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    color: '#3E2723'
  },

  // Hover styles for menu items
  hoverStyles: `
    .menu-item:hover {
      background: rgba(212, 167, 106, 0.15) !important;
      transform: scale(0.98) !important;
      box-shadow: '0 6px 32px -2px rgba(212, 167, 106, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(212, 167, 106, 0.1)' !important;
      border: '1px solid rgba(212, 167, 106, 0.3)' !important;
    }
    
    .menu-item:active {
      background: rgba(212, 167, 106, 0.2) !important;
      transform: scale(0.96) !important;
      border: '2px solid rgba(212, 167, 106, 0.5)' !important;
      outline: 'none' !important;
      box-shadow: '0 4px 20px -2px rgba(212, 167, 106, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(212, 167, 106, 0.15)' !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .menu-item:focus {
      outline: 'none' !important;
      border: '1px solid rgba(212, 167, 106, 0.3)' !important;
    }
    
    .menu-item:hover span,
    .menu-item:hover div {
      color: #3E2723 !important;
    }
    
    .menu-item:hover .text-primary {
      color: #D4A76A !important;
    }
  `
}

// Color schemes from WaiterDashboard
export const colors = {
  primary: '#D4A76A',
  primaryDark: '#3E2723',
  brown: '#8B5A2B',
  brownDark: '#5D4037'
}

// Animated Button Component
export const AnimatedButton = ({ 
  children, 
  onClick, 
  color = colors.primary, 
  hoverColor = colors.primaryDark,
  padding = '8px 20px',
  minWidth = '120px',
  height = '40px',
  className = '',
  ...props 
}) => {
  const buttonStyle = {
    ...animatedButtonStyles.button,
    '--color': color,
    '--hover-color': hoverColor,
    padding,
    minWidth,
    height,
    color,
    boxShadow: `0 0 0 2px ${color}`,
    ...props.style
  }

  return (
    <>
      <style>{animatedButtonStyles.hoverStyles}</style>
      <button
        className={`animated-button group relative inline-flex items-center justify-center flex-shrink-0 ${className}`}
        onClick={onClick}
        style={buttonStyle}
        {...props}
      >
        <svg 
          viewBox="0 0 24 24" 
          className="arr-2" 
          style={{ 
            position: 'absolute', 
            width: '16px', 
            height: '16px', 
            left: '-25%', 
            fill: color, 
            zIndex: 9, 
            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' 
          }}
        >
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
        </svg>
        <span 
          className="text" 
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            transform: 'translateX(-12px)', 
            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' 
          }}
        >
          {children}
        </span>
        <span 
          className="circle" 
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            width: '20px', 
            height: '20px', 
            backgroundColor: color, 
            borderRadius: '50%', 
            opacity: 0, 
            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' 
          }}
        ></span>
        <svg 
          viewBox="0 0 24 24" 
          className="arr-1" 
          style={{ 
            position: 'absolute', 
            width: '16px', 
            height: '16px', 
            right: '16px', 
            fill: color, 
            zIndex: 9, 
            transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)' 
          }}
        >
          <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
        </svg>
        <style jsx>{`
          .animated-button:hover { 
            box-shadow: 0 0 0 8px transparent !important; 
            color: white !important; 
            border-radius: 12px !important;
            backdropFilter: 'blur(16px) !important',
            WebkitBackdropFilter: 'blur(16px) !important',
            background: 'linear-gradient(135deg, rgba(212, 167, 106, 0.4) 0%, rgba(212, 167, 106, 0.2) 100%) !important',
            border: '1px solid rgba(212, 167, 106, 0.5) !important',
            boxShadow: '0 12px 40px rgba(212, 167, 106, 0.25), 0 0 0 8px transparent !important' !important;
          }
          .animated-button:hover .arr-1 { 
            right: -25% !important; 
          }
          .animated-button:hover .arr-2 { 
            left: 16px !important; 
          }
          .animated-button:hover .text { 
            transform: translateX(12px) !important; 
          }
          .animated-button:hover svg { 
            fill: white !important; 
          }
          .animated-button:active { 
            transform: scale(0.95) !important; 
            box-shadow: 0 0 0 4px ${color} !important; 
          }
          .animated-button:hover .circle { 
            width: 200px !important; 
            height: 200px !important; 
            opacity: 1 !important; 
            background-color: ${hoverColor} !important;
          }
          .active { 
            box-shadow: 0 0 0 4px ${color} !important; 
            background-color: ${hoverColor} !important; 
            color: white !important;
            backdropFilter: 'blur(12px) !important',
            WebkitBackdropFilter: 'blur(12px) !important',
            border: '1px solid rgba(212, 167, 106, 0.4) !important',
            boxShadow: '0 8px 32px rgba(212, 167, 106, 0.2), 0 0 0 4px ${color} !important' !important;
          }
        `}</style>
      </button>
    </>
  )
}

// Menu Item Component
export const MenuItem = ({ 
  item, 
  onClick, 
  children, 
  className = '',
  showActions = false,
  onEdit,
  onDelete,
  ...props 
}) => {
  const menuItemStyle = {
    ...animatedButtonStyles.menuItem,
    ...props.style
  }

  return (
    <>
      <style>{animatedButtonStyles.hoverStyles}</style>
      <div 
        className={`menu-item flex items-start justify-between p-2 text-sm sm:text-base border rounded ${className}`}
        onClick={onClick}
        style={menuItemStyle}
        {...props}
      >
        <div className="flex-1">
          <div className="font-medium">{item.name} <span className="text-primary font-semibold">₹{item.price.toFixed(2)}</span></div>
          <div className="text-xs text-gray-500">{item.description}</div>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <button 
              className="text-blue-600 hover:text-blue-800" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(item);
              }}
            >
              Edit
            </button>
            <button 
              className="text-red-600 hover:text-red-800" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(item);
              }}
            >
              Delete
            </button>
          </div>
        )}
        {children}
      </div>
    </>
  )
}

export default {
  AnimatedButton,
  MenuItem,
  colors,
  animatedButtonStyles
}
