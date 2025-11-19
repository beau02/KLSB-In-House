const mongoose = require('mongoose');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/timesheet_db';
    await mongoose.connect(uri);
    const coll = mongoose.connection.db.collection('projects');

    console.log('Existing indexes:');
    console.log(await coll.indexes());

    // Attempt to drop the old unique index on projectCode
    try {
      await coll.dropIndex('projectCode_1');
      console.log('Dropped index: projectCode_1');
    } catch (e) {
      console.log('Could not drop projectCode_1 (may not exist or permission issue):', e.message);
    }

    // Create a non-unique index on projectCode for lookups (optional)
    try {
      await coll.createIndex({ projectCode: 1 }, { unique: false });
      console.log('Created non-unique index on projectCode');
    } catch (e) {
      console.error('Failed to create non-unique index:', e.message);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
})();