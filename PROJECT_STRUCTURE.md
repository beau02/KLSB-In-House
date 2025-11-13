# Timesheet Management System

## Overview
A comprehensive timesheet management system for web and mobile platforms.

## Core Modules

### 1. Timesheet Input Module
- Monthly timesheet entry
- Daily time logging
- Project assignment per entry
- Hours tracking

### 2. Staff & Personnel Management Module
- Add/Edit/Delete staff members
- Staff profiles with roles
- Department assignment
- Contact information

### 3. Project Code Management Module
- Create project codes
- Project details (name, description, budget)
- Project status tracking
- Assign project managers

### 4. Timesheet Approval Module
- Review pending timesheets
- Approve/Reject functionality
- Comments and feedback
- Approval history tracking

### 5. Timesheet Display & Reporting Module
- Monthly timesheet view
- Filter by project
- Filter by personnel
- Export capabilities (PDF, Excel)
- Summary statistics

## Technology Stack

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- RESTful API architecture

### Web Frontend
- React.js
- Material-UI / Tailwind CSS
- Axios for API calls
- React Router for navigation

### Mobile App
- React Native
- Expo framework
- Native Base / React Native Paper
- Shared API with web

## Project Structure
```
KLSB-In-House/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── web-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
├── mobile-app/
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── services/
│   │   ├── navigation/
│   │   └── App.js
│   └── package.json
└── README.md
```

## Database Schema

### Users Collection
- _id
- email
- password (hashed)
- firstName
- lastName
- role (admin, manager, employee)
- department
- status (active/inactive)
- createdAt
- updatedAt

### Projects Collection
- _id
- projectCode (unique)
- projectName
- description
- startDate
- endDate
- status (active/completed/on-hold)
- managerId (reference to Users)
- budget
- createdAt
- updatedAt

### Timesheets Collection
- _id
- userId (reference to Users)
- projectId (reference to Projects)
- month
- year
- entries (array of daily entries)
  - date
  - hours
  - description
- status (draft/submitted/approved/rejected)
- submittedAt
- approvedBy (reference to Users)
- approvalDate
- comments
- createdAt
- updatedAt

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout

### Users/Staff
- GET /api/users
- GET /api/users/:id
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

### Projects
- GET /api/projects
- GET /api/projects/:id
- POST /api/projects
- PUT /api/projects/:id
- DELETE /api/projects/:id

### Timesheets
- GET /api/timesheets
- GET /api/timesheets/:id
- GET /api/timesheets/user/:userId
- GET /api/timesheets/project/:projectId
- POST /api/timesheets
- PUT /api/timesheets/:id
- DELETE /api/timesheets/:id
- PATCH /api/timesheets/:id/submit
- PATCH /api/timesheets/:id/approve
- PATCH /api/timesheets/:id/reject

### Reports
- GET /api/reports/monthly
- GET /api/reports/by-project
- GET /api/reports/by-user
- GET /api/reports/export
