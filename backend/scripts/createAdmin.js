/**
 * Admin Seed Script
 * Run this ONCE to create the admin account:
 *   node scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@healthcare.com' });
    if (existing) {
      console.log('⚠️  Admin already exists:', existing.email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    // Create admin user
    const admin = await User.create({
      fullName: 'System Admin',
      email: 'admin@healthcare.com',
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
      isActive: true,
    });

    console.log('✅ Admin created successfully!');
    console.log('   Email   : admin@healthcare.com');
    console.log('   Password: Admin@123');
    console.log('   ID      :', admin._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();
