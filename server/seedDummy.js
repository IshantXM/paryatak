const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user.model');
const { database } = require('./config/environment');

async function seed() {
    try {
        await mongoose.connect(database.uri);
        console.log('Connected to DB');

        const existing = await User.findOne({ phone_number: '9999999999' });
        if (existing) {
            console.log('Dummy user already exists!');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await User.create({
            name: 'Dummy Operative',
            phone_number: '9999999999',
            email: 'dummy@paryatak.app',
            password: hashedPassword,
            isVerified: true
        });

        console.log('✅ Dummy user created successfully!');
        console.log('Phone: 9999999999');
        console.log('Password: password123');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding dummy user:', err);
        process.exit(1);
    }
}

seed();
