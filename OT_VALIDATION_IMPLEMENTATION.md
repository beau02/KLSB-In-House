# OT Approval Validation Implementation

## Overview
Implemented logic to prevent users from entering OT hours in timesheets for dates where their OT requests have been rejected by admin.

## Changes Made

### 1. Backend Structure (No Changes Required)
The existing backend already supports:
- OT request model with `status` field (pending/approved/rejected)
- Rejection reason field
- Date-based OT requests
- Endpoints: `/overtime-requests/my-requests` and `/overtime-requests`

### 2. Frontend Service Layer (`frontend/src/services/index.js`)
Created new `overtimeRequestService` with methods:
- `getMyRequests()` - Fetch current user's OT requests
- `getAll(params)` - Fetch all OT requests (admin)
- `getById(id)` - Get specific OT request
- `create(requestData)` - Create new OT request
- `update(id, requestData)` - Update existing OT request
- `approve(id)` - Approve OT request (admin)
- `reject(id, rejectionReason)` - Reject OT request (admin)
- `delete(id)` - Delete OT request

### 3. Timesheets Page (`frontend/src/pages/TimesheetsPage.jsx`)

#### Imports Added:
- `Tooltip`, `Block` from MUI
- `overtimeRequestService` from services

#### State Management:
- Added `overtimeRequests` state to store user's OT requests

#### Dialog Open Logic:
- Modified `handleOpenDialog()` to be async
- Loads user's OT requests when opening timesheet dialog
- Stores OT requests in state for validation

#### Validation Functions:
- `isOTBlockedForDate(date)` - Checks if a date has a rejected OT request
- Returns the rejected OT request object if found, otherwise undefined

#### Entry Change Handler:
- Modified `handleEntryChange()` to block OT hour changes on rejected dates
- Shows alert when user tries to input OT hours for blocked dates

#### Submit Validation:
- Enhanced `handleSubmit()` to validate before saving
- Prevents submission if any entries have OT hours on rejected dates
- Shows specific dates that have validation errors

#### UI Changes:
- OT Hours input field shows:
  - **Rejected dates**: Disabled field with value 0, red text, Block icon, and tooltip showing rejection reason
  - **Normal dates**: Regular enabled input field
- Visual feedback includes:
  - Red colored disabled field for rejected dates
  - Block (🚫) icon next to disabled field
  - Tooltip on hover showing rejection reason

### 4. OT Request Page (`frontend/src/pages/OvertimeRequestPage.jsx`)
Refactored to use `overtimeRequestService` instead of direct API calls:
- `fetchRequests()` - Uses `overtimeRequestService.getMyRequests()`
- `fetchProjects()` - Uses `projectService.getAll()`
- Create/Update - Uses `overtimeRequestService.create()` and `.update()`
- Delete - Uses `overtimeRequestService.delete()`

### 5. OT Approval Page (`frontend/src/pages/OvertimeApprovalPage.jsx`)
Refactored to use `overtimeRequestService` instead of direct API calls:
- `fetchRequests()` - Uses `overtimeRequestService.getAll()`
- `handleApprove()` - Uses `overtimeRequestService.approve()`
- `handleReject()` - Uses `overtimeRequestService.reject()`

## User Flow

### Scenario 1: Rejected OT Request
1. User requests OT for specific date (e.g., Jan 15, 2024)
2. Admin rejects the request with reason: "Not approved due to project constraints"
3. User opens timesheet dialog
4. System loads all user's OT requests including rejected ones
5. For Jan 15, 2024:
   - OT Hours field is disabled and shows 0
   - Red Block icon appears next to the field
   - Hovering shows tooltip: "OT request rejected: Not approved due to project constraints"
6. If user tries to manually change (shouldn't be possible due to disabled state), alert shows
7. If somehow OT hours are set and user tries to submit, validation prevents submission with error message

### Scenario 2: Approved/Pending OT Request
1. User requests OT for specific date
2. Admin approves OR request is still pending
3. User can input OT hours normally in timesheet for that date
4. No restrictions applied

### Scenario 3: No OT Request
1. User hasn't requested OT for a date
2. User can input OT hours normally (following other business rules)
3. No restrictions applied

## Validation Layers

### Layer 1: UI Disabled State
- OT Hours input field is disabled for rejected dates
- User cannot interact with the field

### Layer 2: Change Handler Block
- If user somehow tries to change the value, `handleEntryChange()` blocks it
- Shows alert message

### Layer 3: Submit Validation
- Before saving timesheet, `handleSubmit()` validates all entries
- Prevents submission if any rejected dates have OT hours > 0
- Shows list of problematic dates

## Technical Details

### Date Comparison
```javascript
const isOTBlockedForDate = (date) => {
  const dateStr = moment(date).format('YYYY-MM-DD');
  const rejectedRequest = overtimeRequests.find(req => {
    const reqDateStr = moment(req.date).format('YYYY-MM-DD');
    return reqDateStr === dateStr && req.status === 'rejected';
  });
  return rejectedRequest;
};
```

### Visual Feedback (Dark Mode Compatible)
```javascript
<Tooltip title={`OT request rejected: ${rejectedOT.rejectionReason || 'No reason provided'}`} arrow>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <TextField
      type="number"
      size="small"
      fullWidth
      value={0}
      disabled
      sx={{
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? '#ef4444' : '#dc2626',
          cursor: 'not-allowed'
        }
      }}
    />
    <Block sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#ef4444' : '#dc2626', fontSize: 20 }} />
  </Box>
</Tooltip>
```

## Benefits

1. **Business Logic Enforcement**: Ensures rejected OT requests prevent actual OT hour input
2. **User Clarity**: Clear visual feedback about why OT hours can't be entered
3. **Data Integrity**: Multiple validation layers prevent invalid data
4. **Audit Trail**: Rejection reasons are shown to users
5. **Consistent API**: All OT-related operations use centralized service layer
6. **Type Safety**: Service layer provides consistent data structure handling

## Testing Checklist

- [ ] Create OT request for a future date
- [ ] Admin rejects the request with a reason
- [ ] User opens timesheet for that month
- [ ] Verify OT Hours field is disabled for the rejected date
- [ ] Hover over disabled field to see rejection reason tooltip
- [ ] Try to submit timesheet (should work if no other issues)
- [ ] Create another timesheet entry with normal OT hours on approved/non-requested dates
- [ ] Verify normal dates allow OT hour input
- [ ] Test in both light and dark mode for visual consistency

## Future Enhancements

1. Add visual indicator on the date row itself (e.g., red border)
2. Show summary of rejected OT requests at top of timesheet dialog
3. Add link to view OT request details directly from timesheet
4. Consider auto-notifying users when their OT requests are rejected
5. Add ability to re-request OT directly from timesheet page
