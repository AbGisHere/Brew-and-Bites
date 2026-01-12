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

  // Menu item style - softer colors
  menuItem: {
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    background: 'rgba(212, 167, 106, 0.18)', // Reduced from 0.25 to 0.18
    borderRadius: '22px',
    border: '1px solid rgba(212, 167, 106, 0.22)', // Slightly increased for visibility
    boxShadow: '0 4px 24px -1px rgba(212, 167, 106, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(212, 167, 106, 0.12)', // Softer shadow
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    color: '#3E2723'
  },

  // View button style - menu item look with liquid glass effect
  viewButton: {
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    background: 'rgba(212, 167, 106, 0.18)',
    borderRadius: '22px',
    border: '1px solid rgba(212, 167, 106, 0.22)', // Subtle border matching menu items
    boxShadow: '0 4px 24px -1px rgba(212, 167, 106, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(212, 167, 106, 0.12)', // Softer shadow
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    color: '#3E2723',
    padding: '6px 16px',
    fontSize: '14px',
    minWidth: '100px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontWeight: '600'
  },

  closeButton: {
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    background: 'rgba(121, 85, 72, 0.18)',
    borderRadius: '22px',
    border: '1px solid rgba(121, 85, 72, 0.22)',
    boxShadow: '0 4px 24px -1px rgba(121, 85, 72, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(121, 85, 72, 0.12)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    color: '#3E2723',
    padding: '10px 18px',
    fontSize: '14px',
    minWidth: '220px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600'
  },

  // Hover styles for menu items - softer colors
  hoverStyles: `
    .menu-item:hover {
      background: rgba(212, 167, 106, 0.35) !important;
      transform: scale(0.98) !important;
      box-shadow: 0 6px 32px -2px rgba(212, 167, 106, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(212, 167, 106, 0.1) !important;
      border: 1px solid rgba(212, 167, 106, 0.3) !important;
    }
    
    .menu-item:active {
      background: rgba(212, 167, 106, 0.4) !important;
      transform: scale(0.96) !important;
      border: 2px solid rgba(212, 167, 106, 0.5) !important;
      outline: none !important;
      box-shadow: 0 4px 20px -2px rgba(212, 167, 106, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(212, 167, 106, 0.15) !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .menu-item:focus {
      outline: 'none' !important;
      border: '1px solid rgba(212, 167, 106, 0.28)' !important;
    }
    
    .menu-item:hover span,
    .menu-item:hover div {
      color: #5D4037 !important; // Darker brown for better readability
    }
    
    .menu-item:hover .text-primary {
      color: #8D6E63 !important; // Darker amber for primary text
    }
    
    .view-button:hover {
      background: rgba(212, 167, 106, 0.25) !important;
      transform: scale(0.98) !important;
      box-shadow: 0 6px 32px -2px rgba(212, 167, 106, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(212, 167, 106, 0.1) !important;
      border: 1px solid rgba(212, 167, 106, 0.3) !important;
      border-radius: 12px !important;
      color: #3E2723 !important;
    }
    
    .view-button:hover .arr-1 { 
      right: -25% !important; 
    }
    .view-button:hover .arr-2 { 
      left: 16px !important; 
    }
    .view-button:hover .text { 
      transform: translateX(12px) !important; 
    }
    .view-button:hover svg { 
      fill: #3E2723 !important; 
    }
    .view-button:hover .circle { 
      width: 200px !important; 
      height: 200px !important; 
      opacity: 1 !important; 
      background-color: rgba(212, 167, 106, 0.3) !important;
    }
    
    .view-button:active {
      background: linear-gradient(135deg, rgba(212, 167, 106, 0.5) 0%, rgba(212, 167, 106, 0.35) 100%) !important;
      transform: scale(0.96) !important;
      box-shadow: 0 4px 20px rgba(212, 167, 106, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      border: 1px solid rgba(212, 167, 106, 0.5) !important;
      border-radius: 12px !important;
      color: #3E2723 !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    .view-button:active .circle { 
      opacity: 1; 
      width: 200%; 
      height: 500%; 
    }
    
    .close-button:hover {
      background: rgba(121, 85, 72, 0.35) !important;
      transform: scale(0.98) !important;
      box-shadow: 0 6px 32px -2px rgba(121, 85, 72, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(121, 85, 72, 0.1) !important;
      border: 1px solid rgba(121, 85, 72, 0.3) !important;
    }
    
    .close-button:active {
      background: rgba(121, 85, 72, 0.2) !important;
      transform: scale(0.96) !important;
      border: 2px solid rgba(121, 85, 72, 0.5) !important;
      outline: none !important;
      box-shadow: 0 4px 20px -2px rgba(121, 85, 72, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(121, 85, 72, 0.15) !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .quantity-button:hover {
      background: rgba(212, 167, 106, 0.25) !important;
      border: 1px solid rgba(212, 167, 106, 0.3) !important;
      box-shadow: 0 4px 12px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.25) !important;
      transform: scale(0.98) !important;
    }
    
    .quantity-button:active {
      background: rgba(212, 167, 106, 0.15) !important;
      border: 2px solid rgba(212, 167, 106, 0.4) !important;
      outline: none !important;
      box-shadow: 0 4px 20px rgba(212, 167, 106, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4) !important;
      transform: scale(0.96) !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.2) !important;
      border: 1px solid rgba(239, 68, 68, 0.4) !important;
      color: #b91c1c !important;
      transform: scale(0.98) !important;
    }
    
    .delete-btn:active {
      background: rgba(239, 68, 68, 0.25) !important;
      border: 2px solid rgba(239, 68, 68, 0.5) !important;
      outline: none !important;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.4) !important;
      transform: scale(0.96) !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
    
    .table-button:hover {
      background: rgba(121, 85, 72, 0.35) !important;
      transform: scale(0.98) !important;
      box-shadow: 0 6px 32px -2px rgba(121, 85, 72, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(121, 85, 72, 0.1) !important;
      border: 1px solid rgba(121, 85, 72, 0.3) !important;
      color: #5D4037 !important;
    }
    
    .table-button:active {
      background: rgba(121, 85, 72, 0.2) !important;
      transform: scale(0.96) !important;
      border: 2px solid rgba(121, 85, 72, 0.5) !important;
      outline: none !important;
      box-shadow: 0 4px 20px -2px rgba(121, 85, 72, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4), inset 0 0 20px rgba(121, 85, 72, 0.15) !important;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
  `
}

