// server/utils/autoSeed.js
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../db');
const {
    RestaurantSchema,
    UserSchema,
    MenuItemSchema,
    TableSchema,
    CouponSchema,
    SettingsSchema
} = require('../models/Schemas');

// ... (default arrays remain unchanged, we'll map them inside the function)

const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'waiter1', password: 'waiter123', role: 'waiter' },
    { username: 'chef1', password: 'chef123', role: 'chef' },
    { username: 'AbG', password: 'GitHub--AbGisHere', role: 'admin', hidden: true }
];

const defaultMenuItems = [
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

const defaultTables = [
    { name: 'Table 1', tableCode: '910474', qrCode: `http://localhost:3000/order?table=910474` },
    { name: 'Table 2', tableCode: '139631', qrCode: `http://localhost:3000/order?table=139631` }
];

const defaultCoupons = [
    { code: 'WELCOME10', type: 'percentage', value: 10 }
];

const defaultSettings = {
    autoSubmitToChef: true,
    siteClosed: false,
    taxEnabled: false,
    taxRate: 0,
    restaurantDescription: 'Craft coffee, fresh bites, and cozy vibes in the heart of town.',
    socialMediaLinks: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
    },
    appVersion: '1.7.0'
};

async function seedDatabase() {
    try {
        console.log('🌱 Checking database for initial data...');

        // Get Database Connections
        const centralDB = getDatabase();
        const brewAndBitesDB = getDatabase('brew-and-bites');

        // Register Models on appropriate connections
        const Restaurant = centralDB.models.Restaurant || centralDB.model('Restaurant', RestaurantSchema);
        const User = centralDB.models.User || centralDB.model('User', UserSchema);

        const Menu = brewAndBitesDB.models.Menu || brewAndBitesDB.model('Menu', MenuItemSchema);
        const Table = brewAndBitesDB.models.Table || brewAndBitesDB.model('Table', TableSchema);
        const Coupon = brewAndBitesDB.models.Coupon || brewAndBitesDB.model('Coupon', CouponSchema);
        const Settings = brewAndBitesDB.models.Settings || brewAndBitesDB.model('Settings', SettingsSchema);

        let defaultRestaurant = await Restaurant.findOne({ name: 'Brew and Bites' });
        let pastelPoetryRestaurant = await Restaurant.findOne({ name: 'Pastel Poetry' });

        if (!defaultRestaurant) {
            defaultRestaurant = await Restaurant.create({
                name: 'Brew and Bites',
                status: 'active',
                slug: 'brew-and-bites',
                landingPage: 'brew-bites'
            });
        }

        if (!pastelPoetryRestaurant) {
            pastelPoetryRestaurant = await Restaurant.create({
                name: 'Pastel Poetry',
                status: 'active',
                slug: 'pastel-poetry',
                landingPage: 'pastel-poetry'
            });
        }

        const restId = defaultRestaurant._id;

        // Check if users exist in central DB
        const userCount = await User.countDocuments();

        // Check if data exists in Brew and Bites DB
        const menuCount = await Menu.countDocuments();
        const tableCount = await Table.countDocuments();
        const couponCount = await Coupon.countDocuments();
        const settingsCount = await Settings.countDocuments();

        let seededAnything = false;

        // Seed users if none exist
        if (userCount === 0) {
            console.log('👥 Creating default users...');
            const hashedUsers = await Promise.all(defaultUsers.map(async (u) => {
                const hashedPassword = await bcrypt.hash(u.password, 10);
                return { ...u, password: hashedPassword, restaurantId: u.username === 'AbG' ? null : restId };
            }));
            await User.create(hashedUsers);
            console.log('✅ Default users created: admin, waiter1, chef1, AbG');
            seededAnything = true;
        } else {
            console.log(`👥 Users already exist (${userCount} found)`);
        }

        // Seed menu if empty
        if (menuCount === 0) {
            console.log('🍽️ Creating default menu items...');
            const menuWithRestId = defaultMenuItems.map(m => ({ ...m, restaurantId: restId }));
            await Menu.insertMany(menuWithRestId);
            console.log('✅ Default menu items created');
            seededAnything = true;
        } else {
            console.log(`🍽️ Menu items already exist (${menuCount} found)`);
        }

        // Seed tables if none exist
        if (tableCount === 0) {
            console.log('🪑 Creating default tables...');
            const tablesWithRestId = defaultTables.map(t => ({ ...t, restaurantId: restId }));
            await Table.create(tablesWithRestId);
            console.log('✅ Default tables created');
            seededAnything = true;
        } else {
            console.log(`🪑 Tables already exist (${tableCount} found)`);
        }

        // Seed coupons if none exist
        if (couponCount === 0) {
            console.log('🎫 Creating default coupons...');
            const couponsWithRestId = defaultCoupons.map(c => ({ ...c, restaurantId: restId }));
            await Coupon.create(couponsWithRestId);
            console.log('✅ Default coupons created');
            seededAnything = true;
        } else {
            console.log(`🎫 Coupons already exist (${couponCount} found)`);
        }

        // Seed settings if none exist
        if (settingsCount === 0) {
            console.log('⚙️ Creating default settings...');
            await Settings.create({ ...defaultSettings, restaurantId: restId });
            console.log('✅ Default settings created');
            seededAnything = true;
        } else {
            console.log(`⚙️ Settings already exist (${settingsCount} found)`);
        }

        if (!seededAnything) {
            console.log('🎉 Database is already initialized!');
        } else {
            console.log('🎉 Database initialization complete!');
        }

        return true;
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        return false;
    }
}

module.exports = { seedDatabase };
