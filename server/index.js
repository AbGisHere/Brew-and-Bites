// server/index.js
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDatabase } = require('./db');
// Import the Schemas we created in Step 4
// New (FIXED)
const { Restaurant, User, Menu, Table, Coupon, Settings, Order, AccessLog } = require('./models/Schemas');
// Import auto-seed functionality
const { seedDatabase } = require('./utils/autoSeed');

const app = express();
// Use the PORT environment variable provided by the render host, defaulting to 5001 only if not set.

// 1. Connect to DB and auto-seed
const initializeDatabase = async () => {
    try {
        // Connect to central database for Super Admin functionality
        const centralDB = getDatabase();
        await centralDB;
        console.log('✅ Central database connected');

        // Register Restaurant model with central connection
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const User = centralDB.model('User', require('./models/Schemas').UserSchema);

        // Wait a bit for connection to establish before seeding
        setTimeout(async () => {
            await seedDatabase();
        }, 1000);
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

initializeDatabase();

// 2. Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'https://brew-and-bites.vercel.app'], // Add your Frontend URL here
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-restaurant-id']
})); // Allow React to talk to us
app.use(express.json()); // Allow reading JSON bodies

// --- ROUTE PARAMETERS ---
app.param('restaurantSlug', (req, res, next, restaurantSlug) => {
    req.params.restaurantSlug = restaurantSlug;
    next();
});

// --- Multi-Restaurant Context Middleware ---
app.use(async (req, res, next) => {
    try {
        let restId = req.headers['x-restaurant-id'];
        let restaurantSlug = req.params.restaurantSlug; // From URL like /brew-and-bites/admin

        // Handle Super Admin routes that don't need restaurant context
        if (req.path.startsWith('/api/superadmin')) {
            return next();
        }

        // If we have a restaurant slug in URL, get restaurant info from central DB
        if (restaurantSlug) {
            const centralDB = getDatabase();
            const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
            const restaurant = await Restaurant.findOne({ slug: restaurantSlug });

            if (restaurant) {
                restId = restaurant._id.toString();
                // Connect to specific restaurant database for data operations
                req.restaurantDB = getDatabase(restaurantSlug);
            } else {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
        } else if (restId) {
            // Use provided restaurant ID and connect to appropriate database
            req.restaurantDB = getDatabase(); // Will use routing logic to determine DB
        } else {
            // Fallback for public routes or legacy clients: Default to Brew and Bites
            const centralDB = getDatabase();
            const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
            const defaultRest = await Restaurant.findOne({ name: 'Brew and Bites' });
            if (defaultRest) {
                restId = defaultRest._id.toString();
                req.restaurantDB = getDatabase('brew-and-bites');
            }
        }

        if (restId) {
            // Check suspension status
            const centralDB = getDatabase();
            const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
            const restaurant = await Restaurant.findById(restId);
            if (restaurant && restaurant.status === 'suspended') {
                return res.status(403).json({ error: 'This restaurant is currently suspended.' });
            }
        }

        req.restaurantId = restId;
        next();
    } catch (err) {
        console.error('Context Middleware Error:', err);
        next();
    }
});

// --- Demo customer OTP/session store (in-memory) ---
// NOTE: This is intended for demo/dev only. OTP is hashed and never returned from the API.
// For production, replace with SMS provider + persistent store.
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'fallback_secret'
const DEMO_OTP_TTL_MS = 5 * 60 * 1000
const demoOtpStore = new Map() // phone -> { otpHash, expiresAt, name }

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '')

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex')

const generateOtp = () => {
    // 6-digit numeric OTP
    return String(Math.floor(100000 + Math.random() * 900000))
}

const signCustomerToken = ({ phone, name }) => {
    return jwt.sign(
        { phone, name, type: 'customer' },
        CUSTOMER_JWT_SECRET,
        { expiresIn: '7d' }
    )
}

const requireCustomerAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' })
        }
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET)
        if (!decoded || decoded.type !== 'customer') {
            return res.status(401).json({ error: 'Invalid token' })
        }
        req.customer = decoded
        next()
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' })
    }
}

// --- ROUTES ---

// A. TEST ROUTE
app.get('/', (req, res) => {
    res.send("Backend is running!");
});

// Version endpoint
app.get('/api/version', (req, res) => {
    res.json({ version: '1.4.2' });
});

// --- Customer demo OTP auth ---
app.post('/api/customer/auth/request-otp', async (req, res) => {
    try {
        const { phone } = req.body || {}
        const normalizedPhone = normalizePhone(phone)
        if (!normalizedPhone || normalizedPhone.length < 10) {
            return res.status(400).json({ error: 'Invalid phone number' })
        }

        const otp = generateOtp()
        demoOtpStore.set(normalizedPhone, {
            otpHash: hashOtp(otp),
            expiresAt: Date.now() + DEMO_OTP_TTL_MS,
        })

        // Never return OTP to client. For demo/dev, print to server logs.
        console.log(`[DEMO OTP] phone=${normalizedPhone} otp=${otp} (expires in 5 min)`)

        return res.json({ success: true })
    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
})

app.post('/api/customer/auth/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body || {}
        const normalizedPhone = normalizePhone(phone)
        const record = demoOtpStore.get(normalizedPhone)
        if (!record) return res.status(400).json({ error: 'OTP not requested or expired' })
        if (Date.now() > record.expiresAt) {
            demoOtpStore.delete(normalizedPhone)
            return res.status(400).json({ error: 'OTP expired' })
        }
        if (hashOtp(otp) !== record.otpHash) {
            return res.status(400).json({ error: 'Invalid OTP' })
        }

        demoOtpStore.delete(normalizedPhone)
        // Name is not known yet — it's chosen in the identity step after OTP verification.
        // Return only the verified phone; frontend handles session state.
        return res.json({ success: true, phone: normalizedPhone })
    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
})

app.get('/api/customer/me', requireCustomerAuth, async (req, res) => {
    return res.json({ customer: { phone: req.customer.phone, name: req.customer.name } })
})

// Access Logging endpoint
app.post('/api/log-access', async (req, res) => {
    try {
        const { pageType, userId, tableId, deviceId, deviceInfo } = req.body;

        // Create access log entry
        const accessLog = await (req.restaurantDB ? (req.restaurantDB.models.AccessLog || req.restaurantDB.model('AccessLog', require('./models/Schemas').AccessLogSchema)) : getDatabase().model('AccessLog', require('./models/Schemas').AccessLogSchema)).create({
            restaurantId: req.restaurantId,
            pageType,
            userId,
            tableId,
            deviceId,
            deviceInfo: {
                ...deviceInfo,
                timestamp: new Date(deviceInfo.timestamp) // Ensure proper Date object
            }
        });

        res.json({ success: true, logId: accessLog._id });
    } catch (error) {
        console.error('Access logging error:', error);
        res.status(500).json({ error: 'Failed to log access' });
    }
});

// Get access logs (admin only)
app.get('/api/access-logs', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(decoded.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { pageType, startDate, endDate, limit = 100 } = req.query;

        // Build filter
        const filter = { restaurantId: req.restaurantId };
        if (pageType) filter.pageType = pageType;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const logs = await (req.restaurantDB ? (req.restaurantDB.models.AccessLog || req.restaurantDB.model('AccessLog', require('./models/Schemas').AccessLogSchema)) : getDatabase().model('AccessLog', require('./models/Schemas').AccessLogSchema)).find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'username role');

        res.json(logs);
    } catch (error) {
        console.error('Error fetching access logs:', error);
        res.status(500).json({ error: 'Failed to fetch access logs' });
    }
});