// Table button styles for consistent table selection
export const tableButtonStyles = {
  base: {
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    backdropFilter: 'blur(4px) saturate(120%)',
    WebkitBackdropFilter: 'blur(4px) saturate(120%)',
    background: 'rgba(121, 85, 72, 0.08)', // Brown background
    border: '1px solid rgba(121, 85, 72, 0.15)',
    borderRadius: '12px',
    color: '#3E2723',
    transform: 'translateY(0px)'
  },
  
  hover: {
    background: 'rgba(121, 85, 72, 0.35)',
    transform: 'scale(0.98)',
    boxShadow: '0 6px 32px -2px rgba(121, 85, 72, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(121, 85, 72, 0.1)',
    borderColor: 'rgba(121, 85, 72, 0.3)',
    color: '#5D4037'
  },
  
  active: {
    background: 'rgba(121, 85, 72, 0.4)',
    transform: 'scale(1)',
    border: '1px solid rgba(121, 85, 72, 0.4)',
    outline: 'none',
    boxShadow: '0 6px 32px -2px rgba(121, 85, 72, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(121, 85, 72, 0.1)',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    color: '#5D4037'
  },
  
  activeHover: {
    background: 'rgba(121, 85, 72, 0.45)',
    boxShadow: '0 6px 32px -2px rgba(121, 85, 72, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.35), inset 0 0 25px rgba(121, 85, 72, 0.12)',
    backdropFilter: 'blur(6px) saturate(120%)',
    WebkitBackdropFilter: 'blur(6px) saturate(120%)',
    border: '1px solid rgba(121, 85, 72, 0.45)'
  }
};

