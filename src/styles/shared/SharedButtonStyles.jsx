import React from 'react'
import PenIcon from "../../components/icons/PenIcon"
import TrashIcon from "../../components/icons/TrashIcon"

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
    
    // Admin button hover animations
    .admin-button:hover {
      background: rgba(212, 167, 106, 0.25) !important;
      transform: scale(0.98) !important;
      box-shadow: 0 6px 32px -2px rgba(212, 167, 106, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.3), inset 0 0 25px rgba(212, 167, 106, 0.1) !important;
      border: 1px solid rgba(212, 167, 106, 0.3) !important;
      border-radius: 12px !important;
      color: #3E2723 !important;
    }
    
    .admin-button:hover .arr-1 { 
      right: -25% !important; 
    }
    .admin-button:hover .arr-2 { 
      left: 16px !important; 
    }
    .admin-button:hover .text { 
      transform: translateX(12px) !important; 
    }
    .admin-button:hover svg { 
      fill: #3E2723 !important; 
    }
    .admin-button:hover .circle { 
      width: 200px !important; 
      height: 200px !important; 
      opacity: 1 !important; 
      background-color: rgba(212, 167, 106, 0.3) !important;
    }
    
    .admin-button:active {
      background: linear-gradient(135deg, rgba(212, 167, 106, 0.5) 0%, rgba(212, 167, 106, 0.35) 100%) !important;
      transform: scale(0.96) !important;
      box-shadow: 0 4px 20px rgba(212, 167, 106, 0.25), inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      border: 1px solid rgba(212, 167, 106, 0.5) !important;
      border-radius: 12px !important;
      color: #3E2723 !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    .admin-button:active .circle { 
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
  },

  // Admin Dashboard button styles with View button animations
  adminButton: {
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    background: 'rgba(212, 167, 106, 0.18)',
    borderRadius: '22px',
    border: '1px solid rgba(212, 167, 106, 0.22)',
    boxShadow: '0 4px 24px -1px rgba(212, 167, 106, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(212, 167, 106, 0.12)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    color: '#3E2723',
    padding: '8px 20px',
    fontSize: '14px',
    minWidth: '140px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontWeight: '600'
  },

  adminButtonWide: {
    backdropFilter: 'blur(40px) saturate(150%)',
    WebkitBackdropFilter: 'blur(40px) saturate(150%)',
    background: 'rgba(212, 167, 106, 0.18)',
    borderRadius: '22px',
    border: '1px solid rgba(212, 167, 106, 0.22)',
    boxShadow: '0 4px 24px -1px rgba(212, 167, 106, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(212, 167, 106, 0.12)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    color: '#3E2723',
    padding: '8px 20px',
    fontSize: '14px',
    minWidth: '160px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontWeight: '600'
  }
};

// Table status styles with enhanced glassmorphism
export const tableStatusStyles = {
  base: {
    padding: '10px 18px',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '90px',
    letterSpacing: '0.025em',
    textTransform: 'uppercase',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  occupied: {
    backdropFilter: 'blur(25px) saturate(150%)',
    WebkitBackdropFilter: 'blur(25px) saturate(150%)',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#ffffff',
    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 12px rgba(239, 68, 68, 0.08)'
  },
  available: {
    backdropFilter: 'blur(25px) saturate(150%)',
    WebkitBackdropFilter: 'blur(25px) saturate(150%)',
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    color: '#ffffff',
    borderRadius: '8px', // Add proper rounded corners
    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.25), inset 0 0 12px rgba(34, 197, 94, 0.08)'
  }
};

// Status badge styles with glassmorphism - simple and clean like waiter dashboard
export const statusBadgeStyles = {
  preparing: {
    background: '#FFF8E1', // Light yellow background like the PREPARING image
    border: '1px solid #FFECB3', // Subtle yellow border
    color: '#8D6E63', // Brown text color like the PREPARING image
    borderRadius: '8px', // Rounded corners like the image
    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)', // Subtle inner highlight
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    textTransform: 'uppercase'
  },
  ready: {
    background: '#E0F2F7', // Light blue background like the Chef image
    border: '1px solid #B3E5FC', // Subtle blue border
    color: '#2196F3', // Blue text color like the Chef image
    borderRadius: '8px', // Rounded corners like the image
    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)', // Subtle inner highlight
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    textTransform: 'uppercase'
  },
  served: {
    background: '#E8F5E9', // Light green background
    border: '1px solid #C8E6C9', // Subtle green border
    color: '#66BB6A', // Green text color
    borderRadius: '8px', // Rounded corners
    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)', // Subtle inner highlight
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    textTransform: 'uppercase'
  },
  'ready-to-serve': {
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    background: 'rgba(59, 130, 246, 0.25)',
    border: '1px solid rgba(59, 130, 246, 0.4)',
    color: '#1e40af',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    textTransform: 'uppercase'
  },
  'preparing-order': {
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    background: 'rgba(251, 191, 36, 0.25)',
    border: '1px solid rgba(251, 191, 36, 0.4)',
    color: '#92400e',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.3)',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    textTransform: 'uppercase'
  },
  default: {
    backdropFilter: 'blur(20px) saturate(150%)',
    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
    background: 'rgba(212, 167, 106, 0.25)', // Glassmorphism background
    border: '1px solid rgba(212, 167, 106, 0.4)',
    color: '#92400e',
    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.025em',
    textTransform: 'uppercase'
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

// Delete button styles for order items - with glassmorphism like status badges
export const deleteButtonStyles = {
  base: {
    backdropFilter: 'blur(20px) saturate(150%)', // Same as status badges
    WebkitBackdropFilter: 'blur(20px) saturate(150%)', // Same as status badges
    background: 'rgba(239, 68, 68, 0.25)', // More visible for glassmorphism
    borderRadius: '50%', // Make it circular
    border: '1px solid rgba(239, 68, 68, 0.4)', // More visible red outline
    color: '#dc2626',
    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)', // Same inner highlight as status badges
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  
  hover: {
    background: 'rgba(239, 68, 68, 0.35)', // Darker red on hover to match new base
    border: '1px solid rgba(239, 68, 68, 0.5)', // More prominent red outline
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
  onEdit, 
  onDelete, 
  onToggleAvailability, 
  showActions = false, 
  unavailableText = 'Currently unavailable',
  className = '',
  hoveredEditId,
  setHoveredEditId,
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
        className={`menu-item flex items-start justify-between p-2 text-sm sm:text-base border rounded ${className} ${item.available === false ? 'opacity-60' : ''}`}
        onClick={onClick}
        style={menuItemStyle}
        {...props}
      >
        <div className="flex-1">
          <div className="font-medium">{item.name} <span className="text-primary font-semibold">₹{item.price.toFixed(2)}</span></div>
          <div className="text-xs text-gray-500">{item.description}</div>
          {item.available === false && <div className="text-xs text-red-600 font-medium mt-1">{unavailableText}</div>}
        </div>
        <div className="flex items-center gap-2">
          {onToggleAvailability && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.available !== false}
                  onChange={() => onToggleAvailability(item)}
                  className="sr-only peer"
                />
                <div 
                  className="relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    backdropFilter: 'blur(20px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                    background: item.available !== false 
                      ? 'rgba(212, 167, 106, 0.25)' 
                      : 'rgba(139, 90, 43, 0.15)',
                    border: '1px solid',
                    borderColor: item.available !== false 
                      ? 'rgba(212, 167, 106, 0.3)' 
                      : 'rgba(139, 90, 43, 0.25)',
                    boxShadow: item.available !== false
                      ? '0 2px 12px -1px rgba(212, 167, 106, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
                      : '0 2px 12px -1px rgba(139, 90, 43, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 left-[2px] bg-white rounded-full transition-all duration-300 ease-in-out shadow-sm"
                    style={{
                      width: '20px',
                      height: '20px',
                      transform: item.available !== false ? 'translateX(19px) translateY(-50%)' : 'translateX(-1px) translateY(-50%)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                    }}
                  />
                </div>
              </label>
            </div>
          )}
          {showActions && (
            <div className="flex gap-2">
              <div 
                className="w-8 h-8 flex items-center justify-center cursor-pointer edit-btn"
                style={{
                  backdropFilter: 'blur(20px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                  background: 'rgba(59, 130, 246, 0.25)', // More visible for glassmorphism
                  borderRadius: '50%',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#2563eb',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none' // Remove default focus outline
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.25)';
                  e.target.style.border = '2px solid rgba(59, 130, 246, 0.6)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.15)';
                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(item);
                }}
                title="Edit"
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.35)';
                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.5)';
                  e.target.style.color = '#1d4ed8';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.25)'; // Match new base color
                  e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)'; // Match new base color
                  e.target.style.color = '#2563eb';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <PenIcon 
                  size={16}
                  color="#1e40af"
                  strokeWidth={2}
                />
              </div>
              <div 
                className="w-8 h-8 flex items-center justify-center cursor-pointer delete-btn"
                style={{
                  ...deleteButtonStyles.base,
                  outline: 'none' // Remove default focus outline
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                  e.target.style.border = '2px solid rgba(239, 68, 68, 0.6)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(item);
                }}
                title="Delete"
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.35)';
                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.5)';
                  e.target.style.color = '#b91c1c';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.25)'; // Match new base color
                  e.target.style.border = '1px solid rgba(239, 68, 68, 0.4)'; // Match new base color
                  e.target.style.color = '#dc2626';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(255, 255, 255, 0.8), 0 1px 2px rgba(0, 0, 0, 0.1)';
                }}
              >
                <TrashIcon 
                  size={16}
                  color="#dc2626"
                  strokeWidth={2}
                  dangerHover={true}
                />
              </div>
            </div>
          )}
        </div>
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
