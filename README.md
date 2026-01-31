# ☕ Brew & Bites - Full Stack Cafe Management System
![Version](https://img.shields.io/badge/version-1.8.0-green.svg) ![License](https://img.shields.io/badge/license-Proprietary-red)

A comprehensive MERN Stack application for managing a modern cafe. This system digitizes the entire workflow—from customers browsing the menu to waiters taking orders, chefs managing the kitchen queue, and admins overseeing sales. Now featuring a complete customer self-service ordering experience with QR codes and real-time order tracking.

**🔗 Live Demo:** [https://brew-and-bites.vercel.app](https://brew-and-bites.vercel.app)  
*(Note: The backend is hosted on a free instance. Please allow 30-60 seconds for server to wake up on the first load!)*

---

## 🚀 What's New in v1.8.0 (Invoice Settings & Receipt Enhancement)

### 🧾 Advanced Invoice Settings Management
* **Complete Invoice Configuration**: New comprehensive invoice settings panel with full control over receipt appearance
* **Restaurant Information Fields**: 
  * Restaurant Name, Address, Contact, Email (each with individual show/hide toggles)
  * Restaurant Logo upload with automatic compression and Base64 storage
  * Smart logo sizing (max 300×150px) for optimal printing
* **Tax & Regulatory Information**:
  * GST Number and FSSAI Number with display toggles
  * Organized in dedicated "Tax & Regulatory Information" section
* **QR Code Integration**: Toggle QR code display on receipts for digital payment options

### 🖨️ Enhanced Receipt Printing System
* **Thermal Printer Optimization**: Redesigned print styles specifically for 80mm thermal printers
* **Responsive Receipt Layout**: Mobile-optimized receipt modal with proper scaling on all devices
* **Professional Receipt Design**:
  * Side-by-side logo and restaurant information layout
  * Clean product listing with quantity breakdowns
  * Prominent total amount display with dashed borders
  * Grayscale logo conversion for thermal printing
* **Smart Print Functionality**: Direct iframe printing for better browser compatibility

### 📱 Mobile Responsiveness Improvements
* **Receipt Modal Optimization**: 
  * Adaptive padding and margins for mobile screens
  * Responsive grid layouts (hides icons on small screens)
  * Touch-friendly button sizing and spacing
* **Enhanced Mobile Experience**:
  * Improved product grid layout (1fr 80px 85px on mobile)
  * Better text wrapping and overflow handling
  * Optimized font sizes for mobile readability

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

---

## 🚀 What's New in v1.7.0 (Production Stability & Configuration Management)

### 🔧 Configuration & Deployment Fixes
* **Dynamic API Configuration:** Enhanced environment detection for seamless local and production deployments.
* **Table Code Seeding:** Implemented predictable test codes (910474, 139631) for consistent testing and development.
* **CORS Optimization:** Improved cross-origin resource sharing configuration for production stability.
* **Mixed Content Resolution:** Eliminated mixed content errors on Vercel deployment.

### 🛠️ Technical Improvements
* **Enhanced Debugging:** Added comprehensive logging for API URL verification and troubleshooting.
* **Environment Detection:** Smart switching between localhost and production API endpoints.
* **Error Handling:** Better validation and error reporting for API calls.
* **Code Cleanup:** Removed hardcoded URLs and improved configuration management.

### 🔒 Stability Enhancements
* **Production-Ready Deployment:** Forced production API URL configuration for reliable cloud deployment.
* **Consistent Testing Environment:** Standardized table codes for development and testing workflows.
* **Improved Logging:** Enhanced debugging capabilities for easier troubleshooting.

---

## 🎯 Recent Feature Highlights (v1.6.0 - v1.7.1)

### 🎨 Visual Design & User Experience (v1.7.1)
* **Stunning Background Pattern**: Beautiful conic gradient background with chocolate-themed color palette across entire website
* **Enhanced Flip Menu Cards**: Horizontal flip animation with decorative SVG icons and animated floating circles
* **Footer Color Harmony**: Gradient footer design that perfectly matches the background pattern
* **Seamless Layout**: Clean page finish with no unwanted white space

### 📱 Enhanced Customer Experience
* **Collapsible Menu Categories:** Customers can now collapse/expand menu sections for easier navigation on mobile devices.
* **Improved Real-Time Tracking:** Better polling logic for instant order status updates with enhanced error recovery.
* **Streamlined QR Code Flow:** More reliable QR code generation with better fallback mechanisms.

### 🔧 Developer Experience
* **Predictable Test Environment:** Fixed table codes (910474, 139631) for consistent development and testing.
* **Enhanced Code Documentation:** Comprehensive comments and improved code readability across all components.
* **Dynamic Configuration:** Smart environment detection eliminates manual configuration between local and production deployments.
* **Console Error-Free:** Resolved all SVG attribute warnings and version fetching issues.

### 🚀 Production Readiness
* **Zero-Configuration Deployment:** Eliminated mixed content errors and CORS issues for seamless Vercel deployment.
* **Enhanced Debugging:** Comprehensive logging for troubleshooting API connectivity issues.
* **Performance Optimizations:** Reduced bundle sizes and improved component rendering efficiency.
* **Receipt Generation Control**: Fixed automatic receipt generation - now only appears when explicitly closing orders.

---

## 🚀 What's New in v1.5.0 (Customer Ordering Revolution)

### ✨ Major New Features
* **Customer Self-Service Portal:** Complete customer-facing ordering system with QR code access.
* **Table Code Authentication:** Secure 6-digit unique codes for each table.
* **Real-Time Order Tracking:** Live status updates (Preparing → Prepared → Served).
* **Smart Order Merging:** Seamlessly add items to existing orders without creating duplicates.
* **Unified Cart Display:** Single view showing both cart items and existing ordered items with status tags.
* **Mobile-Optimized Interface:** Responsive design perfect for smartphones and tablets.

### 🎨 Customer Experience Enhancements
* **Intuitive Cart Management:** Add, remove, and adjust quantities before ordering.
* **Visual Status Indicators:** Color-coded tags (Yellow/Blue/Green) for item status.
* **Order History:** Complete view of all ordered items with individual pricing.
* **Real-Time Polling:** Automatic status updates every 3 seconds.
* **Clean UI/UX:** Streamlined interface with no duplicate sections.

### 🔧 Technical Improvements
* **QR Code Generation:** Automatic QR code creation for all tables with unique URLs.
* **Enhanced API Endpoints:** New routes for table validation and order polling.
* **Fixed Currency Display:** All prices now show in INR (₹) instead of USD.
* **Improved Error Handling:** Better validation and user feedback throughout ordering flow.
* **Animated Admin Buttons:** Consistent theme styling across all admin controls.

---

## 📜 Version History

For detailed version history and changelog, please see [CHANGELOG.md](./CHANGELOG.md)

### **v1.8.0 (Invoice Settings & Receipt Enhancement)**
* **Advanced Invoice Settings**: Complete invoice configuration panel with restaurant info, tax details, and logo upload
* **Restaurant Logo Management**: Image upload with automatic compression and Base64 storage
* **Tax & Regulatory Fields**: GST and FSSAI number management with display toggles
* **Enhanced Receipt Printing**: Thermal printer optimization with professional layout design
* **Mobile Responsiveness**: Improved receipt modal scaling and touch-friendly interface
* **Technical Improvements**: Image compression pipeline, payload size management, and database migration support
* **UI Consistency**: Unified toggle button styling across all settings panels

---

## 🌟 Comprehensive Feature List

### � Customer Module (Self-Service Ordering)
A complete customer-facing portal for seamless self-service ordering experience.
* **QR Code Access:** Scan table QR codes to instantly access the ordering interface.
* **Secure Authentication:** 6-digit unique table codes for secure access control.
* **Interactive Menu:** Browse menu items with prices, descriptions, and categories.
* **Smart Cart Management:** Add items, adjust quantities, and review before ordering.
* **Real-Time Order Tracking:** Live status updates with color-coded indicators.
* **Order Merging:** Add items to existing orders without creating duplicates.
* **Mobile-First Design:** Optimized for smartphones and tablets with responsive layout.

### �👑 Admin Module (Control Center)
The Admin dashboard is the brain of the operation, allowing full control over the restaurant's data and settings.
* **Menu Management:**
    * **CRUD Operations:** Add, Edit, and Delete menu items.
    * **Featured Dishes:** Toggle items as "Featured" to highlight them.
    * **Search & Filter:** Instantly search through menu items or filter by category.
* **Financial Suite:**
    * **Receipt Management:** View a full history of all orders. Sort by Date, Table, or Amount.
    * **Advanced Exports:** Download sales data as **PDF** or **CSV**.
* **Invoice Settings & Branding:**
    * **Restaurant Information:** Configure name, address, contact, and email with individual display toggles
    * **Logo Management:** Upload and compress restaurant logo with automatic Base64 storage
    * **Tax & Regulatory:** GST and FSSAI number management with receipt display options
    * **QR Code Integration:** Toggle QR code display on receipts for digital payments
    * **Professional Receipts:** Thermal printer-optimized receipt layouts with custom branding
* **Staff & Floor Management:**
    * **User Accounts:** Create and delete secure login credentials for Chefs and Waiters.
    * **Table Layout:** Add or remove tables and see which ones currently have active orders.
    * **Instant Order Taking:** Click any table to open the **Service Modal** and take orders immediately.
* **System Configuration:**
    * **Order Flow Control:** Toggle auto-submit vs manual order submission for waiters
    * **Site Management:** Control website availability and maintenance mode
    * **Tax Configuration:** Enable/disable and configure tax rates

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

## 🍳 Feature Spotlight: Chef Batch View
The **Batch View** is a high-performance mode designed for efficiency in busy kitchens. Instead of fulfilling orders ticket-by-ticket (e.g., "Table 1 needs a Burger", "Table 2 needs a Burger"), it aggregates identical items so chefs can cook in bulk.

### How it Works:
1.  **Live Aggregation:** The system instantly sums up all pending items across every active order. If 5 tables order Cappuccinos, the chef sees **"5x Cappuccino Pending"**.
2.  **Smart Item Splitting:** When a chef marks **2** items as "Ready" out of a batch of **5**, the system performs complex logic in the background:
    * It finds the specific orders containing those items (using **FIFO** logic to prioritize older orders).
    * It **splits** the order items in the database (e.g., converting "4x Burgers" into "2x Burgers (Ready)" and "2x Burgers (Preparing)").
    * It generates new valid MongoDB IDs for the split items to ensure data integrity.
3.  **Zero Latency:** The UI updates optimistically, meaning the chef sees the change immediately while the server processes the split in the background.

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
- **AbG** (password: GitHub--AbGisHere) - Super admin (hidden)

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
