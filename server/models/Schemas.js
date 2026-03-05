// server/models/Schemas.js
const mongoose = require('mongoose');

// 0. RESTAURANTS (Super Admin level)
const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

// 1. USERS
const UserSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }, // Null for super admin ('AbG')
    username: { type: String, required: true, unique: true }, // Must be globally unique for login
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'waiter', 'chef'], required: true },
    hidden: { type: Boolean, default: false } // For the 'AbG' root user
});


// 2. MENU
// In store.js, you had { coffee: [...], breakfast: [...] }
// In DB, we store them as a list with a "category" tag.
const MenuItemSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    category: { type: String, required: true }, // e.g., 'coffee'
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    featured: { type: Boolean, default: false },
    available: { type: Boolean, default: true }
});

// 3. TABLES
const TableSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true },
    tableCode: { type: String, required: true, unique: true }, // 6-digit unique code
    qrCode: { type: String }, // QR code data URL
    activeOrderId: { type: String, default: null } // We will store the Order ID string here
});

// 4. COUPONS
const CouponSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    code: { type: String, required: true }, // Not globally unique anymore

    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, required: true },
    maxUses: { type: Number, default: null },
    minOrderValue: { type: Number, default: null },
    allowedDays: { type: [Number], default: [] }, // Array of day indices (0-6, 0=Monday)
    allowedHours: {
        start: { type: String, default: '00:00' },
        end: { type: String, default: '23:59' }
    },
    usedCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    validFrom: { type: Date, default: null }, // Optional start date
    validTo: { type: Date, default: null } // Optional end date
});

// 5. SETTINGS
const SettingsSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    autoSubmitToChef: { type: Boolean, default: true },
    siteClosed: { type: Boolean, default: false },
    taxEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },

    // Restaurant Information (with show/hide toggles)
    showRestaurantName: { type: Boolean, default: true },
    restaurantName: { type: String, default: '' },
    showRestaurantAddress: { type: Boolean, default: true },
    restaurantAddress: { type: String, default: '' },
    showContactNumber: { type: Boolean, default: true },
    contactNumber: { type: String, default: '' },
    showEmail: { type: Boolean, default: true },
    email: { type: String, default: '' },
    showRestaurantLogo: { type: Boolean, default: true },
    restaurantLogo: { type: String, default: '' }, // Base64 encoded image or URL

    // Tax & Regulatory Information (with show/hide toggles)
    showGSTNumber: { type: Boolean, default: false },
    gstNumber: { type: String, default: '' },
    showFSSAINumber: { type: Boolean, default: false },
    fssaiNumber: { type: String, default: '' },

    // Additional Options
    includeQRInInvoice: { type: Boolean, default: true },

    // Order Information
    showOrderTime: { type: Boolean, default: true },
    showOrderDate: { type: Boolean, default: true },
    showOrderID: { type: Boolean, default: false }
});

// 6. ORDERS (Complex Structure)
// We define the Item inside the order first
const OrderItemSchema = new mongoose.Schema({
    itemId: String, // Reference to Menu Item ID
    name: String,
    price: Number,
    qty: Number,
    status: { type: String, default: 'preparing' },
    createdAt: { type: Date, default: Date.now },
    // New timing fields for items
    startedAt: { type: Date },
    completedAt: { type: Date },
    timeToComplete: { type: Number }, // in seconds
    orderedBy: { type: String, default: null } // Name of the guest who ordered this item
});

const OrderSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    tableId: String,
    customerId: String, // Customer who placed the order
    items: [OrderItemSchema], // List of items
    status: { type: String, default: 'open' }, // Main order status (open/completed)
    chefStatus: { type: String, default: 'preparing' }, // Tracks chef's completion status
    foodStatus: { type: String, default: 'preparing' },
    orderStatusChef: { type: String, default: 'All items prepared' },
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    kitchenPrepared: { type: Boolean, default: false },
    // Guests seated at this table for this order (for per-person tracking)
    guests: [{
        name: { type: String, required: true },
        phone: { type: String, default: '' },
        joinedAt: { type: Date, default: Date.now }
    }],
    // Order timing fields
    createdAt: { type: Date, default: Date.now },
    orderTime: { type: Date, default: Date.now },
    startedAt: { type: Date },
    completedAt: { type: Date },
    timeToComplete: { type: Number } // in seconds
});

// 7. ACCESS LOG
const AccessLogSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    pageType: { type: String, required: true }, // 'Admin', 'Waiter', 'Chef', 'TableDevice'
    userId: { type: String, default: null }, // User ID if authenticated
    tableId: { type: String, default: null }, // Table ID for table/device access
    deviceId: { type: String, default: null }, // Device ID for table/device access
    deviceInfo: {
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
        ip: String
    },
    createdAt: { type: Date, default: Date.now }
});

// Export all blueprints so other files can use them
module.exports = {
    Restaurant: mongoose.model('Restaurant', RestaurantSchema),
    User: mongoose.model('User', UserSchema),
    Menu: mongoose.model('Menu', MenuItemSchema),
    Table: mongoose.model('Table', TableSchema),
    Coupon: mongoose.model('Coupon', CouponSchema),
    Settings: mongoose.model('Settings', SettingsSchema),
    Order: mongoose.model('Order', OrderSchema),
    AccessLog: mongoose.model('AccessLog', AccessLogSchema)
};