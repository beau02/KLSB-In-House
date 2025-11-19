const mongoose = require('mongoose');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/timesheet_db';
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const coll = db.collection('users');

    console.log('Updating users with empty employeeNo to unset the field...');
    const updateResult = await coll.updateMany({ employeeNo: '' }, { $unset: { employeeNo: '' } });
    console.log(`Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);

    console.log('Creating unique sparse index on employeeNo...');
    try {
      await coll.createIndex({ employeeNo: 1 }, { unique: true, sparse: true });
      console.log('Created unique sparse index on employeeNo');
    } catch (err) {
      console.error('Failed to create unique sparse index:', err.message);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
})();