// Status badge styles with glassmorphism
export const statusBadgeStyles = {
  preparing: {
    backdropFilter: 'blur(15px) saturate(120%)',
    WebkitBackdropFilter: 'blur(15px) saturate(120%)',
    background: 'rgba(251, 191, 36, 0.15)', // Amber for preparing
    border: '1px solid rgba(251, 191, 36, 0.3)',
    color: '#92400e',
    borderRadius: '6px'
  },
  ready: {
    backdropFilter: 'blur(15px) saturate(120%)',
    WebkitBackdropFilter: 'blur(15px) saturate(120%)',
    background: 'rgba(59, 130, 246, 0.15)', // Blue for ready
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#1e40af',
    borderRadius: '6px'
  },
  served: {
    backdropFilter: 'blur(15px) saturate(120%)',
    WebkitBackdropFilter: 'blur(15px) saturate(120%)',
    background: 'rgba(34, 197, 94, 0.15)', // Green for served
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#166534',
    borderRadius: '6px'
  },
  'ready-to-serve': {
    backdropFilter: 'blur(15px) saturate(120%)',
    WebkitBackdropFilter: 'blur(15px) saturate(120%)',
    background: 'rgba(59, 130, 246, 0.15)', // Blue for ready-to-serve
    border: '1px solid rgba(59, 130, 246, 0.3)',
    color: '#1e40af',
    borderRadius: '6px'
  },
  'preparing-order': {
    backdropFilter: 'blur(15px) saturate(120%)',
    WebkitBackdropFilter: 'blur(15px) saturate(120%)',
    background: 'rgba(251, 191, 36, 0.15)', // Amber for preparing-order
    border: '1px solid rgba(251, 191, 36, 0.3)',
    color: '#92400e',
    borderRadius: '6px'
  }
};

// Order item styles for consistent order display - static containers only
export const orderItemStyles = {
  base: {
    backdropFilter: 'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    background: 'rgba(212, 167, 106, 0.03)', // Very faint - barely visible
    borderRadius: '16px',
    border: '1px solid rgba(212, 167, 106, 0.08)', // Very subtle border
    boxShadow: '0 1px 4px rgba(212, 167, 106, 0.02), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)', // Minimal shadow
    transition: 'none' // Remove all transitions - static container
  }
};

// Delete button styles for order items
export const deleteButtonStyles = {
  base: {
    backdropFilter: 'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    background: 'rgba(239, 68, 68, 0.15)', // Light glass red background (increased from 0.1)
    borderRadius: '50%', // Make it circular
    border: '1px solid rgba(239, 68, 68, 0.3)', // More visible red outline
    color: '#dc2626',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  hover: {
    background: 'rgba(239, 68, 68, 0.2)', // Slightly darker red on hover
    border: '1px solid rgba(239, 68, 68, 0.4)', // More prominent red outline
    color: '#b91c1c',
    transform: 'scale(1.02)' // Very subtle scale
  }
};

// Quantity button styles for + and - buttons
export const quantityButtonStyles = {
  base: {
    backdropFilter: 'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    background: 'rgba(212, 167, 106, 0.08)',
    borderRadius: '8px',
    border: '1px solid rgba(212, 167, 106, 0.2)',
    boxShadow: '0 2px 6px rgba(212, 167, 106, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    color: '#3E2723'
  },
  
  hover: {
    background: 'rgba(212, 167, 106, 0.25)',
    border: '1px solid rgba(212, 167, 106, 0.3)',
    boxShadow: '0 4px 12px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.25)',
    transform: 'scale(0.98)'
  },
  
  active: {
    background: 'rgba(212, 167, 106, 0.15)',
    border: '2px solid rgba(212, 167, 106, 0.4)',
    outline: 'none',
    boxShadow: '0 4px 20px rgba(212, 167, 106, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
    transform: 'scale(0.96)',
    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  
  focus: {
    outline: 'none',
    border: '1px solid rgba(212, 167, 106, 0.25)'
  }
};

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
  animatedButtonStyles,
  tableButtonStyles,
  statusBadgeStyles,
  orderItemStyles,
  deleteButtonStyles,
  quantityButtonStyles
}
