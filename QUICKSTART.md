# Quick Start Guide - KLSB Timesheet System

## ✅ Setup Complete!

All dependencies have been installed successfully:
- ✅ Backend dependencies installed
- ✅ Web frontend dependencies installed  
- ✅ Mobile app dependencies installed
- ✅ Environment file configured with secure JWT secret

## ⚠️ MongoDB Required

MongoDB was not found on your system. You have two options:

### Option 1: Use MongoDB Atlas (Cloud - Recommended for Quick Start)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a free cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `backend\.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/timesheet_db?retryWrites=true&w=majority
   ```
   (Replace with your actual connection string)

### Option 2: Install MongoDB Locally

**Using Chocolatey (Recommended):**
```powershell
# Install Chocolatey if not installed
# Then install MongoDB:
choco install mongodb
```

**Manual Installation:**
1. Download from https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. MongoDB will run on `mongodb://localhost:27017` (already configured)

## 🚀 Running the Application

### 1. Start Backend Server
```powershell
cd C:\Users\User\Desktop\KLSB-In-House\backend
npm run dev
```
Server will run on: http://localhost:5000

### 2. Start Web Frontend (New Terminal)
```powershell
cd C:\Users\User\Desktop\KLSB-In-House\web-frontend
npm run dev
```
Web app will run on: http://localhost:3000

### 3. Start Mobile App (New Terminal)
```powershell
cd C:\Users\User\Desktop\KLSB-In-House\mobile-app
npm start
```

**For Mobile:**
- Install "Expo Go" app on your phone
- Scan the QR code shown in terminal
- Update API URL in `mobile-app\src\services\api.js` with your computer's IP

## 📝 Creating Your First Admin User

Once the backend is running, create an admin user using PowerShell:

```powershell
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

Then login with:
- Email: `admin@example.com`
- Password: `admin123`

## 🔧 Troubleshooting

### Backend won't start
- Make sure MongoDB is running
- Check `.env` file has correct MongoDB URI
- Check port 5000 is not in use

### Web frontend connection error
- Make sure backend is running on port 5000
- Check browser console for errors

### Mobile app can't connect
- Use your computer's IP address instead of localhost
- Update `mobile-app\src\services\api.js`:
  ```javascript
  const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';
  ```
- Find your IP: Run `ipconfig` and look for IPv4 Address

## 📚 Next Steps

1. ✅ Install/Configure MongoDB (choose Option 1 or 2 above)
2. ✅ Start the backend server
3. ✅ Start the web frontend
4. ✅ Create your first admin user
5. ✅ Login and start using the system!

### After Setup:
- Create managers and employees
- Create projects with project codes
- Create timesheets
- Test the approval workflow
- View reports

## 📖 Documentation

- Full API documentation: `PROJECT_STRUCTURE.md`
- Detailed installation guide: `INSTALLATION.md`

## 🎯 Current Configuration

**Backend:**
- Port: 5000
- MongoDB: localhost:27017 (update if using Atlas)
- JWT Secret: Securely generated
- Environment: development

**Web Frontend:**
- Port: 3000
- API Proxy: Configured for localhost:5000

**Mobile App:**
- Framework: Expo
- API: Update in src/services/api.js

---

**Your timesheet management system is ready to run!** 🎉

Just install MongoDB and start the servers!
