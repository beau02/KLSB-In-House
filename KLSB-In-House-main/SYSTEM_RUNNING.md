# 🎉 Your System is Running!

## ✅ Services Running

1. **Backend API** - http://localhost:5000 ✅
2. **Web Application** - http://localhost:3000 ✅ (opened in browser)
3. **MongoDB** - Running ✅

## 📝 Create Your Admin User

Since PowerShell had some issues, create your admin user directly in the web browser:

### Option 1: Use the Registration (if available)
The system might have a registration endpoint at http://localhost:3000

### Option 2: Use Postman/Insomnia
1. Download Postman from https://www.postman.com/downloads/
2. Create a POST request to: `http://localhost:5000/api/auth/register`
3. Set Headers: `Content-Type: application/json`
4. Body (JSON):
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

### Option 3: Use the create-admin.ps1 Script
Open a **new** PowerShell window and run:
```powershell
cd C:\Users\User\Desktop\KLSB-In-House
.\create-admin.ps1
```

## 🔐 Login Credentials (After Creating Admin)

- **Email**: admin@example.com
- **Password**: admin123

## 🚀 What to Do Next

1. **Create the admin user** using one of the options above
2. **Login** at http://localhost:3000
3. **Create a Manager**:
   - Go to Staff Management → Add User
   - Role: Manager
   
4. **Create a Project**:
   - Go to Projects → New Project
   - Enter a project code (e.g., "PROJ001")
   
5. **Create an Employee**:
   - Go to Staff Management → Add User
   - Role: Employee
   
6. **Test Timesheet Workflow**:
   - Login as employee → Create timesheet
   - Submit for approval
   - Login as manager → Approve timesheet

## 📱 Mobile App (Optional)

To run the mobile app:

1. Open a new PowerShell window
2. Run:
```powershell
cd C:\Users\User\Desktop\KLSB-In-House\mobile-app
npm start
```

3. Install "Expo Go" on your phone
4. Scan the QR code
5. Update API URL in `mobile-app\src\services\api.js` with your computer's IP

## 🛑 Stopping Services

To stop the servers, simply close the PowerShell windows running them.

## 🔄 Restarting Later

To start everything again in the future:

```powershell
cd C:\Users\User\Desktop\KLSB-In-House
.\start-all.ps1
```

---

**Everything is ready! Create your admin user and start using the system!** 🎉
