# Installation Guide

## Quick Start

### 1. Install MongoDB

**Option A: Local Installation**
```powershell
# Download MongoDB Community Server from:
# https://www.mongodb.com/try/download/community

# Or use Chocolatey:
choco install mongodb
```

**Option B: Use MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get your connection string

### 2. Backend Setup

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env file with your settings
notepad .env
```

Update your `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timesheet_db
JWT_SECRET=your_very_secure_secret_key_here_change_this
JWT_EXPIRE=7d
NODE_ENV=development
```

```powershell
# Start the backend server
npm run dev
```

### 3. Web Frontend Setup

```powershell
# Open new terminal
cd web-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Access at: http://localhost:3000

### 4. Mobile App Setup

```powershell
# Open new terminal
cd mobile-app

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Start Expo
npm start
```

**To test on phone:**
1. Install "Expo Go" app from App Store/Play Store
2. Scan QR code from terminal

**Important:** Update API URL in `mobile-app/src/services/api.js`:
```javascript
// For local development, use your computer's IP
const API_URL = 'http://YOUR_COMPUTER_IP:5000/api';
// Example: 'http://192.168.1.100:5000/api'
```

### 5. Create Initial Admin User

You can create an admin user via API:

```powershell
# Use PowerShell to create admin user
$body = @{
    email = "admin@example.com"
    password = "admin123"
    firstName = "Admin"
    lastName = "User"
    role = "admin"
    department = "IT"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

Or use Postman/Insomnia to POST to `/api/auth/register` with:
```json
{
  "email": "admin@example.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "department": "IT"
}
```

## Testing the Application

### 1. Login
- Email: `admin@example.com`
- Password: `admin123`

### 2. Create Test Data

**Create a Manager:**
1. Go to Staff Management
2. Add new user with role "manager"

**Create a Project:**
1. Go to Projects
2. Add new project with code (e.g., "PROJ001")

**Create a Timesheet:**
1. Go to My Timesheets
2. Create new timesheet
3. Select project and month
4. Add time entries
5. Submit for approval

**Approve Timesheet:**
1. Login as manager/admin
2. Go to Approvals (if implemented in UI)
3. Or use API to approve

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Make sure MongoDB is running
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Start MongoDB service
Start-Service MongoDB
```

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
Solution: Change PORT in `.env` or kill the process using port 5000

### Web Frontend Issues

**API Connection Error:**
- Make sure backend is running on port 5000
- Check proxy configuration in `vite.config.js`

### Mobile App Issues

**Cannot connect to API:**
- Use your computer's IP address, not `localhost`
- Make sure your phone and computer are on the same network
- Disable firewall temporarily to test

**Find your IP address:**
```powershell
ipconfig
# Look for IPv4 Address under your active network adapter
```

## Development Workflow

1. **Always start backend first**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Then start web frontend**
   ```powershell
   cd web-frontend
   npm run dev
   ```

3. **For mobile development**
   ```powershell
   cd mobile-app
   npm start
   ```

## Building for Production

### Backend
```powershell
cd backend
npm start
```

### Web Frontend
```powershell
cd web-frontend
npm run build
# Outputs to dist/ folder
```

### Mobile App
```powershell
cd mobile-app
# For Android
expo build:android

# For iOS
expo build:ios
```

## Environment Variables Reference

### Backend (.env)
```
PORT=5000                                    # Server port
MONGODB_URI=mongodb://localhost:27017/timesheet_db  # Database connection
JWT_SECRET=your_secret_key                   # JWT secret (change this!)
JWT_EXPIRE=7d                                # Token expiration
NODE_ENV=development                         # Environment
```

## Recommended VS Code Extensions

- ESLint
- Prettier
- MongoDB for VS Code
- REST Client (for API testing)
- React Developer Tools

## Next Steps

After installation:
1. Explore the API endpoints using Postman
2. Create sample users with different roles
3. Create multiple projects
4. Test the timesheet workflow
5. Test the approval process
6. View reports and statistics

For detailed API documentation, see PROJECT_STRUCTURE.md
