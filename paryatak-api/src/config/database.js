/**
 * Database — Prisma Client Singleton
 */
const { PrismaClient } = require('@prisma/client');

let prisma;

const connectDB = async () => {
    if (!prisma) {
        prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });
    }
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
    return prisma;
};

const disconnectDB = async () => {
    if (prisma) {
        await prisma.$disconnect();
        console.log('✅ PostgreSQL disconnected');
    }
};

const getDB = () => {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
};

module.exports = { connectDB, disconnectDB, getDB };
