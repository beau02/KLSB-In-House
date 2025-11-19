const mongoose = require('mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timesheet_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const coll = mongoose.connection.db.collection('timesheets');
    console.log('Existing indexes:');
    console.log(await coll.indexes());

    // Try to drop the old index if it exists
    try {
      await coll.dropIndex({ userId: 1, projectId: 1, month: 1, year: 1 });
      console.log('Dropped old index { userId:1, projectId:1, month:1, year:1 }');
    } catch (e) {
      console.log('Old index not dropped (may not exist):', e.message);
    }

    // Create new index including disciplineCode
    try {
      await coll.createIndex({ userId: 1, projectId: 1, disciplineCode: 1, month: 1, year: 1 }, { unique: true });
      console.log('Created new unique index including disciplineCode');
    } catch (e) {
      console.error('Failed to create new index:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
})();