# ☕ Brew & Bites - Full Stack Cafe Management System
![Version](https://img.shields.io/badge/version-1.4.1-green.svg)

A comprehensive MERN Stack application for managing a modern cafe. This system digitizes the entire workflow—from customers browsing the menu to waiters taking orders, chefs managing the kitchen queue, and admins overseeing sales. Now fully optimized for a mobile-first experience.

**🔗 Live Demo:** [https://brew-and-bites.vercel.app](https://brew-and-bites.vercel.app)  
*(Note: The backend is hosted on a free instance. Please allow 30-60 seconds for the server to wake up on the first load!)*

---

## 🚀 What's New in v1.4.1 (UI Consistency & Performance Patch)

### 📱 User Interface (UI) Enhancements
* **Waiter Dashboard Redesign (Mobile):** Completely overhauled the mobile UI for Waiters to match the modern aesthetic of the Chef and Admin dashboards. Improved layout for better visibility in high-paced environments.
* **New Tab System:** Introduced a tabbed interface for the Waiter section, such as Dining
* **UX Optimization:** Relocated the Close and Generate Receipt buttons to more ergonomic positions based on mobile thumb-reach patterns.

### 🐛 Bug Fixes
* **Admin Section Glitches:** Resolved a random color-rendering bug where tabs would occasionally display incorrect theme colors inconsistent with the main brand palette.
* **Navigation Fixes:** Fixed a persistent scroll error in the Landing Page navigation bar that hindered smooth scrolling on mobile browsers.
* **Tab Scroll Correction:** Fixed the Gradient Overlay logic in the Admin Dashboard Tab Scroll to ensure smooth visual transitions.
* **System Logic:** Patched a Version Fallback error that occurred during specific edge-case deployment triggers.

---

## 📜 Version History

### **v1.4.1 (Current)**
* **Parity Update:** Synchronized Waiter mobile UI with Admin/Chef dashboards.
* **Bug Patch:** Fixed Navbar scrolling and Admin tab color glitches.
* **Architecture:** Added Tab support for future Takeaway/Delivery modes.

### **v1.4.0 (Mobile Optimization, Responsive UI & Waiter UX)**
#### 📱 UI/UX & Mobile
* **Mobile Overhaul:** Full CSS refactor for phone/tablet compatibility.
* **Fixed Modal Positioning:** Centered receipts within the active viewport.
* **Waiter Logic:** Tables now display "Occupancy Status" for better usability.
* **UI Polish:** Redesigned footer and cleaned up redundant labels.

### **v1.3.0 (Admin Modal, Chef Batch Orders & Minor Bugs)**
#### 👑 Admin Dashboard (Major UX Upgrade)
* **User Management Overhaul:** Completely redesigned the Users tab. Now features a card-based layout with role-specific icons (Shield for Admin, Hat for Chef, Tray for Waiter) and quick action buttons.
* **Visual Table Grid:** Tables are now displayed in a responsive grid with clear "Occupied/Available" status pills and active order tracking.
* **Live Admin "Take Order" Modal:** Admins can now view or edit active orders in a popup overlay in the Tables tab without leaving the dashboard. No more losing context by switching tabs!
* **Real-Time Monitoring:** The dashboard now auto-refreshes every 2 seconds. Watch table statuses turn from `Green` (Free) to `Red` (Occupied) instantly.
* **Embedded Waiter Mode:** The Waiter interface now runs seamlessly inside the Admin panel for quick order taking.
#### 👨‍🍳 Chef Dashboard (New Feature)
* **Batch Mode:** This is a high-performance mode designed for efficiency in busy kitchens. Instead of fulfilling orders ticket-by-ticket (e.g., "Table 1 needs a Burger", "Table 2 needs a Burger"), it aggregates identical items so chefs can cook in bulk.

### **v1.2.1 (Zero Latency UI Update)**
* **Zero-Latency Batch View:** The "Items to Prepare" list updates instantly when items are marked as "Done".
* **Smart Item Splitting:** Marking 1 item as "Ready" from a batch of 4 (e.g., "4x Coffees") now correctly splits them into (3 Preparing, 1 Ready).
* **ID Generation:** Implemented valid 24-char Hex ID generation for split items to fix server errors.
* **Honest Timestamps:** Removed artificial delays; items now display their exact order creation time.

### **v1.2.0 (Major Feature Release)**
#### 👨‍🍳 Chef Dashboard (Major Performance Update)
* **Tabbed Interface:** New organized view separating **Active Orders** from **Order History**.
* **Granular Workflow:** Track items through specific stages: `Preparing` ➝ `Ready` ➝ `Served`.
* **Performance Optimized:** Refactored rendering logic using memoization to ensure zero lag, even with 50+ active orders.
* **Crash Protection:** Enhanced stability to handle missing data or incomplete orders without freezing the display.
#### 🤵 Waiter Dashboard
* **Dual Submission Modes:**
    * **Auto-Submit:** Orders are sent to the kitchen immediately upon adding items.
    * **Manual Mode:** Waiters can build a "Pending List" and review it before sending to the chef.
* **Live Order Tracking:** visual indicators for when items are "Ready to Serve" vs "Preparing".
* **Receipt Generation:** Close orders, apply coupons, and calculate totals automatically.
#### 👑 Admin Dashboard
* **Financial Suite:**
    * **Export Data:** Download receipts as **PDF** invoices or **CSV** spreadsheets.
    * **Receipt Editor:** Fix mistakes by modifying items or quantities on past orders.
    * **Sales Analytics:** Filter sales by Date Range to track daily or weekly performance.
* **Menu & Staff:** Full CRUD operations for Menu Items, Tables, and Staff (Chefs/Waiters).
* **Smart Settings:**
    * **Site Control:** Toggle "Site Closed" to prevent non-admin logins.
    * **Tax Management:** Enable/Disable global tax rates.

---

## 🌟 Comprehensive Feature List

### 👑 Admin Module (Control Center)
The Admin dashboard is the brain of the operation, allowing full control over the restaurant's data and settings.
* **Menu Management:**
    * **CRUD Operations:** Add, Edit, and Delete menu items.
    * **Featured Dishes:** Toggle items as "Featured" to highlight them.
    * **Search & Filter:** Instantly search through menu items or filter by category.
* **Financial Suite:**
    * **Receipt Management:** View a full history of all orders. Sort by Date, Table, or Amount.
    * **Advanced Exports:** Download sales data as **PDF** or **CSV**.
* **Staff & Floor Management:**
    * **User Accounts:** Create and delete secure login credentials for Chefs and Waiters.
    * **Table Layout:** Add or remove tables and see which ones currently have active orders.
    * **Instant Order Taking:** Click any table to open the **Service Modal** and take orders immediately.

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

🤝 Contributing
Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

Developed by AbG
