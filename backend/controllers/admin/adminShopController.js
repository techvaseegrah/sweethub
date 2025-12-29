const Shop = require('../../models/shopModel');
const User = require('../../models/User');
const Role = require('../../models/Role');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Function to generate a unique shop code
const generateShopCode = async (location, shopName) => {
  // Extract first two letters of location/state and convert to uppercase
  // If location is not provided, use first two letters of shop name
  let locationCode;
  if (location) {
    locationCode = location.substring(0, 2).toUpperCase();
  } else if (shopName) {
    locationCode = shopName.substring(0, 2).toUpperCase();
  } else {
    locationCode = 'SH';
  }
  
  // Find the highest existing sequence number for this location
  const regex = new RegExp(`^${locationCode}\\d{2}$`);
  const existingShops = await Shop.find({ shopCode: regex });
  
  let maxSequence = 0;
  existingShops.forEach(shop => {
    if (shop.shopCode && shop.shopCode.length >= 4) {
      const sequence = parseInt(shop.shopCode.substring(2));
      if (!isNaN(sequence) && sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });
  
  // Increment sequence and pad with zeros
  const nextSequence = (maxSequence + 1).toString().padStart(2, '0');
  return `${locationCode}${nextSequence}`;
};

exports.addShop = async (req, res) => {
  const { name, location, shopPhoneNumber, gstNumber, fssaiNumber, username, password } = req.body;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userExists = await User.findOne({ username }).session(session);
    if (userExists) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'A user with this username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const shopRole = await Role.findOne({ name: 'shop' }).session(session);
    if (!shopRole) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: 'Shop role not found. Please create it first.' });
    }

    // Generate shop code
    const shopCode = await generateShopCode(location, name);

    const newUser = new User({
        name,
        username,
        email: `${username}@sweethubshop.com`,
        password: hashedPassword,
        role: shopRole._id,
        isVerified: true
    });
    await newUser.save({ session });

    const newShop = new Shop({ name, location, shopPhoneNumber, gstNumber, fssaiNumber, shopCode, user: newUser._id });
    await newShop.save({ session });

    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ message: 'Shop and user created successfully.', shop: newShop, user: newUser });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error adding shop:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getShops = async (req, res) => {
  console.log('=== GET SHOPS REQUEST ===');
  console.log('User:', req.user);
  
  try {
    const shops = await Shop.find().populate('user', 'username email');
    console.log('Found shops:', shops.length);
    console.log('Shops data:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateShop = async (req, res) => {
    const { id } = req.params;
    const { name, location, shopPhoneNumber, gstNumber, fssaiNumber, password } = req.body;
    try {
        const updatedShop = await Shop.findByIdAndUpdate(
            id,
            { name, location, shopPhoneNumber, gstNumber, fssaiNumber },
            { new: true }
        );
        if (!updatedShop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        
        // If password is provided, update the associated user's password
        if (password && updatedShop.user) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.findByIdAndUpdate(
                updatedShop.user,
                { password: hashedPassword }
            );
        }
        
        res.json(updatedShop);
    } catch (error) {
        console.error('Error updating shop:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteShop = async (req, res) => {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const shop = await Shop.findById(id).session(session);
        if (!shop) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Shop not found' });
        }

        if (shop.user) {
            await User.findByIdAndDelete(shop.user, { session });
        }

        await Shop.findByIdAndDelete(id, { session });

        await session.commitTransaction();
        session.endSession();

        res.json({ message: 'Shop and associated user deleted successfully' });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error deleting shop:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};