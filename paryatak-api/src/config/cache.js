/**
 * Cache Service
 * Uses Redis when REDIS_ENABLED=true, falls back to node-cache (in-memory).
 */
const NodeCache = require('node-cache');

// In-memory fallback
const memCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

let redisClient = null;
let useRedis = false;

const initCache = async () => {
    if (process.env.REDIS_ENABLED !== 'true') {
        console.log('📦 Cache: using in-memory (node-cache)');
        return;
    }
    try {
        const { createClient } = require('redis');
        redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        redisClient.on('error', (err) => {
            console.warn('⚠️  Redis error, falling back to in-memory:', err.message);
            useRedis = false;
        });
        await redisClient.connect();
        useRedis = true;
        console.log('✅ Redis cache connected');
    } catch (err) {
        console.warn(`⚠️  Redis unavailable (${err.message}), using in-memory cache`);
        useRedis = false;
    }
};

const get = async (key) => {
    try {
        if (useRedis && redisClient?.isReady) {
            const val = await redisClient.get(key);
            return val ? JSON.parse(val) : null;
        }
        const val = memCache.get(key);
        return val !== undefined ? val : null;
    } catch { return null; }
};

const set = async (key, value, ttlSeconds = 300) => {
    try {
        if (useRedis && redisClient?.isReady) {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        } else {
            memCache.set(key, value, ttlSeconds);
        }
    } catch { /* silent fail */ }
};

const del = async (key) => {
    try {
        if (useRedis && redisClient?.isReady) await redisClient.del(key);
        else memCache.del(key);
    } catch { /* silent fail */ }
};

const delPattern = async (pattern) => {
    try {
        if (useRedis && redisClient?.isReady) {
            const keys = await redisClient.keys(pattern);
            if (keys.length) await redisClient.del(keys);
        } else {
            const keys = memCache.keys().filter(k => k.startsWith(pattern.replace('*', '')));
            keys.forEach(k => memCache.del(k));
        }
    } catch { /* silent fail */ }
};

module.exports = { initCache, get, set, del, delPattern };
