const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Check if admin role exists, create if not
    let adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = new Role({ name: 'admin' });
      await adminRole.save();
      console.log('Created admin role');
    }
    
    // Check if worker role exists, create if not
    let workerRole = await Role.findOne({ name: 'worker' });
    if (!workerRole) {
      workerRole = new Role({ name: 'worker' });
      await workerRole.save();
      console.log('Created worker role');
    }
    
    // Check if shop role exists, create if not
    let shopRole = await Role.findOne({ name: 'shop' });
    if (!shopRole) {
      shopRole = new Role({ name: 'shop' });
      await shopRole.save();
      console.log('Created shop role');
    }
    
    // Check if attendance-only role exists, create if not
    let attendanceOnlyRole = await Role.findOne({ name: 'attendance-only' });
    if (!attendanceOnlyRole) {
      attendanceOnlyRole = new Role({ name: 'attendance-only' });
      await attendanceOnlyRole.save();
      console.log('Created attendance-only role');
    }
    
    // Check if admin user exists
    const adminUser = await User.findOne({ username: process.env.ADMIN_USERNAME });
    
    if (adminUser) {
      console.log('Admin user already exists');
      // Optionally update the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
      await User.findByIdAndUpdate(adminUser._id, { password: hashedPassword });
      console.log('Admin password updated');
    } else {
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
      
      const newUser = new User({
        name: 'Administrator',
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
        role: adminRole._id,
      });
      
      await newUser.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});
