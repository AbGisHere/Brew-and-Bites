# 📋 Changelog

All notable changes to Brew & Bites will be documented in this file.

---

## [v2.0.0] - Upcoming (Develop Branch)

### 🌍 Multi-Tenant Super Admin Architecture
- **Central Hub Portal**: A stunning, public-facing portal allowing businesses to browse and join the Brew & Bites ecosystem.
- **Super Admin Dashboard**: Full CRUD management of individual cafe franchises (Add, Edit, Suspend, Delete) accessible only to the owner (`AbG`).
- **Dynamic Database Routing**: The backend intelligently serves distinct MongoDB connections per restaurant tenant based on URL routing (`/brew-and-bites/admin`) and secure interceptor API headers.
- **Custom Landing Pages**: Each cafe can configure custom domains and unique landing page aesthetic templates (*Pastel Poetry* vs *Brew & Bites* standard).

### 📱 Customer Mobile Self-Service
- **Secure Authentication**: Customers can now log into their specific table session using a dynamically generated, unique 6-digit pin code and QR Code.
- **Live Interactive Menus**: A fully responsive mobile portal where customers can browse categories, add items to a cart, order across multiple devices simultaneously, and track real-time kitchen status.
- **Merge Ordering**: The system automatically aggregates orders from multiple guests sitting at the same table into a single unified receipt.

### 🎨 Premium Glassmorphism Design System 
- **Shared Component Library**: UI components (buttons, badges, modals) have been unified under a shared `SharedButtonStyles.js` glassmorphism system.
- **Waiter Dashboard Glass Effects**: Applied beautiful frosted glass effect to all UI elements
  - **Menu Items**: Glassy backgrounds with amber theme and smooth hover animations.
  - **Current Order Items**: Individual item boxes with faint amber glassy effect.
  - **Status Tags**: Color-coded glassy tags (amber/green/blue) for preparing/ready/served items.
  - **Container Backgrounds**: Frosted glass effect on section containers for premium feel.
- **UX Enhancements**: Non-clickable items utilize sleek transparency gradients, while primary buttons scale with satisfying transitions.

### ⚡ Smart Caching, Lazy Loading & Performance
- **Deep Code-Splitting**: Configured `manualChunks` in Vite Rollup to dynamically chunk heavy vendor libraries (`React`, `Three.js`, `Framer Motion`, `jsPDF`), eliminating >500kb bundle warnings.
- **Circular Dependency Resolution**: Refined chunking logic to eliminate circular reference warnings in production builds.
- **Frontend Assets**: Optimized CSS delivery for animated glassmorphism buttons by removing redundant and duplicate properties.
- **Service Worker Caching**: Integrated PWA-friendly Service Workers combined with a custom `useSmartCache` React Hook to proactively cache active dashboards.
- **React Suspense Pipelines**: Route navigation now leverages seamless loading indicators during dynamic component imports.

### 🛠️ Stability & Maintenance
- **Payment Lifecycle Fix**: Resolved a critical `ReferenceError` where the `PaymentModal` component was missing during the checkout flow in the Admin Dashboard.
- **Multi-Tenant Schema Reliability**: Fixed `MissingSchemaError` in the server by ensuring dynamic model registration for all schema types across sub-databases.
- **Connection Management**: Improved MongoDB connection pool reliability and URI parsing for multi-tenant environments.

---

## [v1.8.0] - 2026-01-11

### 🧾 Advanced Invoice Settings Management
- **Complete Invoice Configuration**: New comprehensive invoice settings panel with full control over receipt appearance
- **Restaurant Information Fields**: 
  - Restaurant Name, Address, Contact, Email (each with individual show/hide toggles)
  - Restaurant Logo upload with automatic compression and Base64 storage
  - Smart logo sizing (max 300×150px) for optimal printing
- **Tax & Regulatory Information**:
  - GST Number and FSSAI Number with display toggles
  - Organized in dedicated "Tax & Regulatory Information" section
- **QR Code Integration**: Toggle QR code display on receipts for digital payment options

### 🖨️ Enhanced Receipt Printing System
- **Thermal Printer Optimization**: Redesigned print styles specifically for 80mm thermal printers
- **Responsive Receipt Layout**: Mobile-optimized receipt modal with proper scaling on all devices
- **Professional Receipt Design**:
  - Side-by-side logo and restaurant information layout
  - Clean product listing with quantity breakdowns
  - Prominent total amount display with dashed borders
  - Grayscale logo conversion for thermal printing
- **Smart Print Functionality**: Direct iframe printing for better browser compatibility

