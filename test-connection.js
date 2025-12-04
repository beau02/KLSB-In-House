const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function testAtlasConnection() {
  try {
    console.log('🔌 Testing Atlas connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
    console.log('');

    const startTime = Date.now();
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Connected to Atlas successfully! (${elapsed}ms)`);
    console.log('');

    // Test the users collection
    const db = mongoose.connection.db;
    const usersCount = await db.collection('users').countDocuments();
    const projectsCount = await db.collection('projects').countDocuments();
    const timesheetsCount = await db.collection('timesheets').countDocuments();

    console.log('📊 Data in Atlas:');
    console.log(`  • Users: ${usersCount}`);
    console.log(`  • Projects: ${projectsCount}`);
    console.log(`  • Timesheets: ${timesheetsCount}`);
    console.log('');

    if (usersCount > 0) {
      console.log('✅ Data is present! Login should work.');
    } else {
      console.log('⚠️  No users found. Data may not be imported correctly.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 DNS Error - Cannot resolve hostname');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out')) {
      console.log('💡 Connection Timeout - Check network/firewall');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Authentication Failed - Check credentials');
    } else if (error.message.includes('Unauthorized') || error.message.includes('forbidden')) {
      console.log('💡 Access Denied - IP may not be whitelisted');
    }
    
    process.exit(1);
  }
}

testAtlasConnection();
