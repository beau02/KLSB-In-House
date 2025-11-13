const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/timesheet_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Get the timesheets collection
    const collection = db.collection('timesheets');

    // Find all timesheets with old format entries
    const timesheets = await collection.find({}).toArray();

    console.log(`Found ${timesheets.length} timesheets to migrate`);

    let migratedCount = 0;

    for (const timesheet of timesheets) {
      let needsUpdate = false;
      const updatedEntries = (timesheet.entries || []).map(entry => {
        // If entry has old 'hours' field but no normalHours/otHours
        if (entry.hours !== undefined && entry.normalHours === undefined) {
          needsUpdate = true;
          return {
            date: entry.date,
            normalHours: entry.hours || 0,
            otHours: 0,
            description: entry.description || ''
          };
        }
        // If entry already has new format, keep it
        return entry;
      });

      if (needsUpdate) {
        // Calculate new totals
        const totalNormalHours = updatedEntries.reduce((sum, e) => sum + (e.normalHours || 0), 0);
        const totalOTHours = updatedEntries.reduce((sum, e) => sum + (e.otHours || 0), 0);
        const totalHours = totalNormalHours + totalOTHours;

        await collection.updateOne(
          { _id: timesheet._id },
          {
            $set: {
              entries: updatedEntries,
              totalNormalHours: totalNormalHours,
              totalOTHours: totalOTHours,
              totalHours: totalHours
            }
          }
        );
        migratedCount++;
        console.log(`Migrated timesheet ${timesheet._id}`);
      }
    }

    console.log(`\nMigration complete! Updated ${migratedCount} timesheets.`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
});
