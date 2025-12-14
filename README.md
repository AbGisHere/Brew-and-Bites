# ☕ Brew & Bites - Full Stack Cafe Management System
![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)

A comprehensive MERN Stack application for managing a modern cafe. This system digitizes the entire workflow—from customers browsing the menu to waiters taking orders, chefs managing the kitchen queue, and admins overseeing sales.

**🔗 Live Demo:** [https://brew-and-bites.vercel.app](https://brew-and-bites.vercel.app)  
*(Note: The backend is hosted on a free instance. Please allow 30-60 seconds for the server to wake up on the first load!)*

---

## 🚀 Version 1.2.0 Features

### 👨‍🍳 Chef Dashboard (Major Performance Update)
* **Tabbed Interface:** New organized view separating **Active Orders** from **Order History**.
* **Granular Workflow:** Track items through specific stages: `Preparing` ➝ `Ready` ➝ `Served`.
* **Performance Optimized:** Refactored rendering logic using memoization to ensure zero lag, even with 50+ active orders.
* **Crash Protection:** Enhanced stability to handle missing data or incomplete orders without freezing the display.

### 🤵 Waiter Dashboard
* **Dual Submission Modes:**
    * **Auto-Submit:** Orders are sent to the kitchen immediately upon adding items.
    * **Manual Mode:** Waiters can build a "Pending List" and review it before sending to the chef.
* **Live Order Tracking:** visual indicators for when items are "Ready to Serve" vs "Preparing".
* **Receipt Generation:** Close orders, apply coupons, and calculate totals automatically.

### 👑 Admin Dashboard
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
    * **Featured Dishes:** Toggle items as "Featured" to highlight them (with Star icons).
    * **Search & Filter:** Instantly search through menu items or filter by category.
* **Financial Suite:**
    * **Receipt Management:** View a full history of all orders. Sort by Date, Table, or Amount.
    * **Receipt Editor:** Fix mistakes by modifying items or quantities on past closed orders.
    * **Advanced Exports:** Download sales data as **PDF Invoices** or **CSV Spreadsheets** for accounting.
    * **Date Filtering:** Filter sales reports by specific Start and End dates.
* **Staff & Floor Management:**
    * **User Accounts:** Create and delete secure login credentials for Chefs and Waiters.
    * **Table Layout:** Add or remove tables and see which ones currently have active orders.
* **Marketing & Logic:**
    * **Coupon Manager :** Create Discount Codes (Percentage or Flat Amount) with specific usage limits.
    * **Global Settings:**
        * **Tax Control:** Enable/Disable global tax and set specific rates (e.g., 5% GST).
        * **Site Lock:** Remote "Kill Switch" to close the site for non-admins.
        * **Waiter Mode:** Force "Manual Submission" or "Auto-Submit" for all waiters.

### 🤵 Waiter Module (Service)
Designed for tablets and mobile devices to be used tableside.
* **Order Taking:**
    * **Visual Menu:** Browse items by category with prices and descriptions.
    * **Dual Submission Modes:**
        * *Auto-Mode:* Items sent to kitchen immediately.
        * *Manual-Mode:* Build a "Pending List" and review before firing the order.
* **Table Management:**
    * **Order Modification:** Increase/Decrease quantity or remove items before they are prepared.
    * **Live Status:** Visual indicators showing if items are "Preparing", "Ready to Serve", or "Served".
* **Billing:**
    * **Coupon Application:** Apply discount codes directly at the table.
    * **Instant Receipts:** Generate a preview of the final bill and close the table.
    * **Printable Receipts:** One-Click to print the final bill to be shared with customers.

### 👨‍🍳 Chef Module (Kitchen Display System)
A streamlined, real-time dashboard for the kitchen staff.
* **Workflow Tracking:**
    * **Granular Status:** Move items from `Preparing` ➝ `Ready` ➝ `Served`.
    * **Timestamps:** Track exactly when an order came in and when it was completed.
* **Views:**
    * **Active Tab:** Focus only on what needs to be cooked right now.
    * **History Tab:** Review previously completed orders.
* **Performance:**
    * **Zero-Lag Rendering:** Optimized for performance to handle 50+ active orders without freezing.
    * **Defensive Data Handling:** Prevents crashes even if order data is incomplete.

---

## 🔮 Future Roadmap

We are actively working on Version 2.0 with these advanced features:

* **🔥 Batch View (In Progress):** A dedicated KDS view for chefs to see item totals (e.g., "5x Burgers to cook") rather than just individual tickets.
* **📱 User/Customer Dashboard:** A dedicated interface allowing customers to scan a QR code at their table and place orders directly from their phones (Self-Ordering).
* **📈 Advanced Analytics:** Visual charts and graphs to analyze peak hours and best-selling items.

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
