// server/models/Schemas.js
const mongoose = require('mongoose');

// 1. USERS
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { type: String, enum: ['admin', 'waiter', 'chef'], required: true },
    hidden: { type: Boolean, default: false } // For the 'AbG' root user
});

// 2. MENU
// In store.js, you had { coffee: [...], breakfast: [...] }
// In DB, we store them as a list with a "category" tag.
const MenuItemSchema = new mongoose.Schema({
    category: { type: String, required: true }, // e.g., 'coffee'
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    featured: { type: Boolean, default: false }
});

// 3. TABLES
const TableSchema = new mongoose.Schema({
    name: { type: String, required: true },
    activeOrderId: { type: String, default: null } // We will store the Order ID string here
});

// 4. COUPONS
const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    value: { type: Number, required: true },
    active: { type: Boolean, default: true }
});

// 5. SETTINGS
const SettingsSchema = new mongoose.Schema({
    autoSubmitToChef: { type: Boolean, default: true },
    siteClosed: { type: Boolean, default: false },
    taxEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0, min: 0, max: 100 }
});

// 6. ORDERS (Complex Structure)
// We define the Item inside the order first
const OrderItemSchema = new mongoose.Schema({
    itemId: String, // Reference to Menu Item ID
    name: String,
    price: Number,
    qty: Number,
    status: { type: String, default: 'preparing' },
    createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
    tableId: String,
    items: [OrderItemSchema], // List of items
    status: { type: String, default: 'open' },
    foodStatus: { type: String, default: 'preparing' },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    kitchenPrepared: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Export all blueprints so other files can use them
module.exports = {
    User: mongoose.model('User', UserSchema),
    Menu: mongoose.model('Menu', MenuItemSchema),
    Table: mongoose.model('Table', TableSchema),
    Coupon: mongoose.model('Coupon', CouponSchema),
    Settings: mongoose.model('Settings', SettingsSchema),
    Order: mongoose.model('Order', OrderSchema)
};