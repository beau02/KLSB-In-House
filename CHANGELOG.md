# Changelog

All notable changes to the KLSB Timesheet System will be documented in this file.

## [v1.1.0] - 2026-01-14

### ✨ New Features

#### Editable Project and Area for Draft/Rejected Timesheets
- **What's New**: Users can now edit the Project and Area fields for timesheets in DRAFT or REJECTED status
- **Previous Behavior**: Once a timesheet was created, the Project and Area fields were locked and could not be changed
- **Current Behavior**: 
  - Project and Area fields are now **editable** when timesheet status is `DRAFT` or `REJECTED`
  - Fields remain **locked** (read-only) for `SUBMITTED`, `APPROVED`, or `RESUBMITTED` statuses
  - Update button is now enabled for draft and rejected timesheets
- **Use Case**: Employees can correct project assignments if they created a timesheet for the wrong project before submitting it, or after it has been rejected by their supervisor

### 🐛 Bug Fixes

#### Fixed Approval Page Not Refreshing
- **Issue**: After approving or rejecting a timesheet, the approvals list did not automatically refresh
- **Fix**: Approval page now automatically reloads the timesheet list after approve/reject actions
- **Impact**: Supervisors see updated status immediately without manual page refresh

#### Fixed Timesheet List Not Showing Updated Projects
- **Issue**: After updating a timesheet's project, the list displayed old cached data
- **Root Cause**: Frontend cache was serving stale data (180-second TTL) instead of fetching updated information
- **Fix**: 
  - Implemented cache bypass mechanism for post-update data refresh
  - Enhanced cache invalidation to clear all user-specific timesheet cache entries
  - Added `bypassCache` option to force fresh data fetch from server
- **Impact**: Timesheet list now immediately reflects project/area changes after updates

### 🔧 Technical Changes

#### Frontend Improvements
- Enhanced `timesheetService.update()` with comprehensive cache clearing
- Added `bypassCache` option to `timesheetService.getByUser()`
- Modified `TimesheetsPage.loadData()` to accept cache bypass parameter
- Improved logging for debugging cache and update operations

#### Backend Improvements
- Updated `timesheetController.updateTimesheet()` to use `findOneAndUpdate` with `runValidators: false`
- Added database verification query after updates to confirm persistence
- Enhanced error logging for update operations

---

## [v1.0.0] - Initial Release

### Features
- User authentication and authorization
- Timesheet creation and management
- Project tracking with discipline codes
- Overtime request workflow
- Approval workflow for timesheets and overtime
- Dashboard with statistics
- Project costing reports
- Department management
- MongoDB Atlas database integration
- JWT-based authentication
- Caching layer for improved performance
