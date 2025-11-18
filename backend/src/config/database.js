const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.error('Make sure MongoDB is running on mongodb://localhost:27017');
    // Don't exit immediately, let the app handle it
    setTimeout(() => process.exit(1), 1000);
  }
};

module.exports = connectDB;