// B. SEED ROUTE (This replaces your store.js seedData)
// Run this ONCE to fill your database
app.get('/api/seed', async (req, res) => {
    try {
        console.log("Seeding database...");
        res.json({ message: "Seed disabled after migration to multi-tenant." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// C. GET MENU ROUTE
app.get('/api/menu', async (req, res) => {
    const items = await (req.restaurantDB ? (req.restaurantDB.models.Menu || req.restaurantDB.model('Menu', require('./models/Schemas').MenuItemSchema)) : getDatabase().model('Menu', require('./models/Schemas').MenuItemSchema)).find({ restaurantId: req.restaurantId });
    res.json(items);
});

// D. GET TABLES
app.get('/api/tables', async (req, res) => {
    const tables = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).find({ restaurantId: req.restaurantId });
    res.json(tables);
});

// D.1 GET TABLE BY CODE
app.get('/api/tables/by-code/:code', async (req, res) => {
    try {
        const table = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOne({ tableCode: req.params.code });
        if (!table) {
            return res.status(404).json({ error: "Invalid table code" });
        }
        res.json(table);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// D.2 GENERATE TABLE CODES AND QR CODES
app.post('/api/tables/generate-codes', async (req, res) => {
    try {
        const tables = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).find();

        // Generate unique 6-digit codes and QR codes for ALL tables
        for (const table of tables) {
            let code;
            let isUnique = false;

            // Generate unique 6-digit code
            while (!isUnique) {
                code = Math.floor(100000 + Math.random() * 900000).toString();
                const existingTable = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOne({ tableCode: code, _id: { $ne: table._id } });
                if (!existingTable) {
                    isUnique = true;
                }
            }

            table.tableCode = code;
            // Generate dynamic URL using the frontend URL from settings or fallback to localhost
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            table.qrCode = `${frontendUrl}/order?table=${code}`;
            await table.save();
        }

        res.json({ message: "Table codes and QR codes generated successfully", tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// E. GET USERS (Only for testing! Don't keep this in production)
app.get('/api/users', async (req, res) => {
    const users = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).find({ restaurantId: req.restaurantId });
    res.json(users);
});

// F. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Since login can happen globally (from Central Hub), we always check the Central Database for users.
        // Or if users are per-tenant, we should check centralDB first for SuperAdmins
        const { getDatabase } = require('./db');
        const centralDb = await getDatabase();
        const User = centralDb.model('User', require('./models/Schemas').UserSchema);

        let userDbModels = req.dbModels; // if restaurant context exists

        // Search for the user globally initially
        let user = await User.findOne({
            username: { $regex: new RegExp("^" + username + "$", "i") }
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // SECURE PASSWORD CHECK (Bcrypt)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // If a user belongs to a restaurant and requires checking settings
        if (user.restaurantId) {
            const restaurantDb = await getDatabase(user.restaurantId.toString());
            const Settings = restaurantDb.model('Settings', require('./models/Schemas').SettingsSchema);
            const settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).findOne() || { siteClosed: false };

            // Check if site is closed - only allow super admin (AbG) to log in
            if (settings.siteClosed && user.username.toLowerCase() !== 'abg') {
                return res.status(403).json({
                    message: "The site is currently closed. Contact the Owner/Creator"
                });
            }
        }

        // Success!
        res.json({
            id: user._id,
            username: user.username,
            role: user.role,
            restaurantId: user.restaurantId || null
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Server error during login" });
    }
});

// --- ADMIN ROUTES (Add these to server/index.js) ---

// ==========================================
// --- SUPER ADMIN ROUTES (AbG ONLY) ---
// ==========================================

const verifySuperAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];

        // Validate token
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const { getDatabase } = require('./db');
        const centralDb = await getDatabase();
        const User = centralDb.model('User', require('./models/Schemas').UserSchema);

        // In this setup, token is just the user ID for admins
        const user = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(token);
        if (!user || user.username.toLowerCase() !== 'abg') {
            return res.status(403).json({ error: 'Forbidden. Super Admin only.' });
        }
        next();
    } catch (e) {
        console.error('Super Admin Verification Error:', e);
        res.status(500).json({ error: 'Server error verifying super admin' });
    }
};

// List all restaurants
app.get('/api/superadmin/restaurants', verifySuperAdmin, async (req, res) => {
    try {
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const restaurants = await Restaurant.find({}).sort({ createdAt: -1 });
        res.json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Restaurant Hub - Get all restaurants for main landing page
app.get('/api/restaurants', async (req, res) => {
    try {
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const restaurants = await Restaurant.find({ status: 'active' }).sort({ createdAt: -1 });

        // Add slug if not present (for backward compatibility)
        const restaurantsWithSlugs = restaurants.map(rest => ({
            ...rest.toObject(),
            slug: rest.slug || rest.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        }));

        res.json(restaurantsWithSlugs);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add a new restaurant
app.post('/api/superadmin/restaurants', verifySuperAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        // Generate slug from name
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const newRest = await Restaurant.create({ name, slug });
        res.json(newRest);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Toggle restaurant status
app.put('/api/superadmin/restaurants/:id/toggle', verifySuperAdmin, async (req, res) => {
    try {
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

        restaurant.status = restaurant.status === 'active' ? 'suspended' : 'active';
        await restaurant.save();
        res.json(restaurant);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete a restaurant
app.delete('/api/superadmin/restaurants/:id', verifySuperAdmin, async (req, res) => {
    try {
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

        // Delete the restaurant's database if it exists
        if (restaurant.slug) {
            const restaurantDB = getDatabase(restaurant.slug);
            await restaurantDB.dropDatabase();
            console.log(`🗑️ Deleted database for restaurant: ${restaurant.slug}`);
        }

        // Delete restaurant from central database
        await Restaurant.findByIdAndDelete(req.params.id);

        res.json({ message: 'Restaurant deleted successfully' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Edit a restaurant
app.put('/api/superadmin/restaurants/:id', verifySuperAdmin, async (req, res) => {
    try {
        const { name, landingPage, domain } = req.body;
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

        // Update fields
        if (name) restaurant.name = name;
        if (landingPage) restaurant.landingPage = landingPage;
        if (domain !== undefined) restaurant.domain = domain;

        // Update slug if name changed
        if (name && name !== restaurant.name) {
            restaurant.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }

        await restaurant.save();
        res.json(restaurant);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get analytics/overview
app.get('/api/superadmin/analytics', verifySuperAdmin, async (req, res) => {
    try {
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);

        const restaurants = await Restaurant.find();
        let totalEarnings = 0;
        let totalOrders = 0;

        for (const rest of restaurants) {
            if (rest.slug) {
                const restaurantDB = getDatabase(rest.slug);
                const Order = restaurantDB.models.Order || restaurantDB.model('Order', require('./models/Schemas').OrderSchema);

                const closedOrders = await Order.find({ status: 'closed' });
                totalEarnings += closedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                totalOrders += await Order.countDocuments();
            }
        }

        const activeRestaurants = await Restaurant.countDocuments({ status: 'active' });
        const suspendedRestaurants = await Restaurant.countDocuments({ status: 'suspended' });
        res.json({
            totalEarnings,
            totalOrders,
            activeRestaurants,
            suspendedRestaurants
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
// ==========================================


// 0. ADMIN USER MANAGEMENT
// Get all users (superadmin only)
app.get('/api/admin/users', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        // Validate token
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const centralDb = getDatabase();
        const User = centralDb.model('User', require('./models/Schemas').UserSchema);
        const user = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(token);

        if (!user || user.username.toLowerCase() !== 'abg') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const users = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).find({}, { password: 0 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new admin (superadmin only)
app.post('/api/admin/users', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];

        // Validate token
        if (!token || token === 'undefined' || token === 'null') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const currentUser = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(token);

        if (!currentUser || currentUser.username.toLowerCase() !== 'abg') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const { username, password, role = 'admin' } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if user already exists
        const existingUser = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).create({
            username,
            password: hashedPassword,
            role,
            hidden: false
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser.toObject();

        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- NEW CODE: Force Reset Password (Tiered Permissions) ---
app.put('/api/admin/users/:id/reset-password', async (req, res) => {
    try {
        // 1. Verify the Requester
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const requesterId = authHeader.split(' ')[1];

        // Validate token
        if (!requesterId || requesterId === 'undefined' || requesterId === 'null') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const requester = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(requesterId);

        // Basic check: Must be at least an admin (or superadmin)
        if (!requester || (requester.role !== 'admin' && requester.username !== 'AbG')) {
            return res.status(403).json({ error: 'Forbidden: Access denied' });
        }

        // 2. Identify the Target
        const targetUser = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(req.params.id);
        if (!targetUser) {
            return res.status(404).json({ error: 'Target user not found' });
        }

        // 3. TIERED PERMISSION LOGIC
        const isSuperAdmin = requester.username === 'AbG';

        if (!isSuperAdmin) {
            // Restriction A: Cannot reset Super Admin
            if (targetUser.username === 'AbG') {
                return res.status(403).json({ error: 'You cannot reset the Super Admin.' });
            }
            // Restriction B: Cannot reset other Admins
            if (targetUser.role === 'admin') {
                return res.status(403).json({ error: 'Only Super Admin can reset other Admins.' });
            }
        }

        // 4. Perform the Reset
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ error: 'New password must be at least 4 characters' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        targetUser.password = hashedPassword;
        await targetUser.save();

        res.json({ message: `Password for ${targetUser.username} (${targetUser.role}) has been reset.` });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// -----------------------------------------------------------


// 1. MENU MANAGEMENT
// Add new item
app.post('/api/menu', async (req, res) => {
    try {
        const newItem = await (req.restaurantDB ? (req.restaurantDB.models.Menu || req.restaurantDB.model('Menu', require('./models/Schemas').MenuItemSchema)) : getDatabase().model('Menu', require('./models/Schemas').MenuItemSchema)).create({ ...req.body, restaurantId: req.restaurantId });
        res.json(newItem);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Edit item
app.put('/api/menu/:id', async (req, res) => {
    try {
        // Ensure we only edit items belonging to this restaurant
        const updatedItem = await (req.restaurantDB ? (req.restaurantDB.models.Menu || req.restaurantDB.model('Menu', require('./models/Schemas').MenuItemSchema)) : getDatabase().model('Menu', require('./models/Schemas').MenuItemSchema)).findOneAndUpdate(
            { _id: req.params.id, restaurantId: req.restaurantId },
            req.body,
            { new: true }
        );
        res.json(updatedItem);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        await (req.restaurantDB ? (req.restaurantDB.models.Menu || req.restaurantDB.model('Menu', require('./models/Schemas').MenuItemSchema)) : getDatabase().model('Menu', require('./models/Schemas').MenuItemSchema)).findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. TABLE MANAGEMENT
app.post('/api/tables', async (req, res) => {
    try {
        const { name } = req.body;

        // Generate unique 6-digit code
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = Math.floor(100000 + Math.random() * 900000).toString();
            // Ensure code is globally unique across all restaurants to make joining easy
            const existingTable = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOne({ tableCode: code });
            if (!existingTable) {
                isUnique = true;
            }
        }

        // Generate dynamic URL using the frontend URL from settings or fallback to localhost
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const newTable = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).create({
            restaurantId: req.restaurantId,
            name,
            tableCode: code,
            qrCode: `${frontendUrl}/order?table=${code}`
        });
        res.json(newTable);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/tables/:id', async (req, res) => {
    try {
        await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add User (With Hashing)
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Hash the password before creating
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).create({
            restaurantId: req.restaurantId,
            username,
            password: hashedPassword,
            role
        });

        res.json(newUser);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. COUPONS
app.get('/api/coupons', async (req, res) => {
    const coupons = await (req.restaurantDB ? (req.restaurantDB.models.Coupon || req.restaurantDB.model('Coupon', require('./models/Schemas').CouponSchema)) : getDatabase().model('Coupon', require('./models/Schemas').CouponSchema)).find({ restaurantId: req.restaurantId });
    res.json(coupons);
});

app.post('/api/coupons', async (req, res) => {
    try {
        const { code, type, value, maxUses, minOrderValue, allowedDays, allowedHours, validFrom, validTo } = req.body;

        // Validate required fields
        if (!code || !type || value === undefined) {
            return res.status(400).json({ error: 'Code, type, and value are required' });
        }

        // Validate discount type and value
        if (type === 'percentage' && (value < 0 || value > 100)) {
            return res.status(400).json({ error: 'Percentage discount must be between 0 and 100' });
        }
        if (type === 'fixed' && value < 0) {
            return res.status(400).json({ error: 'Fixed discount must be greater than or equal to 0' });
        }

        // Validate date fields if provided
        if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
            return res.status(400).json({ error: 'Valid From date cannot be after Valid To date' });
        }

        // Validate time format if provided
        if (allowedHours) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(allowedHours.start) || !timeRegex.test(allowedHours.end)) {
                return res.status(400).json({ error: 'Invalid time format. Use HH:MM format' });
            }
        }

        // Check if coupon code already exists for this restaurant
        const existingCoupon = await (req.restaurantDB ? (req.restaurantDB.models.Coupon || req.restaurantDB.model('Coupon', require('./models/Schemas').CouponSchema)) : getDatabase().model('Coupon', require('./models/Schemas').CouponSchema)).findOne({ code: code.toUpperCase(), restaurantId: req.restaurantId });
        if (existingCoupon) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const newCoupon = await (req.restaurantDB ? (req.restaurantDB.models.Coupon || req.restaurantDB.model('Coupon', require('./models/Schemas').CouponSchema)) : getDatabase().model('Coupon', require('./models/Schemas').CouponSchema)).create({
            restaurantId: req.restaurantId,
            code: code.toUpperCase(),
            type,
            value,
            maxUses: maxUses || null,
            minOrderValue: minOrderValue || null,
            allowedDays: allowedDays || [],
            allowedHours: allowedHours || { start: '00:00', end: '23:59' },
            validFrom: validFrom ? new Date(validFrom) : null,
            validTo: validTo ? new Date(validTo) : null
        });

        res.json(newCoupon);
    } catch (e) {
        console.error('Error creating coupon:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/coupons/:code', async (req, res) => {
    try {
        const { type, value, maxUses, minOrderValue, allowedDays, allowedHours, validFrom, validTo } = req.body;

        // Validate required fields
        if (!type || value === undefined) {
            return res.status(400).json({ error: 'Type and value are required' });
        }

        // Validate discount type and value
        if (type === 'percentage' && (value < 0 || value > 100)) {
            return res.status(400).json({ error: 'Percentage discount must be between 0 and 100' });
        }
        if (type === 'fixed' && value < 0) {
            return res.status(400).json({ error: 'Fixed discount must be greater than or equal to 0' });
        }

        // Validate date fields if provided
        if (validFrom && validTo && new Date(validFrom) > new Date(validTo)) {
            return res.status(400).json({ error: 'Valid From date cannot be after Valid To date' });
        }

        // Validate time format if provided
        if (allowedHours) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(allowedHours.start) || !timeRegex.test(allowedHours.end)) {
                return res.status(400).json({ error: 'Invalid time format. Use HH:MM format' });
            }
        }

        const updatedCoupon = await (req.restaurantDB ? (req.restaurantDB.models.Coupon || req.restaurantDB.model('Coupon', require('./models/Schemas').CouponSchema)) : getDatabase().model('Coupon', require('./models/Schemas').CouponSchema)).findOneAndUpdate(
            { code: req.params.code, restaurantId: req.restaurantId },
            {
                type,
                value,
                maxUses: maxUses || null,
                minOrderValue: minOrderValue || null,
                allowedDays: allowedDays || [],
                allowedHours: allowedHours || { start: '00:00', end: '23:59' },
                validFrom: validFrom ? new Date(validFrom) : null,
                validTo: validTo ? new Date(validTo) : null
            },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        res.json(updatedCoupon);
    } catch (e) {
        console.error('Error updating coupon:', e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/coupons/:code', async (req, res) => {
    try {
        await (req.restaurantDB ? (req.restaurantDB.models.Coupon || req.restaurantDB.model('Coupon', require('./models/Schemas').CouponSchema)) : getDatabase().model('Coupon', require('./models/Schemas').CouponSchema)).findOneAndDelete({ code: req.params.code, restaurantId: req.restaurantId });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/coupons/validate', async (req, res) => {
    try {
        const { code, orderTotal } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Coupon code is required' });
        }

        const coupon = await (req.restaurantDB ? (req.restaurantDB.models.Coupon || req.restaurantDB.model('Coupon', require('./models/Schemas').CouponSchema)) : getDatabase().model('Coupon', require('./models/Schemas').CouponSchema)).findOne({ code: code.toUpperCase(), restaurantId: req.restaurantId });
        if (!coupon) {
            return res.status(404).json({ error: 'Invalid coupon code' });
        }

        // Check if coupon has exceeded max uses
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ error: 'Coupon has reached maximum usage limit' });
        }

        // Check minimum order value
        if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
            return res.status(400).json({
                error: `Minimum order value of ₹${coupon.minOrderValue} required`
            });
        }

        // Check if coupon is valid for current day
        if (coupon.allowedDays && coupon.allowedDays.length > 0) {
            const currentDay = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
            const adjustedDay = currentDay === 0 ? 6 : currentDay - 1; // Convert to 0=Monday, 6=Sunday
            if (!coupon.allowedDays.includes(adjustedDay)) {
                return res.status(400).json({ error: 'Coupon not valid for today' });
            }
        }

        // Check if coupon is valid for current time
        if (coupon.allowedHours) {
            const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
            if (currentTime < coupon.allowedHours.start || currentTime > coupon.allowedHours.end) {
                return res.status(400).json({
                    error: `Coupon only valid between ${coupon.allowedHours.start} and ${coupon.allowedHours.end}`
                });
            }
        }

        // Check if coupon is valid from date
        if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) {
            return res.status(400).json({
                error: `Coupon is not valid until ${new Date(coupon.validFrom).toLocaleDateString()}`
            });
        }

        // Check if coupon is valid until date
        if (coupon.validTo && new Date() > new Date(coupon.validTo)) {
            return res.status(400).json({
                error: `Coupon expired on ${new Date(coupon.validTo).toLocaleDateString()}`
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = (orderTotal * coupon.value) / 100;
        } else {
            discountAmount = coupon.value;
        }

        // Ensure discount doesn't exceed order total
        discountAmount = Math.min(discountAmount, orderTotal);

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                discountAmount,
                maxUses: coupon.maxUses,
                usedCount: coupon.usedCount,
                remainingUses: coupon.maxUses ? coupon.maxUses - coupon.usedCount : null,
                minOrderValue: coupon.minOrderValue,
                allowedDays: coupon.allowedDays,
                allowedHours: coupon.allowedHours,
                validFrom: coupon.validFrom,
                validTo: coupon.validTo
            },
            message: 'Coupon applied successfully'
        });

    } catch (e) {
        console.error('Error validating coupon:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/coupons/use/:code', async (req, res) => {
    try {
        const coupon = await (req.restaurantDB ? (req.restaurantDB.models.Coupon || req.restaurantDB.model('Coupon', require('./models/Schemas').CouponSchema)) : getDatabase().model('Coupon', require('./models/Schemas').CouponSchema)).findOne({ code: req.params.code.toUpperCase(), restaurantId: req.restaurantId });
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        coupon.usedCount += 1;
        await coupon.save();

        res.json({ message: 'Coupon usage recorded', usedCount: coupon.usedCount });
    } catch (e) {
        console.error('Error recording coupon usage:', e);
        res.status(500).json({ error: e.message });
    }
});

// 4.1 MIGRATION: Add invoice settings fields to existing settings
app.get('/api/migrate/settings', async (req, res) => {
    try {
        const settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).findOne({ restaurantId: req.restaurantId });
        if (settings) {
            // Add existing tax fields if they don't exist
            if (settings.taxEnabled === undefined) {
                settings.taxEnabled = false;
            }
            if (settings.taxRate === undefined) {
                settings.taxRate = 0;
            }

            // Add restaurant information fields
            if (settings.showRestaurantName === undefined) {
                settings.showRestaurantName = true;
            }
            if (settings.restaurantName === undefined) {
                settings.restaurantName = '';
            }
            if (settings.showRestaurantAddress === undefined) {
                settings.showRestaurantAddress = true;
            }
            if (settings.restaurantAddress === undefined) {
                settings.restaurantAddress = '';
            }
            if (settings.showContactNumber === undefined) {
                settings.showContactNumber = true;
            }
            if (settings.contactNumber === undefined) {
                settings.contactNumber = '';
            }
            if (settings.showEmail === undefined) {
                settings.showEmail = true;
            }
            if (settings.email === undefined) {
                settings.email = '';
            }
            if (settings.showRestaurantLogo === undefined) {
                settings.showRestaurantLogo = true;
            }
            if (settings.restaurantLogo === undefined) {
                settings.restaurantLogo = '';
            }

            // Add tax & regulatory information fields
            if (settings.showGSTNumber === undefined) {
                settings.showGSTNumber = false;
            }
            if (settings.gstNumber === undefined) {
                settings.gstNumber = '';
            }
            if (settings.showFSSAINumber === undefined) {
                settings.showFSSAINumber = false;
            }
            if (settings.fssaiNumber === undefined) {
                settings.fssaiNumber = '';
            }

            // Add additional options
            if (settings.includeQRInInvoice === undefined) {
                settings.includeQRInInvoice = true;
            }

            // Add order information fields
            if (settings.showOrderTime === undefined) {
                settings.showOrderTime = true;
            }
            if (settings.showOrderDate === undefined) {
                settings.showOrderDate = true;
            }
            if (settings.showOrderID === undefined) {
                settings.showOrderID = false;
            }

            await settings.save();
            res.json({ message: 'Settings migrated successfully', settings });
        } else {
            // Create default settings if none exist
            const newSettings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).create({
                restaurantId: req.restaurantId,
                autoSubmitToChef: true,
                siteClosed: false,
                taxEnabled: false,
                taxRate: 0,
                // Restaurant Information
                showRestaurantName: true,
                restaurantName: '',
                showRestaurantAddress: true,
                restaurantAddress: '',
                showContactNumber: true,
                contactNumber: '',
                showEmail: true,
                email: '',
                showRestaurantLogo: true,
                restaurantLogo: '',
                // Tax & Regulatory Information
                showGSTNumber: false,
                gstNumber: '',
                showFSSAINumber: false,
                fssaiNumber: '',
                // Additional Options
                includeQRInInvoice: true,
                // Order Information
                showOrderTime: true,
                showOrderDate: true,
                showOrderID: false
            });
            res.json({ message: 'Default settings created', settings: newSettings });
        }
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: 'Migration failed' });
    }
});

// 5. SETTINGS
app.get('/api/settings', async (req, res) => {
    try {
        // Get the settings document for this restaurant, or create default if none exists
        let settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).findOne({ restaurantId: req.restaurantId });
        if (!settings) {
            settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).create({
                restaurantId: req.restaurantId,
                autoSubmitToChef: true,
                siteClosed: false,
                taxEnabled: false,
                taxRate: 0,
                // Restaurant Information
                showRestaurantName: true,
                restaurantName: '',
                showRestaurantAddress: true,
                restaurantAddress: '',
                showContactNumber: true,
                contactNumber: '',
                showEmail: true,
                email: '',
                showRestaurantLogo: true,
                restaurantLogo: '',
                // Tax & Regulatory Information
                showGSTNumber: false,
                gstNumber: '',
                showFSSAINumber: false,
                fssaiNumber: '',
                // Additional Options
                includeQRInInvoice: true,
                // Order Information
                showOrderTime: true,
                showOrderDate: true,
                showOrderID: false
            });
        }

        // Check if user is authenticated
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Return settings without sensitive data for unauthenticated users
            const { _id, ...publicSettings } = settings.toObject();
            return res.json(publicSettings);
        }

        // Get user from token
        const token = authHeader.split(' ')[1];
        const currentUser = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(token);
        if (!currentUser) {
            const { _id, ...publicSettings } = settings.toObject();
            return res.json(publicSettings);
        }

        // For authenticated users, return settings without logo to prevent response corruption
        // Logo will be fetched separately when needed
        const settingsObj = settings.toObject();
        const { restaurantLogo, ...settingsWithoutLogo } = settingsObj;
        res.json(settingsWithoutLogo);
    } catch (e) {
        console.error('Error getting settings:', e);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// 5.1 UPDATE SETTINGS
app.put('/api/settings', async (req, res) => {
    try {
        // Check if user is authenticated
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const currentUser = await (req.restaurantDB ? (req.restaurantDB.models.User || req.restaurantDB.model('User', require('./models/Schemas').UserSchema)) : getDatabase().model('User', require('./models/Schemas').UserSchema)).findById(token);
        if (!currentUser) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Only allow admins to update settings
        if (currentUser.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Check if user is super admin (case-insensitive check)
        const isSuperAdmin = currentUser.username.toLowerCase() === 'abg';

        // Get current settings
        let settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).findOne({ restaurantId: req.restaurantId }) || new Settings({
            restaurantId: req.restaurantId,
            autoSubmitToChef: true,
            siteClosed: false,
            taxEnabled: false,
            taxRate: 0,
            // Restaurant Information
            showRestaurantName: true,
            restaurantName: '',
            showRestaurantAddress: true,
            restaurantAddress: '',
            showContactNumber: true,
            contactNumber: '',
            showEmail: true,
            email: '',
            showRestaurantLogo: true,
            restaurantLogo: '',
            // Tax & Regulatory Information
            showGSTNumber: false,
            gstNumber: '',
            showFSSAINumber: false,
            fssaiNumber: '',
            // Additional Options
            includeQRInInvoice: true,
            // Order Information
            showOrderTime: true,
            showOrderDate: true
        });

        // Prepare update object
        const update = { ...req.body };

        // If not super admin, remove siteClosed from the update
        if (!isSuperAdmin && 'siteClosed' in update) {
            delete update.siteClosed;
        }

        // Update settings for this restaurant
        settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).findOneAndUpdate(
            { restaurantId: req.restaurantId },
            { $set: update },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(settings);
    } catch (e) {
        console.error('Error updating settings:', e);
        res.status(500).json({ error: e.message });
    }
});

// 6. RECEIPTS & SALES
app.get('/api/receipts', async (req, res) => {
    try {
        const status = req.query.status; // e.g., ?status=open
        const filter = { restaurantId: req.restaurantId };
        if (status) filter.status = status;
        const orders = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).find(filter);
        res.json(orders);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 7. GET ALL ORDERS (Required for Chef Dashboard)
app.get('/api/orders', async (req, res) => {
    try {
        // Fetch all orders regardless of status
        // The frontend handles filtering (Active vs Completed)
        const orders = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).find({ restaurantId: req.restaurantId });
        res.json(orders);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET INDIVIDUAL ORDER (Required for order status polling)
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).findOne({ _id: req.params.id, restaurantId: req.restaurantId });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. START OR GET ACTIVE ORDER FOR A TABLE
app.post('/api/orders/start', async (req, res) => {
    const { tableId, customerId } = req.body;
    try {
        // Check if table exists
        const table = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOne({ _id: tableId, restaurantId: req.restaurantId });
        if (!table) return res.status(404).json({ error: "Table not found" });

        // If table already has an active order, return it
        if (table.activeOrderId) {
            const existingOrder = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).findOne({ _id: table.activeOrderId, restaurantId: req.restaurantId });
            if (existingOrder && existingOrder.status === 'open') {
                // If customerId provided and order has no customer, associate it
                if (customerId && !existingOrder.customerId) {
                    existingOrder.customerId = customerId;
                    await existingOrder.save();
                }
                return res.json(existingOrder);
            }
        }

        // Create new order with timing info
        const newOrder = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).create({
            restaurantId: req.restaurantId,
            tableId: tableId, // Storing the Table ID string
            customerId: customerId || null,
            status: 'open',
            items: [],
            total: 0,
            orderTime: new Date(),
            startedAt: new Date()
        });

        // Link table to this order
        table.activeOrderId = newOrder._id;
        await table.save();

        res.json(newOrder);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. UPDATE ORDER (Add items, update qty, status)
// This is a "Smart" route that recalculates totals
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { items, couponCode, discount, foodStatus } = req.body;
        const order = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).findOne({ _id: req.params.id, restaurantId: req.restaurantId });
        if (!order) return res.status(404).json({ error: "Order not found" });

        // Update fields if provided
        if (items) order.items = items;
        if (couponCode !== undefined) order.couponCode = couponCode;
        if (discount !== undefined) order.discount = discount;
        if (foodStatus) order.foodStatus = foodStatus;

        // Recalculate Totals
        const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

        // Kitchen Status Logic
        const allServed = order.items.every(i => i.status === 'served');
        const allPrepared = order.items.every(i => i.status !== 'preparing');
        const preparingCount = order.items.filter(i => i.status === 'preparing').length;
        const readyCount = order.items.filter(i => i.status === 'ready').length;
        const servedCount = order.items.filter(i => i.status === 'served').length;

        // Update food status and chef completion status
        if (allServed && order.items.length > 0) {
            order.foodStatus = 'served';
            // Mark chef's work as completed, but keep main status as 'open' for waiter
            order.chefStatus = 'completed';
            // Only update completedAt if the order is being fully completed
            if (order.status !== 'completed') {
                order.completedAt = new Date();
            }
        } else if (readyCount > 0 || servedCount > 0) {
            order.foodStatus = 'ready';
            order.chefStatus = 'preparing';
        } else {
            order.foodStatus = 'preparing';
            order.chefStatus = 'preparing';
        }

        // Update kitchen prepared status
        order.kitchenPrepared = allPrepared;

        // Update chef-specific order status
        if (allServed) {
            order.orderStatusChef = 'All items served';
        } else if (allPrepared) {
            order.orderStatusChef = 'All items prepared';
        } else {
            order.orderStatusChef = `${preparingCount} ${preparingCount === 1 ? 'item' : 'items'} under preparation`;
        }

        // Get current settings for tax
        const settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).findOne({ restaurantId: req.restaurantId }) || { taxEnabled: false, taxRate: 0 };

        // Calculate tax if enabled
        let taxAmount = 0;
        if (settings.taxEnabled && settings.taxRate > 0) {
            taxAmount = subtotal * (settings.taxRate / 100);
        }

        order.subtotal = subtotal;
        order.tax = taxAmount;
        order.total = subtotal + taxAmount - (order.discount || 0);

        await order.save();
        res.json(order);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. CLOSE ORDER
app.post('/api/orders/:id/close', async (req, res) => {
    try {
        const order = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).findOne({ _id: req.params.id, restaurantId: req.restaurantId });
        if (!order) return res.status(404).json({ error: "Order not found" });

        // Get current settings for tax
        const settings = await (req.restaurantDB ? (req.restaurantDB.models.Settings || req.restaurantDB.model('Settings', require('./models/Schemas').SettingsSchema)) : getDatabase().model('Settings', require('./models/Schemas').SettingsSchema)).findOne({ restaurantId: req.restaurantId }) || { taxEnabled: false, taxRate: 0 };

        // Calculate tax if enabled
        const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
        let taxAmount = 0;
        if (settings.taxEnabled && settings.taxRate > 0) {
            taxAmount = subtotal * (settings.taxRate / 100);
        }

        // Update order with tax information and mark as completed
        order.status = 'closed';
        order.chefStatus = 'completed';
        order.tax = taxAmount;
        order.taxRate = settings.taxRate;
        order.subtotal = subtotal;
        order.total = subtotal + taxAmount - (order.discount || 0);
        order.completedAt = order.completedAt || new Date();

        // Save the updated order first
        await order.save();

        // Then update the table
        await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOneAndUpdate(
            { activeOrderId: order._id, restaurantId: req.restaurantId },
            { $set: { activeOrderId: null } }
        );

        res.json(order);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete receipt endpoint
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const order = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).findOne({ _id: req.params.id, restaurantId: req.restaurantId });
        if (!order) {
            return res.status(404).json({ error: "Receipt not found" });
        }

        // If it's an open order, make sure to clear the table reference
        if (order.status === 'open') {
            await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOneAndUpdate(
                { activeOrderId: order._id, restaurantId: req.restaurantId },
                { $set: { activeOrderId: null } }
            );
        }

        await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
        res.json({ message: "Receipt deleted successfully" });
    } catch (error) {
        console.error("Error deleting receipt:", error);
        res.status(500).json({ error: "Failed to delete receipt" });
    }
});

// JOIN TABLE ORDER (register a guest to the active order for this table)
app.post('/api/orders/join', async (req, res) => {
    try {
        const { tableId, guest } = req.body || {}
        if (!tableId || !guest?.name) {
            return res.status(400).json({ error: 'tableId and guest.name are required' })
        }

        const table = await (req.restaurantDB ? (req.restaurantDB.models.Table || req.restaurantDB.model('Table', require('./models/Schemas').TableSchema)) : getDatabase().model('Table', require('./models/Schemas').TableSchema)).findOne({ _id: tableId, restaurantId: req.restaurantId })
        if (!table) return res.status(404).json({ error: 'Table not found' })

        // Get or create an active order for this table
        let order = null
        if (table.activeOrderId) {
            order = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).findOne({ _id: table.activeOrderId, restaurantId: req.restaurantId })
        }
        if (!order || order.status !== 'open') {
            order = await (req.restaurantDB ? (req.restaurantDB.models.Order || req.restaurantDB.model('Order', require('./models/Schemas').OrderSchema)) : getDatabase().model('Order', require('./models/Schemas').OrderSchema)).create({
                restaurantId: req.restaurantId,
                tableId,
                status: 'open',
                items: [],
                guests: [],
                total: 0,
                orderTime: new Date(),
                startedAt: new Date()
            })
            table.activeOrderId = order._id
            await table.save()
        }

        // Add guest if not already present (match by phone if provided, else by name)
        const normalizedPhone = normalizePhone(guest.phone)
        const alreadyExists = order.guests.some(g =>
            (normalizedPhone && normalizePhone(g.phone) === normalizedPhone) ||
            g.name.toLowerCase() === guest.name.trim().toLowerCase()
        )
        if (!alreadyExists) {
            order.guests.push({
                name: guest.name.trim(),
                phone: normalizedPhone || '',
                joinedAt: new Date()
            })
            await order.save()
        }

        return res.json(order)
    } catch (e) {
        return res.status(500).json({ error: e.message })
    }
})

// --- DYNAMIC RESTAURANT ROUTES ---
// Restaurant-specific admin routes
app.get(`/:restaurantSlug/admin`, async (req, res) => {
    try {
        // This will be handled by the middleware above
        res.json({ message: 'Restaurant admin access' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Fallback to admin for backward compatibility
app.get('/admin', async (req, res) => {
    try {
        // Redirect to first active restaurant or show selection
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const firstRestaurant = await Restaurant.findOne({ status: 'active' });

        if (firstRestaurant) {
            res.redirect(`/${firstRestaurant.slug}/admin`);
        } else {
            res.json({ message: 'No active restaurants found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Restaurant landing page
app.get(`/:restaurantSlug`, async (req, res) => {
    try {
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const restaurant = await Restaurant.findOne({ slug: req.params.restaurantSlug });

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Return restaurant info with landing page template
        res.json({
            restaurant: {
                name: restaurant.name,
                slug: restaurant.slug,
                landingPage: restaurant.landingPage || 'brew-bites',
                status: restaurant.status
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Restaurant landing page with template rendering
app.get(`/:restaurantSlug/view`, async (req, res) => {
    try {
        const centralDB = getDatabase();
        const Restaurant = centralDB.model('Restaurant', require('./models/Schemas').RestaurantSchema);
        const restaurant = await Restaurant.findOne({ slug: req.params.restaurantSlug });

        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Return HTML based on landing page template
        const landingPage = restaurant.landingPage || 'brew-bites';

        if (landingPage === 'pastel-poetry') {
            // Serve Pastel Poetry template
            res.send(generatePastelPoetryHTML(restaurant));
        } else {
            // Redirect to React app for other templates
            res.redirect(`/${restaurant.slug}`);
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper function to generate Pastel Poetry HTML
const generatePastelPoetryHTML = (restaurant) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${restaurant.name} - Creative Haven</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.6; 
            color: #666; 
            background: linear-gradient(135deg, #FFE5E5 0%, #FCE7F3 100%);
            min-height: 100vh;
        }
        .header { 
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(10px); 
            padding: 20px 0; 
            position: sticky; 
            top: 0; 
            z-index: 50; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .hero { 
            padding: 80px 20px; 
            text-align: center; 
            position: relative;
        }
        .hero-content { 
            background: rgba(255, 255, 255, 0.9); 
            border-radius: 20px; 
            padding: 60px 40px; 
            max-width: 800px; 
            margin: 0 auto; 
            box-shadow: 0 10px 30px rgba(139, 69, 19, 0.2);
        }
        .cta-button { 
            background: #8B5A2B; 
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 8px; 
            font-size: 18px; 
            font-weight: 500; 
            cursor: pointer; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
        }
    </style>
</head>
<body>
    <header class="header">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 42px; font-weight: 300; color: #8B5A2B; margin: 0; text-shadow: 2px 2px 4px rgba(139, 69, 19, 0.1);">
                    🎨 ${restaurant.name}
                </h1>
                <p style="font-size: 16px; color: #666; margin: 8px 0 0 16px; font-style: italic;">
                    Where every moment is a brushstroke of creativity
                </p>
            </div>
            <div style="display: flex; gap: 16px;">
                <button class="cta-button" onclick="window.location.href='/${restaurant.slug}/admin'">
                    🎨 Admin Portal
                </button>
                <button class="cta-button" onclick="window.location.href='/'">
                    🏠 All Restaurants
                </button>
            </div>
        </div>
    </header>
    <section class="hero">
        <div class="hero-content">
            <h2 style="font-size: 32px; font-weight: 300; color: #8B5A2B; margin: 0 0 20px; text-shadow: 1px 1px 2px rgba(139, 69, 19, 0.1);">
                Welcome to Your Creative Haven
            </h2>
            <p style="font-size: 18px; line-height: 1.6; color: #666; margin: 0 0 30px;">
                Indulge in our handcrafted pastries and artisanal beverages, where each bite tells a story and every sip inspires creativity.
            </p>
            <button class="cta-button" onclick="window.location.href='/${restaurant.slug}/order'">
                🎨 Begin Your Experience
            </button>
        </div>
    </section>
    <footer style="background: #8B5A2B; color: #FCE7F3; padding: 40px 20px; text-align: center;">
        <p style="margin: 0; font-size: 14px;">
            © 2024 ${restaurant.name}. Crafted with creativity and passion.
        </p>
    </footer>
</body>
</html>
    `;
};

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});