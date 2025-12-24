require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected for admin seeding...');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@sharecare.com' });

    if (existingAdmin) {
      console.log('Admin already exists. Deleting and recreating...');
      await Admin.deleteOne({ email: 'admin@sharecare.com' });
    }

    // Create admin user
    const admin = await Admin.create({
      name: 'Admin User',
      email: 'admin@sharecare.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      isActive: true
    });

    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log('Password: admin123 (please change this after first login)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();

