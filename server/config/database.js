/**
 * Database Configuration
 * 
 * MongoDB connection using Mongoose.
 * 
 * @module config/database
 */

const mongoose = require('mongoose');
const { database } = require('./environment');

/**
 * Connect to MongoDB with retry logic.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(database.uri, {
            // Mongoose 7+ uses these by default, but being explicit
            autoIndex: true,
        });

        console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        // Retry after 5 seconds
        console.log('🔄 Retrying connection in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return connectDB();
    }
};

/**
 * Graceful disconnect.
 */
const disconnectDB = async () => {
    await mongoose.disconnect();
    console.log('MongoDB disconnected gracefully');
};

module.exports = { connectDB, disconnectDB };
