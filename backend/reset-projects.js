// Drop and recreate projects collection
const mongoose = require('mongoose');

async function resetProjects() {
  try {
    await mongoose.connect('mongodb://localhost:27017/timesheet_db');
    
    // Drop the projects collection
    await mongoose.connection.db.dropCollection('projects');
    console.log('Projects collection dropped successfully');
    
    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetProjects();
