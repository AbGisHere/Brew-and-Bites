// server/index.js
const bcrypt = require('bcryptjs');
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
// Import the Schemas we created in Step 4
// New (FIXED)
const { User, Menu, Table, Coupon, Settings, Order } = require('./models/Schemas');

const app = express();
const PORT = 5000;

// 1. Connect to DB
connectDB();

// 2. Middleware
app.use(cors()); // Allow React to talk to us
app.use(express.json()); // Allow reading JSON bodies

// --- ROUTES ---

// A. TEST ROUTE
app.get('/', (req, res) => {
    res.send("Backend is running!");
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
            { username: 'AbG', password: 'AbG', role: 'admin', hidden: true }
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
            { category: 'coffee', name: 'Espresso', description: 'Rich and aromatic single shot', price: 3.5, featured: true },
            { category: 'coffee', name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 4.5, featured: true },
            // Breakfast
            { category: 'breakfast', name: 'Avocado Toast', description: 'Sourdough, avo, tomatoes, feta', price: 9.99, featured: true },
            // Lunch
            { category: 'lunch', name: 'Club Sandwich', description: 'Turkey, bacon, lettuce, tomato', price: 11.99, featured: true },
            // Desserts
            { category: 'desserts', name: 'Chocolate Cake', description: 'Rich cake with ganache', price: 6.5, featured: true }
        ];
        await Menu.insertMany(menuData);

        // 4. Insert Tables
        await Table.create([
            { name: 'Table 1' },
            { name: 'Table 2' }
        ]);

        // 5. Insert Coupons
        await Coupon.create([
            { code: 'WELCOME10', type: 'percent', value: 10, active: true }
        ]);

        // 6. Insert Default Settings
        await Settings.create({ autoSubmitToChef: true, siteClosed: false });

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

// E. GET USERS (Only for testing! Don't keep this in production)
app.get('/api/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// F. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Search for the user
        const user = await User.findOne({ 
            username: { $regex: new RegExp("^" + username + "$", "i") } 
        });

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 2. SECURE PASSWORD CHECK (Bcrypt)
        // bcrypt.compare( typedPassword, storedHash )
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // 3. Success!
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

// 4. COUPONS
app.get('/api/coupons', async (req, res) => {
    const coupons = await Coupon.find();
    res.json(coupons);
});

app.post('/api/coupons', async (req, res) => {
    try {
        const newCoupon = await Coupon.create(req.body);
        res.json(newCoupon);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/coupons/:code', async (req, res) => {
    try {
        await Coupon.findOneAndDelete({ code: req.params.code });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. SETTINGS
app.get('/api/settings', async (req, res) => {
    // Get the first settings document, or create default if none exists
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({ autoSubmitToChef: true });
    }
    res.json(settings);
});

app.put('/api/settings', async (req, res) => {
    try {
        // Update the first settings document found
        const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(settings);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. RECEIPTS & SALES
app.get('/api/receipts', async (req, res) => {
    // In a real app, you might want to limit this to the last 100 receipts
    const receipts = await Order.find({ status: 'closed' }).sort({ createdAt: -1 });
    res.json(receipts);
});

// --- ORDER ROUTES (Add to server/index.js) ---

// 1. GET OPEN ORDERS (For Chef/Waiter)
app.get('/api/orders', async (req, res) => {
    try {
        const status = req.query.status; // e.g., ?status=open
        const filter = status ? { status: status } : {};
        const orders = await Order.find(filter);
        res.json(orders);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. START OR GET ACTIVE ORDER FOR A TABLE
app.post('/api/orders/start', async (req, res) => {
    const { tableId } = req.body;
    try {
        // Check if table exists
        const table = await Table.findById(tableId);
        if (!table) return res.status(404).json({ error: "Table not found" });

        // If table already has an active order, return it
        if (table.activeOrderId) {
            const existingOrder = await Order.findById(table.activeOrderId);
            if (existingOrder && existingOrder.status === 'open') {
                return res.json(existingOrder);
            }
        }

        // Create new order
        const newOrder = await Order.create({
            tableId: tableId, // Storing the Table ID string
            status: 'open',
            items: [],
            total: 0
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
        
        // Simple Kitchen Status Logic
        const allServed = order.items.every(i => i.status === 'served');
        const anyReady = order.items.some(i => i.status === 'ready');
        
        if (allServed && order.items.length > 0) order.foodStatus = 'served';
        else if (anyReady) order.foodStatus = 'ready';
        
        // Check if kitchen is done (all items ready or served)
        order.kitchenPrepared = order.items.every(i => i.status !== 'preparing');

        order.total = subtotal - (order.discount || 0);
        
        await order.save();
        res.json(order);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. CLOSE ORDER
app.post('/api/orders/:id/close', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        order.status = 'closed';
        await order.save();

        // Free up the table
        // We find the table that has this activeOrderId and clear it
        await Table.findOneAndUpdate(
            { activeOrderId: order._id }, 
            { $set: { activeOrderId: null } }
        );

        res.json(order);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});