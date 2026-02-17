// server/index.js
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const connectDB = require('./db');
// Import the Schemas we created in Step 4
// New (FIXED)
const { User, Menu, Table, Coupon, Settings, Order, AccessLog } = require('./models/Schemas');
// Import auto-seed functionality
const { seedDatabase } = require('./utils/autoSeed');

const app = express();
// Use the PORT environment variable provided by the render host, defaulting to 5001 only if not set.
const PORT = process.env.PORT || 5001; 

// 1. Connect to DB and auto-seed
const initializeDatabase = async () => {
    try {
        await connectDB();
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
    allowedHeaders: ['Content-Type', 'Authorization']
})); // Allow React to talk to us
app.use(express.json()); // Allow reading JSON bodies

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
    const { phone, name } = req.body || {}
    const normalizedPhone = normalizePhone(phone)
    const normalizedName = String(name || '').trim()
    if (!normalizedPhone || normalizedPhone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }
    if (!normalizedName) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const otp = generateOtp()
    demoOtpStore.set(normalizedPhone, {
      otpHash: hashOtp(otp),
      expiresAt: Date.now() + DEMO_OTP_TTL_MS,
      name: normalizedName
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
    const token = signCustomerToken({ phone: normalizedPhone, name: record.name })
    return res.json({ token, customer: { phone: normalizedPhone, name: record.name } })
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
        const accessLog = await AccessLog.create({
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
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { pageType, startDate, endDate, limit = 100 } = req.query;
        
        // Build filter
        const filter = {};
        if (pageType) filter.pageType = pageType;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const logs = await AccessLog.find(filter)
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
        
        // 1. Clear old data (Danger! Only for development)
        await User.deleteMany({});
        await Menu.deleteMany({});
        await Table.deleteMany({});
        await Coupon.deleteMany({});
        await Settings.deleteMany({});

            // 2. Insert Users (With Encryption)
const rawUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'waiter1', password: 'waiter123', role: 'waiter' },
    { username: 'chef1', password: 'chef123', role: 'chef' },
    { username: 'AbG', password: 'GitHub--AbGisHere', role: 'admin', hidden: true }
];

// Hash passwords before saving
const hashedUsers = await Promise.all(rawUsers.map(async (u) => {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    return { ...u, password: hashedPassword };
}));

await User.create(hashedUsers);

// 3. Insert Menu (We flatten your categories)
const menuData = [
    // Coffee
    { category: 'Coffee', name: 'Espresso', description: 'Rich and aromatic single shot', price: 3.5, featured: true },
    { category: 'Coffee', name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 4.5, featured: true },
    // Breakfast
    { category: 'Breakfast', name: 'Avocado Toast', description: 'Sourdough, avo, tomatoes, feta', price: 9.99, featured: true },
    // Lunch
    { category: 'Lunch', name: 'Club Sandwich', description: 'Turkey, bacon, lettuce, tomato', price: 11.99, featured: true },
    // Desserts
    { category: 'Desserts', name: 'Chocolate Cake', description: 'Rich cake with ganache', price: 6.5, featured: true }
];
await Menu.insertMany(menuData);

// 4. Insert Tables with fixed codes
const tables = [
    { name: 'Table 1', tableCode: '910474', qrCode: `https://localhost:3000/order?code=910474` },
    { name: 'Table 2', tableCode: '139631', qrCode: `https://localhost:3000/order?code=139631` }
];

await Table.insertMany(tables);

// 5. Insert Coupons
await Coupon.create([
    { code: 'WELCOME10', type: 'percent', value: 10, active: true }
]);

// 6. Insert Default Settings
await Settings.create({ 
    autoSubmitToChef: true, 
    siteClosed: false,
    showOrderTime: true,
    showOrderDate: true,
    showOrderID: false
});

res.json({ message: "✅ Database populated with store.js data!" });
} catch (error) {
res.status(500).json({ error: error.message });
}
});

    // C. GET MENU ROUTE
app.get('/api/menu', async (req, res) => {
    const items = await Menu.find();
    res.json(items);
});

// D. GET TABLES
app.get('/api/tables', async (req, res) => {
    const tables = await Table.find();
    res.json(tables);
});

