const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 👇 THIS LINE IS CRITICAL
        // It says: "Use the Render variable. If it doesn't exist, ONLY THEN use localhost."
        const connString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cafe_app';
        
        await mongoose.connect(connString);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;