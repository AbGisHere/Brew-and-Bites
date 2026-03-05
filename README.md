# ☕ Brew & Bites - Full Stack Cafe Management System
![Version](https://img.shields.io/badge/version-2.0.0-green.svg) ![License](https://img.shields.io/badge/license-Proprietary-red)

A comprehensive MERN Stack application for managing a modern cafe. This system digitizes the entire workflow—from customers browsing the menu to waiters taking orders, chefs managing the kitchen queue, and admins overseeing sales. Now featuring a complete customer self-service ordering experience with QR codes and real-time order tracking.

**🔗 Live Demo:** [https://brew-and-bites.vercel.app](https://brew-and-bites.vercel.app)  
*(Note: The backend is hosted on a free instance. Please allow 30-60 seconds for server to wake up on the first load!)*

---

## 🚀 What's New in v2.0.0 (Premium Glassmorphism UI & Enhanced Features)

### 🎨 Premium Glassmorphism Design System
* **Waiter Dashboard Glass Effects**: Beautiful frosted glass effect on all UI elements
  * Menu Items with glassy backgrounds and amber theme
  * Current Order Items with individual glassy effects
  * Status Tags with color-coded glassy styling
  * Interactive Buttons with glassy styling
  * Container Backgrounds with frosted glass effect
* **Enhanced Visual Hierarchy**: Glass morphism creates depth and modern aesthetic
* **Consistent Theme**: Warm amber color palette throughout the interface
* **Smooth Animations**: Premium transitions and hover states

### 🧾 Advanced Invoice & Settings
* **Complete Invoice Configuration**: Full control over receipt appearance
* **Restaurant Information Management**:
  * Customizable restaurant details with show/hide toggles
  * Logo upload with automatic compression
  * Tax & Regulatory Information (GST, FSSAI)
* **QR Code Integration**: For digital payment options

### �️ Enhanced Admin Features
* **Menu Management**:
  - Mark items as out of stock
  - Enhanced product organization
* **Coupon System**:
  - Expiry dates and usage restrictions
  - Scheduling capabilities
  - Improved management interface

### �️ Professional Receipt System
* **Thermal Printer Optimization**: 80mm thermal printer support
* **Responsive Receipt Layout**: Works on all devices
* **Smart Print Functionality**: Reliable browser printing

### 🔧 Technical Enhancements
* **Image Compression Pipeline**: Automatic logo compression with size validation (2MB limit)
* **Payload Size Management**: Smart handling of large Base64 images to prevent 413 errors
* **Settings Schema Expansion**: Extended backend schema with comprehensive invoice field support
* **Migration Support**: Automatic database migration for existing installations
* **Consistent UI Components**: Unified toggle button styling across all settings

### 🎨 Visual Consistency Updates
* **Settings Panel Redesign**: Matching toggle button styles across General and Invoice settings
* **Improved Layout Structure**: Consistent spacing and visual hierarchy
* **Enhanced Button Styling**: Theme-consistent colors and hover effects

---

* **Visual Icons**: Integrated custom SVG icons for enhanced visual appeal
* **Responsive Design**: Optimized menu card layout for all screen sizes

### 🔧 Technical Improvements
* **Console Error Fixes**: Resolved all SVG attribute warnings by converting to React-compatible camelCase
* **Version Display**: Fixed version fetching errors in Footer and GitHubLink components
* **Code Quality**: Cleaned up SVG implementations and style prop handling
* **Performance**: Optimized CSS animations and transitions for smooth performance

### 🐛 Bug Fixes
* **Receipt Generation Fix**: Fixed automatic receipt generation issue - receipts now only appear when "Close & Generate Receipt" is clicked
* **API Filtering**: Updated receipts endpoints to only fetch closed orders, not active ones
* **SVG Compatibility**: Fixed React SVG attribute warnings across all components

## 📜 Version History

For detailed version history and changelog, please see [CHANGELOG.md](./CHANGELOG.md)

---

## 🌟 Comprehensive Feature List

### 🎨 Premium UI/UX
* **Glassmorphism Design System**
  * Frosted glass effects across all dashboards
  * Amber-themed color palette
  * Smooth animations and transitions
  * Consistent visual hierarchy
* **Responsive Design**
  * Mobile-optimized interfaces for all user roles
  * Adaptive layouts for different screen sizes
  * Touch-friendly controls
  * Seamless experience across devices

### 👥 Customer Module (Self-Service)
* **Ordering System**
  * QR code-based table access
  * 6-digit secure table authentication
  * Real-time menu with categories and pricing
  * Smart cart with quantity adjustments
  * Order merging with existing orders
  * Real-time order status tracking
  * Order history with detailed breakdowns
* **User Experience**
  * Collapsible menu categories
  * Visual status indicators (Preparing/Ready/Served)
  * Intuitive navigation
  * Clean, distraction-free interface

### 👑 Admin Dashboard
* **Menu Management**
  * Full CRUD operations for menu items
  * Featured items highlighting
  * Advanced search and filtering
  * Category management
  * Out-of-stock item handling
  * Bulk operations
* **Order Management**
  * Real-time order monitoring
  * Order status updates
  * Advanced filtering and sorting
  * Order history with search
  * Receipt generation
* **Financial Tools**
  * Sales reporting and analytics
  * Export to PDF/CSV
  * Tax configuration
  * Discount and coupon management
* **Staff Management**
  * User role management (Admin/Waiter/Chef)
  * Staff performance metrics
  * Shift management
  * Access control
* **Table Management**
  * Dynamic table layout
  * Table status tracking
  * QR code generation
  * Capacity management

### 🧾 Invoice & Receipt System
* **Customization**
  * Restaurant information management
  * Logo upload with compression
  * Tax and regulatory fields
  * Custom receipt templates
* **Printing**
  * Thermal printer optimization (80mm)
  * Professional layout design
  * Grayscale conversion for receipts
  * Print preview functionality
* **Digital Features**
  * QR code integration for payments
  * Digital receipt options
  * Email receipt delivery

### 🔧 System Configuration
* **General Settings**
  * Business hours
  * Currency and locale
  * Tax rates and rules
  * Service charges
* **Security**
  * Role-based access control
  * Secure authentication
  * Activity logging
  * Data backup
* **Integration**
  * Payment gateway setup
  * Hardware integration (printers, scanners)
  * API access control

### 🚀 Performance & Optimization
* **Image Management**
  * Automatic image compression
  * Responsive image loading
  * Optimized storage
* **Technical Features**
  * Real-time updates via WebSocket
  * Offline capabilities
  * Progressive Web App (PWA) support
  * SEO optimization

### 🛠️ Developer Features
* **Environment Management**
  * Development/Production modes
  * Test data seeding
  * Database migrations
  * API documentation
* **Debugging Tools**
  * Comprehensive logging
  * Error tracking
  * Performance monitoring
  * Testing utilities

### 🤵 Waiter Module (Service)
Designed for tablets and mobile devices to be used tableside.
* **Order Taking:** Visual Menu with prices and descriptions.
* **Table Management:** Increase/Decrease quantity or remove items before preparation.
* **Billing:** Apply coupons, generate instant receipts, and close tables.

### 👨‍🍳 Chef Module (Kitchen Display System)
A streamlined, real-time dashboard for the kitchen staff.
* **Workflow Tracking:** Move items from `Preparing` ➝ `Ready` ➝ `Served`.
* **Performance:** Optimized for performance to handle 50+ active orders without freezing.

---

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* Tailwind CSS (Styling)
* Context API (State Management)

**Backend:**
* Node.js & Express.js
* MongoDB Atlas (Cloud Database)
* Mongoose (ODM)
* BcryptJS (Security)

**Deployment:**
* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas

---

## 🔐 Default Credentials (Demo)

Use these credentials to test the different roles:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Waiter** | `waiter1` | `waiter123` |
| **Chef** | `chef1` | `chef123` |

*(Note: You can create new users inside the Admin Dashboard)*

---

## 💻 Local Installation Guide

Follow these steps to run the project on your laptop.

### 1. Clone the Repository
```bash
git clone [https://github.com/AbGisHere/Brew-and-Bites.git](https://github.com/AbGisHere/Brew-and-Bites.git)
cd Brew-and-Bites
```
2. Backend Setup
```Bash

cd server
npm install
```

Start the server:

```Bash

npm run dev
```

**🌱 Auto-Seeding:** On first startup, the system automatically creates default accounts:
- **admin** (password: admin123) - Administrator access
- **waiter1** (password: waiter123) - Waiter access  
- **chef1** (password: chef123) - Chef access


The system also seeds default menu items, tables, coupons, and settings automatically!
3. Frontend Setup
Open a new terminal (keep the server running).

```Bash

# Go back to root if inside server
cd .. 
npm install
npm run dev
```
4. Configuration
The app automatically detects if you are on localhost.

Check src/config.js to ensure it points to http://localhost:5000 when running locally.

📂 Project Structure
```Plaintext

Brew-Bites-Cafe/
├── server/                 # Backend Node.js Code
│   ├── models/             # Mongoose Schemas (User, Order, Menu)
│   ├── index.js            # Main Server File (Routes & Logic)
│   └── db.js               # Database Connection
├── src/                    # Frontend React Code
│   ├── components/         # Dashboards (Admin, Waiter, Chef)
│   ├── context/            # AuthContext (Login Logic)
│   ├── config.js           # API URL Switcher (Local vs Cloud)
│   └── App.jsx             # Main Routing
└── README.md
```
🛡️ Security Features
Password Hashing: All passwords are encrypted using bcryptjs before storage.

Environment Variables: Sensitive keys are kept out of the codebase using .env.

CORS Policy: configured to allow secure communication between Vercel and Render.

## 📢 Feedback & Bug Reports
This is a proprietary project. While we do not accept code contributions or forks, we welcome bug reports and feature suggestions via the Issues tab.

## 🛡️ License & Legal
**Copyright (c) 2026 Abhinav Gupta (AbGisHere). All Rights Reserved.**

**NOTICE:** The software and related assets contained in this repository are the exclusive property of the author. Unauthorized copying, modification, distribution, or commercial use of this software, via any medium, is strictly prohibited.

Developed by AbGisHere