// D.1 GET TABLE BY CODE
app.get('/api/tables/by-code/:code', async (req, res) => {
    try {
        const table = await Table.findOne({ tableCode: req.params.code });
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
        const tables = await Table.find();
        
        // Generate unique 6-digit codes and QR codes for ALL tables
        for (const table of tables) {
            let code;
            let isUnique = false;
            
            // Generate unique 6-digit code
            while (!isUnique) {
                code = Math.floor(100000 + Math.random() * 900000).toString();
                const existingTable = await Table.findOne({ tableCode: code, _id: { $ne: table._id } });
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
    const users = await User.find();
    res.json(users);
});

// F. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Get site settings
        const settings = await Settings.findOne() || { siteClosed: false };
        
        // 2. Search for the user
        const user = await User.findOne({ 
            username: { $regex: new RegExp("^" + username + "$", "i") } 
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 3. SECURE PASSWORD CHECK (Bcrypt)
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // 4. Check if site is closed - only allow super admin (AbG) to log in
        if (settings.siteClosed && user.username.toLowerCase() !== 'abg') {
            return res.status(403).json({ 
                message: "The site is currently closed. Contact the Owner/Creator" 
            });
        }

        // 5. Success!
        res.json({
            id: user._id,
            username: user.username,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
});

    // --- ADMIN ROUTES (Add these to server/index.js) ---

    // 0. ADMIN USER MANAGEMENT
    // Get all users (superadmin only)
    app.get('/api/admin/users', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const token = authHeader.split(' ')[1];
            const user = await User.findById(token);
            
            if (!user || user.username.toLowerCase() !== 'abg') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            
            const users = await User.find({}, { password: 0 });
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
            const currentUser = await User.findById(token);
            
            if (!currentUser || currentUser.username.toLowerCase() !== 'abg') {
                return res.status(403).json({ error: 'Forbidden' });
            }
            
            const { username, password, role = 'admin' } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required' });
            }
            
            // Check if user already exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create new user
            const newUser = await User.create({
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
            const requester = await User.findById(requesterId);
            
            // Basic check: Must be at least an admin (or superadmin)
            if (!requester || (requester.role !== 'admin' && requester.username !== 'AbG')) {
                return res.status(403).json({ error: 'Forbidden: Access denied' });
            }

            // 2. Identify the Target
            const targetUser = await User.findById(req.params.id);
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
            const newItem = await Menu.create(req.body);
            res.json(newItem);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Edit item
    app.put('/api/menu/:id', async (req, res) => {
        try {
            const updatedItem = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updatedItem);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Delete item
    app.delete('/api/menu/:id', async (req, res) => {
        try {
            await Menu.findByIdAndDelete(req.params.id);
            res.json({ message: "Deleted" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // 2. TABLE MANAGEMENT
    app.post('/api/tables', async (req, res) => {
        try {
            const newTable = await Table.create(req.body);
            res.json(newTable);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete('/api/tables/:id', async (req, res) => {
        try {
            await Table.findByIdAndDelete(req.params.id);
            res.json({ message: "Deleted" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Add User (With Hashing)
    app.post('/api/users', async (req, res) => {
        try {
            const { username, password, role } = req.body;
            
            // Hash the password before creating
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const newUser = await User.create({
                username, 
                password: hashedPassword, 
                role
            });
            
            res.json(newUser);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.delete('/api/users/:id', async (req, res) => {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.json({ message: "Deleted" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // 4. COUPONS
    app.get('/api/coupons', async (req, res) => {
        const coupons = await Coupon.find();
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
            
            // Check if coupon code already exists
            const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (existingCoupon) {
                return res.status(400).json({ error: 'Coupon code already exists' });
            }
            
            const newCoupon = await Coupon.create({
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
            
            const updatedCoupon = await Coupon.findOneAndUpdate(
                { code: req.params.code },
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
            await Coupon.findOneAndDelete({ code: req.params.code });
            res.json({ message: "Deleted" });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    app.post('/api/coupons/validate', async (req, res) => {
        try {
            const { code, orderTotal } = req.body;
            
            if (!code) {
                return res.status(400).json({ error: 'Coupon code is required' });
            }
            
            const coupon = await Coupon.findOne({ code: code.toUpperCase() });
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
            const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() });
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
            const settings = await Settings.findOne();
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
                const newSettings = await Settings.create({ 
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
            // Get the first settings document, or create default if none exists
            let settings = await Settings.findOne();
            if (!settings) {
                settings = await Settings.create({ 
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
            const currentUser = await User.findById(token);
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
            const currentUser = await User.findById(token);
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
            let settings = await Settings.findOne() || new Settings({ 
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
            
            // Update settings
            settings = await Settings.findOneAndUpdate(
                {},
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
            const filter = status ? { status: status } : {};
            const orders = await Order.find(filter);
            res.json(orders);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // 7. GET ALL ORDERS (Required for Chef Dashboard)
    app.get('/api/orders', async (req, res) => {
        try {
            // Fetch all orders regardless of status
            // The frontend handles filtering (Active vs Completed)
            const orders = await Order.find();
            res.json(orders);
        } catch (e) { 
            res.status(500).json({ error: e.message }); 
        }
    });

    // GET INDIVIDUAL ORDER (Required for order status polling)
    app.get('/api/orders/:id', async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
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
            const table = await Table.findById(tableId);
            if (!table) return res.status(404).json({ error: "Table not found" });

            // If table already has an active order, return it
            if (table.activeOrderId) {
                const existingOrder = await Order.findById(table.activeOrderId);
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
            const newOrder = await Order.create({
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
            const order = await Order.findById(req.params.id);
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
            const settings = await Settings.findOne() || { taxEnabled: false, taxRate: 0 };
            
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
            const order = await Order.findById(req.params.id);
            if (!order) return res.status(404).json({ error: "Order not found" });

            // Get current settings for tax
            const settings = await Settings.findOne() || { taxEnabled: false, taxRate: 0 };
            
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
        await Table.findOneAndUpdate(
            { activeOrderId: order._id }, 
            { $set: { activeOrderId: null } }
        );

        res.json(order);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Delete receipt endpoint
    app.delete('/api/orders/:id', async (req, res) => {
        try {
            const order = await Order.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ error: "Receipt not found" });
            }

            // If it's an open order, make sure to clear the table reference
            if (order.status === 'open') {
                await Table.findOneAndUpdate(
                    { activeOrderId: order._id },
                    { $set: { activeOrderId: null } }
                );
            }

            await Order.findByIdAndDelete(req.params.id);
            res.json({ message: "Receipt deleted successfully" });
        } catch (error) {
            console.error("Error deleting receipt:", error);
            res.status(500).json({ error: "Failed to delete receipt" });
        }
    });

    // Start Server
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });