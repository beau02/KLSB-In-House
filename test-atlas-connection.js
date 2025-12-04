const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const testConnection = async () => {
    try {
        console.log('Testing Atlas connection...');
        console.log('URI:', process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@'));
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Connected to Atlas successfully!');
        
        const userCount = await mongoose.connection.db.collection('users').countDocuments();
        const projectCount = await mongoose.connection.db.collection('projects').countDocuments();
        const timesheetCount = await mongoose.connection.db.collection('timesheets').countDocuments();
        
        console.log(`\nData verification:`);
        console.log(`- Users: ${userCount}`);
        console.log(`- Projects: ${projectCount}`);
        console.log(`- Timesheets: ${timesheetCount}`);
        
        await mongoose.disconnect();
        console.log('\n✅ Test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Connection failed!');
        console.error('Error:', error.message);
        
        if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
            console.log('\n⚠️  Network/DNS issue detected');
            console.log('Possible causes:');
            console.log('1. No internet connection');
            console.log('2. DNS resolution issue');
            console.log('3. Firewall blocking MongoDB Atlas');
        } else if (error.message.includes('Authentication failed')) {
            console.log('\n⚠️  Authentication issue');
            console.log('Check your username/password in the connection string');
        } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.log('\n⚠️  IP Whitelist issue');
            console.log('Your IP address needs to be whitelisted in Atlas');
        }
        
        process.exit(1);
    }
};

testConnection();
