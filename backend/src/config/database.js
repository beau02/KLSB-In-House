const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('[DB] Starting MongoDB Atlas connection...');
    console.log('[DB] URI Set:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });

    console.log('[DB] ✓ Connected to MongoDB Atlas successfully!');
    console.log('[DB] Readystate:', mongoose.connection.readyState);
    
  } catch (error) {
    console.error('[DB] ✗ Connection failed');
    console.error('[DB] Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('[DB] → Username or password incorrect');
    } else if (error.message.includes('getaddrinfo')) {
      console.error('[DB] → Cannot reach cluster - check URL');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('[DB] → Connection refused - cluster offline?');
    } else if (error.message.includes('whitelist')) {
      console.error('[DB] → IP not whitelisted - add it to MongoDB Atlas');
    }
    
    console.warn('[DB] App running without database');
  }
};

module.exports = connectDB;