### 📱 Mobile Responsiveness Improvements
- **Receipt Modal Optimization**: 
  - Adaptive padding and margins for mobile screens
  - Responsive grid layouts (hides icons on small screens)
  - Touch-friendly button sizing and spacing
- **Enhanced Mobile Experience**:
  - Improved product grid layout (1fr 80px 85px on mobile)
  - Better text wrapping and overflow handling
  - Optimized font sizes for mobile readability

### 🔧 Technical Enhancements
- **Image Compression Pipeline**: Automatic logo compression with size validation (2MB limit)
- **Payload Size Management**: Smart handling of large Base64 images to prevent 413 errors
- **Settings Schema Expansion**: Extended backend schema with comprehensive invoice field support
- **Migration Support**: Automatic database migration for existing installations
- **Consistent UI Components**: Unified toggle button styling across all settings

---

## [v1.7.1] - 2026-01-11

### 🎨 Visual Design Improvements
- **Stunning Background Pattern**: Implemented beautiful conic gradient background with chocolate-themed color palette across the entire website
- **Enhanced Flip Menu Cards**: Redesigned menu cards with horizontal flip animation, decorative SVG icons, and animated floating circles
- **Footer Color Harmony**: Updated footer colors to perfectly match the chocolate background pattern using gradient design
- **Clean Layout**: Removed unwanted white space below footer for seamless page finish

### 🎯 Menu Experience Enhancements
- **Horizontal Flip Animation**: Menu cards now flip left-to-right on hover with smooth 3D transitions
- **Decorative Elements**: Added animated floating circles and gradient effects to menu cards
- **Visual Icons**: Integrated custom SVG icons for enhanced visual appeal
- **Responsive Design**: Optimized menu card layout for all screen sizes

### 🔧 Technical Improvements
- **Console Error Fixes**: Resolved all SVG attribute warnings by converting to React-compatible camelCase
- **Version Display**: Fixed version fetching errors in Footer and GitHubLink components
- **Code Quality**: Cleaned up SVG implementations and style prop handling
- **Performance**: Optimized CSS animations and transitions for smooth performance

### 🐛 Bug Fixes
- **Receipt Generation Fix**: Fixed automatic receipt generation issue - receipts now only appear when "Close & Generate Receipt" is clicked
- **API Filtering**: Updated receipts endpoints to only fetch closed orders, not active ones
- **SVG Compatibility**: Fixed React SVG attribute warnings across all components

---

## [v1.7.0] - 2026-01-10

### 🔧 Configuration & Deployment Fixes
- **Dynamic API Configuration:** Enhanced environment detection for seamless local and production deployments.
- **Table Code Seeding:** Implemented predictable test codes (910474, 139631) for consistent testing and development.
- **CORS Optimization:** Improved cross-origin resource sharing configuration for production stability.
- **Mixed Content Resolution:** Eliminated mixed content errors on Vercel deployment.

### 🛠️ Technical Improvements
- **Enhanced Debugging:** Added comprehensive logging for API URL verification and troubleshooting.
- **Environment Detection:** Smart switching between localhost and production API endpoints.
- **Error Handling:** Better validation and error reporting for API calls.
- **Code Cleanup:** Removed hardcoded URLs and improved configuration management.

### 🔒 Stability Enhancements
- **Production-Ready Deployment:** Forced production API URL configuration for reliable cloud deployment.
- **Consistent Testing Environment:** Standardized table codes for development and testing workflows.
- **Improved Logging:** Enhanced debugging capabilities for easier troubleshooting.

---

## [v1.6.0] - 2026-01-10

### 📚 Enhanced Code Documentation
- **Comprehensive Comments:** Added detailed comments throughout the codebase for better maintainability
- **Improved Code Readability:** Enhanced variable naming and function organization
- **Documentation Standards:** Established consistent documentation patterns across all components

### 🎯 Customer Ordering UX Improvements
- **Collapsible Menu Categories:** New feature to collapse/expand menu categories for better navigation on mobile devices
- **Improved Polling Logic:** Enhanced real-time order status tracking with better error handling
- **Streamlined Navigation:** Better redirect logic for missing table information

### 🔄 QR Code Display Refactoring
- **Improved Error Handling:** Better validation and fallback mechanisms for QR code generation
- **Enhanced Loading States:** More reliable loading indicators and error messages
- **Code Cleanup:** Removed redundant dependencies and improved component structure

### 📝 Table Code Entry Improvements
- **Better User Feedback:** Enhanced validation messages and error handling
- **Streamlined Logic:** Simplified table validation flow for improved reliability

### ⚡ Performance Optimizations
- **Reduced Bundle Size:** Optimized imports and removed unused dependencies
- **Improved Component Rendering:** Enhanced React component performance with better memoization

