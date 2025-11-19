const mongoose = require('mongoose');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/timesheet_db';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const coll = mongoose.connection.db.collection('users');

    console.log('Existing indexes:');
    console.log(await coll.indexes());

    // Try to drop the old employeeNo unique index (name usually 'employeeNo_1')
    try {
      await coll.dropIndex('employeeNo_1');
      console.log('Dropped index: employeeNo_1');
    } catch (e) {
      console.log('Could not drop employeeNo_1 (may not exist or permission issue):', e.message);
    }

    // Create a new unique partial index that ignores empty strings
    try {
      await coll.createIndex(
        { employeeNo: 1 },
        { unique: true, partialFilterExpression: { employeeNo: { $exists: true, $ne: '' } } }
      );
      console.log('Created new partial unique index on employeeNo (ignores empty string values)');
    } catch (e) {
      console.error('Failed to create new index:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
})();