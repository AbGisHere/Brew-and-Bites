const mongoose = require('mongoose');
const { Restaurant, User, Menu, Table, Coupon, Settings, Order, AccessLog } = require('../models/Schemas');

const migrateDB = async () => {
    try {
        const connString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';
        await mongoose.connect(connString);
        console.log('✅ Connected to DB for Migration');

        // 1. Create Default Restaurant if none exists
        let defaultRestaurant = await Restaurant.findOne({ name: 'Brew and Bites' });
        if (!defaultRestaurant) {
            defaultRestaurant = await Restaurant.create({
                name: 'Brew and Bites',
                status: 'active'
            });
            console.log(`✅ Created Default Restaurant: ${defaultRestaurant._id}`);
        } else {
            console.log(`ℹ️ Default Restaurant already exists: ${defaultRestaurant._id}`);
        }

        const restaurantId = defaultRestaurant._id;

        // 2. Migrate Users (Except super admin AbG who shouldn't have a restaurantId, or should they?)
        // Currently 'AbG' is root, so let's set restaurantId to null or don't set it for AbG.
        // For existing standard users, assign them.
        const usersUpdate = await User.updateMany(
            { restaurantId: { $exists: false }, hidden: false }, // Only update standard users
            { $set: { restaurantId: restaurantId } }
        );
        console.log(`✅ Updated ${usersUpdate.modifiedCount} Users`);

        // 3. Migrate Menu Items
        const menuUpdate = await Menu.updateMany(
            { restaurantId: { $exists: false } },
            { $set: { restaurantId: restaurantId } }
        );
        console.log(`✅ Updated ${menuUpdate.modifiedCount} Menu Items`);

        // 4. Migrate Tables
        const tablesUpdate = await Table.updateMany(
            { restaurantId: { $exists: false } },
            { $set: { restaurantId: restaurantId } }
        );
        console.log(`✅ Updated ${tablesUpdate.modifiedCount} Tables`);

        // 5. Migrate Coupons
        const couponsUpdate = await Coupon.updateMany(
            { restaurantId: { $exists: false } },
            { $set: { restaurantId: restaurantId } }
        );
        console.log(`✅ Updated ${couponsUpdate.modifiedCount} Coupons`);

        // 6. Migrate Settings
        const settingsUpdate = await Settings.updateMany(
            { restaurantId: { $exists: false } },
            { $set: { restaurantId: restaurantId } }
        );
        console.log(`✅ Updated ${settingsUpdate.modifiedCount} Settings`);

        // 7. Migrate Orders
        const ordersUpdate = await Order.updateMany(
            { restaurantId: { $exists: false } },
            { $set: { restaurantId: restaurantId } }
        );
        console.log(`✅ Updated ${ordersUpdate.modifiedCount} Orders`);

        // 8. Migrate AccessLogs
        const logsUpdate = await AccessLog.updateMany(
            { restaurantId: { $exists: false } },
            { $set: { restaurantId: restaurantId } }
        );
        console.log(`✅ Updated ${logsUpdate.modifiedCount} Access Logs`);

        console.log('🎉 Migration Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
};

migrateDB();