---

## [v1.5.10] - 2026-01-10

### 🚨 Production Deployment Fixes (v1.5.1 - v1.5.10)
- **API Configuration Resolution**: Fixed hardcoded localhost URLs and implemented dynamic environment detection
- **CORS Issues**: Resolved cross-origin resource sharing problems for production deployment
- **Table Code Seeding**: Implemented predictable test codes (910474, 139631) for consistent development
- **Environment Detection**: Enhanced switching between local and production API endpoints
- **Mixed Content Errors**: Eliminated mixed content errors on Vercel deployment
- **Production Stability**: Multiple emergency fixes to ensure reliable cloud deployment
- **Dynamic Routing**: Enabled proper routing for production environment
- **Enhanced Debugging**: Added comprehensive logging for API configuration troubleshooting

---

## [v1.5.0] - 2026-01-10

### ✨ Major New Features
- **Customer Self-Service Portal:** Complete customer-facing ordering system with QR code access.
- **Table Code Authentication:** Secure 6-digit unique codes for each table.
- **Real-Time Order Tracking:** Live status updates (Preparing → Prepared → Served).
- **Smart Order Merging:** Seamlessly add items to existing orders without creating duplicates.
- **Unified Cart Display:** Single view showing both cart items and existing ordered items with status tags.
- **Mobile-Optimized Interface:** Responsive design perfect for smartphones and tablets.

### 🎨 Customer Experience Enhancements
- **Intuitive Cart Management:** Add, remove, and adjust quantities before ordering.
- **Visual Status Indicators:** Color-coded tags (Yellow/Blue/Green) for item status.
- **Order History:** Complete view of all ordered items with individual pricing.
- **Real-Time Polling:** Automatic status updates every 3 seconds.
- **Clean UI/UX:** Streamlined interface with no duplicate sections.

### 🔧 Technical Improvements
- **QR Code Generation:** Automatic QR code creation for all tables with unique URLs.
- **Enhanced API Endpoints:** New routes for table validation and order polling.
- **Fixed Currency Display:** All prices now show in INR (₹) instead of USD.
- **Improved Error Handling:** Better validation and user feedback throughout ordering flow.
- **Animated Admin Buttons:** Consistent theme styling across all admin controls.

---

## [v1.4.2] - 2025-12-25

### 🐛 Bug Fixes
- **Chef Dashboard Backend Issues:** Resolved backend problems affecting chef dashboard functionality
- **Server Stability:** Fixed server.js errors that stopped chef order dashboard from rendering

---

## [v1.4.1] - 2025-12-18

### 🎨 UI Consistency & Performance Patch
- **Parity Update:** Synchronized Waiter mobile UI with Admin/Chef dashboards
- **Bug Patch:** Fixed Navbar scrolling and Admin tab color glitches
- **Architecture:** Added Tab support for future Takeaway/Delivery modes

---

## [v1.4.0] - 2025-12-18

### 📱 Mobile Optimization, Responsive UI & Waiter UX

#### 📱 UI/UX & Mobile
- **Mobile Overhaul:** Full CSS refactor for phone/tablet compatibility
- **Fixed Modal Positioning:** Centered receipts within the active viewport
- **Waiter Logic:** Tables now display "Occupancy Status" for better usability
- **UI Polish:** Redesigned footer and cleaned up redundant labels

---

## [v1.3.0] - 2025-12-15

### 👑 Admin Dashboard (Major UX Upgrade)
- **User Management Overhaul:** Completely redesigned the Users tab. Now features a card-based layout with role-specific icons (Shield for Admin, Hat for Chef, Tray for Waiter) and quick action buttons.
- **Visual Table Grid:** Tables are now displayed in a responsive grid with clear "Occupied/Available" status pills and active order tracking.
- **Live Admin "Take Order" Modal:** Admins can now view or edit active orders in a popup overlay in the Tables tab without leaving the dashboard. No more losing context by switching tabs!
- **Real-Time Monitoring:** The dashboard now auto-refreshes every 2 seconds. Watch table statuses turn from `Green` (Free) to `Red` (Occupied) instantly.
- **Embedded Waiter Mode:** The Waiter interface now runs seamlessly inside the Admin panel for quick order taking.

#### 👨‍🍳 Chef Dashboard (New Feature)
- **Batch Mode:** This is a high-performance mode designed for efficiency in busy kitchens. Instead of fulfilling orders ticket-by-ticket (e.g., "Table 1 needs a Burger", "Table 2 needs a Burger"), it aggregates identical items so chefs can cook in bulk.

---

## [v1.2.1] - 2025-12-14

### ⚡ Zero-Latency UI Update
- **Zero-Latency Batch View:** The "Items to Prepare" list updates instantly when items are marked as "Done".
- **Smart Item Splitting:** Marking 1 item as "Ready" from a batch of 4 (e.g., "4x Coffees") now correctly splits them into (3 Preparing, 1 Ready).
- **ID Generation:** Implemented valid 24-char Hex ID generation for split items to fix server errors.
- **Honest Timestamps:** Removed artificial delays; items now display their exact order creation time.

---

## [v1.2.0] - 2025-12-14

### 👨‍🍳 Chef Dashboard (Major Performance Update)
- **Tabbed Interface:** New organized view separating **Active Orders** from **Order History**.
- **Granular Workflow:** Track items through specific stages: `Preparing` ➝ `Ready` ➝ `Served`.
- **Performance Optimized:** Refactored rendering logic using memoization to ensure zero lag, even with 50+ active orders.
- **Crash Protection:** Enhanced stability to handle missing data or incomplete orders without freezing the display.

#### 🤵 Waiter Dashboard
- **Dual Submission Modes:**
  - **Auto-Submit:** Orders are sent to the kitchen immediately upon adding items.
  - **Manual Mode:** Waiters can build a "Pending List" and review it before sending to the chef.
- **Live Order Tracking:** visual indicators for when items are "Ready to Serve" vs "Preparing".
- **Receipt Generation:** Close orders, apply coupons, and calculate totals automatically.

#### 👑 Admin Dashboard
- **Financial Suite:**
  - **Export Data:** Download receipts as **PDF** invoices or **CSV** spreadsheets.
  - **Receipt Editor:** Fix mistakes by modifying items or quantities on past orders.
  - **Sales Analytics:** Filter sales by Date Range to track daily or weekly performance.
- **Menu & Staff:** Full CRUD operations for Menu Items, Tables, and Staff (Chefs/Waiters).
- **Smart Settings:**
  - **Site Control:** Toggle "Site Closed" to prevent non-admin logins.
  - **Tax Management:** Enable/Disable global tax rates.

---

## [v1.1.0] - 2025-12-13

### 💰 Financial Management Suite
- **Tax Configuration:** Added global tax management with enable/disable functionality
- **PDF Invoice Export:** Generate professional PDF invoices for receipts
- **CSV Data Export:** Export sales data as CSV spreadsheets for analysis
- **Receipt Editing:** Modify items and quantities on past orders to fix mistakes
- **Advanced Receipt Filtering:** Sort and filter receipts by date, table, and amount
- **Fresh Coupons Tab:** Dedicated interface for managing discount coupons

---

## [v1.0.0] - 2025-12-13

### 🎉 Initial Release
- **Full MERN Stack Application:** Complete cafe management system
- **User Authentication:** Role-based access (Admin, Waiter, Chef)
- **Menu Management:** CRUD operations for menu items and categories
- **Order Management:** Complete order lifecycle from creation to payment
- **Table Management:** Visual table status tracking
- **Real-time Updates:** Live order status across all dashboards
- **Basic Receipt Generation:** Simple receipt printing functionality

---

## 📊 Version Summary

| Version | Release Date | Major Features | Status |
|---------|--------------|----------------|---------|
| v2.0.0 | Upcoming | Premium Glassmorphism Design System | 🚧 In Development |
| v1.8.0 | 2026-01-11 | Invoice Settings, Receipt Overhaul | ✅ Stable |
| v1.7.1 | 2026-01-11 | Visual Polish, Background Design | ✅ Stable |
| v1.7.0 | 2026-01-10 | Production Stability, Configuration Management | ✅ Stable |
| v1.6.0 | 2026-01-10 | Code Quality, Customer UX Improvements | ✅ Stable |
| v1.5.0 | 2026-01-10 | Customer Ordering Revolution, QR Code System | ✅ Stable |
| v1.4.0 | 2025-12-18 | Mobile Optimization, Responsive UI | ✅ Stable |
| v1.3.0 | 2025-12-15 | Admin Modal, Chef Batch Orders | ✅ Stable |
| v1.2.0 | 2025-12-14 | Chef Dashboard Optimization, Waiter Features | ✅ Stable |
| v1.1.0 | 2025-12-13 | Financial Suite, Export Features | ✅ Stable |
| v1.0.0 | 2025-12-13 | Initial Release | ✅ Stable |

---

## 🚀 Upcoming Features

### v2.0.0 (In Development - Current Develop Branch)
- **Premium Glassmorphism Design System**: Complete UI overhaul with frosted glass effects
  - Enhanced visual hierarchy with depth and modern aesthetics
  - Consistent amber color palette throughout interface
  - Smooth animations and premium transitions
  - Clean interaction without browser default borders

### v2.1.0 (Planned)
- **Advanced Analytics Dashboard**: Comprehensive sales analytics with charts and insights
- **Inventory Management**: Track ingredient stock and automatic low-stock alerts
- **Customer Loyalty Program**: Points system and reward management
- **Multi-location Support**: Manage multiple cafe locations from single dashboard

### v2.2.0 (Future)
- **Mobile Apps**: Native iOS and Android applications
- **Online Payment Integration**: Stripe/PayPal integration for direct payments
- **Advanced Reporting**: Custom report builder and scheduled reports
- **API Documentation**: Complete REST API documentation for third-party integrations

---

## [v2.0.0] - Premium Glassmorphism Design System (Release Candidate - 2026-01-13)

### 🎨 Complete UI Overhaul with Premium Glassmorphism

#### 🔄 Toggle Functionality Implementation
- **Backend Schema Enhancement**: Added `available` field to Menu model with default `true` value
- **Customer Dashboard**: Filters out unavailable items completely - customers only see available menu items
- **Waiter Dashboard**: Shows "UNAVAILABLE" for unavailable items and prevents ordering them - maintains visual consistency while preventing invalid orders
- **Admin Dashboard**: Beautiful frosted-glass toggle switches with website's amber color theme - smooth animations and perfect symmetry

#### 🎨 Visual Design System
- **Frosted Glass Effect**: Applied beautiful glassmorphism with backdrop blur, saturation, and subtle shadows across all UI elements
- **Consistent Color Theme**: Unified amber color palette (`#D4A76A`, `#3E2723`, `#8B5A2B`) throughout interface
- **Premium Animations**: Smooth transitions, hover states, and micro-interactions for enhanced user experience
- **Modern Layout**: Equal-height cards (600px) with scrollable content areas and fixed headings
- **Professional Typography**: Enhanced font hierarchy and readability with consistent styling

#### 🔧 Technical Improvements
- **Component Architecture**: Refactored shared button styles and card components for consistency
- **Responsive Design**: Mobile-optimized layouts with proper breakpoints and touch interactions
- **Performance Optimization**: Reduced bundle sizes and improved rendering efficiency
- **Code Quality**: Clean, maintainable codebase with comprehensive documentation

#### 📱 Cross-Platform Compatibility
- **Desktop**: Perfect layout with frosted-glass effects and smooth scrolling
- **Mobile**: Responsive design with touch-friendly interactions and optimized layouts
- **Tablet**: Adaptive layouts that work seamlessly across all device sizes

#### 🛠️ Quality Assurance
- **Shadow Rendering**: Fixed button shadow clipping issues with proper overflow handling
- **Button Consistency**: Unified toggle styling with perfect symmetry and glassmorphism
- **Layout Stability**: Equal card heights with proper content scrolling and fixed headings
- **Visual Polish**: Professional appearance with consistent theme application

---

### 📊 Development Statistics
- **Files Modified**: 10 files changed
- **Lines Added**: 2,245 insertions(+)
- **Lines Removed**: 851 deletions(-)
- **Net Change**: +1,394 lines of code
- **Components Enhanced**: All major UI components redesigned with glassmorphism
- **Features Added**: Complete toggle functionality with backend integration

### 🚀 Deployment Ready
This release represents a complete transformation of the Brew & Bites interface with premium glassmorphism design and robust functionality. All components are now consistent, responsive, and production-ready for V2.0.0 deployment.

---

## 🚀 Quick Start Guide

### 🔄 For Existing Users
1. **Pull Latest Changes**:
   ```bash
   git pull origin main
   npm install
   npm run dev
   ```

### 🆕 For New Installations
1. **Clone Repository**:
   ```bash
   git clone https://github.com/AbGisHere/Brew-and-Bites.git
   cd Brew-and-Bites
   ```

2. **Backend Setup**:
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ..
   npm install
   npm run dev
   ```

### 🔧 Environment Configuration
- **Development**: Automatically detects `localhost:5000`
- **Production**: Configure `API_URL` environment variable for your cloud deployment

### 🎨 Key Features in v2.0.0
- **🔄 Complete Toggle System**: Admin can control item availability across all dashboards with beautiful frosted-glass switches
- **🎨 Premium Glassmorphism**: Modern UI with depth, blur effects, and consistent amber theming
- **📱 Responsive Design**: Perfect layout on all devices with equal-height cards and scrollable content
- **🔧 Production Ready**: Optimized codebase with comprehensive error handling and logging
