# ☕ Brew & Bites - Full Stack Cafe Management System
![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)

A comprehensive MERN Stack application for managing a modern cafe. This system digitizes the entire workflow—from customers browsing the menu to waiters taking orders, chefs managing the kitchen queue, and admins overseeing sales.

**🔗 Live Demo:** [https://brew-and-bites.vercel.app](https://brew-and-bites.vercel.app)  
*(Note: The backend is hosted on a free instance. Please allow 30-60 seconds for the server to wake up on the first load!)*

---

## 🚀 Current Features

### 👨‍🍳 Chef Dashboard
* **Real-time Order Queue:** View incoming orders instantly.
* **Status Toggles:** Mark items as "Preparing" or "Ready" with a single click.
* **Table Identification:** Know exactly which table ordered what.

### 🤵 Waiter Dashboard
* **Table Management:** Select active tables and manage orders.
* **Live Menu:** Browse categories and add items to the bill.
* **Order Status:** See when food is "Ready to Serve" vs "Preparing".
* **Receipt Generation:** Close orders and calculate totals automatically.

### 👑 Admin Dashboard
* **Menu Management:** Add, edit, delete, and feature dishes.
* **Staff Management:** Create accounts for new Chefs and Waiters.
* **Advanced Sales & Finance:**
  * **Export Data:** Download receipts as **PDF** invoices or **CSV** files.
  * **Tax Control:** Set a global Tax % applied to orders.
  * **Edit Receipts:** Modify past orders (change items, quantities, or remove coupons) to fix errors.
  * **Smart Sorting:** Filter receipts by Date, Order Value, or Order ID.
  * **Table Tracking:** View the specific Table Number on every receipt.
* **Coupon Manager 2.0:** Create discount codes with **Usage Limits** (e.g., "First 100 users only").
* **Site Settings:** Toggle "Auto-Submit to Kitchen" or close the site.

---

## 🔮 Future Roadmap (Upcoming Updates)

We are actively working on Version 2.0 with these advanced features:

* **📱 User/Customer Dashboard:** A dedicated interface allowing customers to scan a QR code at their table and place orders directly from their phones (Self-Ordering).
* **📈 Advanced Analytics & Sales Tracking:** Visual charts and graphs to analyze daily revenue trends, peak hours, and best-selling items.
* **🔥 Enhanced Kitchen Display System (KDS):** Upgrading the Chef Dashboard with preparation timers, order history logs, and multi-station support.

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