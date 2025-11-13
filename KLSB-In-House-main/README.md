# KLSB In-House Timesheet Management System

A comprehensive timesheet management system for web and mobile platforms with all the requested modules.

## Features

### ✅ Module for Input Timesheet per Month
- Create monthly timesheets
- Add daily time entries with hours and descriptions
- Assign timesheets to specific projects
- Track total hours automatically

### ✅ Module to Add Staff and Personnel
- Create and manage user accounts
- Role-based access control (Admin, Manager, Employee)
- User profiles with department and contact info
- Active/Inactive status management

### ✅ Module to Add Project Code
- Create projects with unique project codes
- Project details including name, description, dates
- Assign project managers
- Track project status (Active, Completed, On-hold, Cancelled)
- Budget tracking

### ✅ Module to Approve Timesheet by PIC
- Submit timesheets for approval
- Manager/Admin approval workflow
- Approve or reject with comments
- Approval history tracking

### ✅ Module to Display Timesheet per Month
- View all timesheets by month
- Filter by project and personnel
- Display project details and personnel information
- Monthly reports and statistics

## Technology Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Web Frontend
- React.js with Vite
- Material-UI (MUI)
- React Router v6
- Axios
- Moment.js

### Mobile App
- React Native with Expo
- React Native Paper
- React Navigation
- Axios

## ✅ Setup Status

**Your project has been set up!** All dependencies are installed and configured.

### What's Been Done:
- ✅ Backend dependencies installed
- ✅ Web frontend dependencies installed
- ✅ Mobile app dependencies installed
- ✅ Environment file configured with secure JWT secret

### What You Need to Do:

**1. Install MongoDB** (Choose one):
   - **Cloud (Easiest)**: Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and update `backend\.env` with your connection string
   - **Local**: Install from [mongodb.com](https://www.mongodb.com/try/download/community) or run `choco install mongodb`

**2. Start the servers**:
   ```powershell
   # Run this script to start everything:
   .\start-all.ps1
   
   # OR start manually:
   # Terminal 1: cd backend; npm run dev
   # Terminal 2: cd web-frontend; npm run dev
   # Terminal 3: cd mobile-app; npm start
   ```

**3. Create admin user**:
   ```powershell
   .\create-admin.ps1
   ```

**4. Login**:
   - Web: http://localhost:3000
   - Email: `admin@example.com`
   - Password: `admin123`

📖 See [QUICKSTART.md](QUICKSTART.md) for detailed instructions!

## Documentation

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Detailed architecture and API docs
- [INSTALLATION.md](INSTALLATION.md) - Step-by-step installation guide

## Key Features Implemented

✅ **Module 1: Input Timesheet per Month**
- Monthly timesheet creation and management
- Daily time entry tracking
- Project assignment per timesheet

✅ **Module 2: Add Staff and Personnel**
- User management with roles (Admin, Manager, Employee)
- Department and contact information
- Active/Inactive status control

✅ **Module 3: Add Project Code**
- Project creation with unique codes
- Project details and budget tracking
- Manager assignment

✅ **Module 4: Approve Timesheet by PIC**
- Submit timesheets for approval
- Manager/Admin approval workflow
- Approve/Reject with comments

✅ **Module 5: Display Timesheet per Month**
- Monthly timesheet views
- Filter by project and personnel
- Comprehensive reporting module
- Project and personnel details display
