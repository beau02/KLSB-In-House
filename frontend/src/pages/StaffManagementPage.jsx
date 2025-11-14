import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Grid
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { userService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const StaffManagementPage = () => {
  const { isAdmin, isEmployee } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeNo: '',
    designation: '',
    contactNo: '',
    department: '',
    role: 'employee',
    status: 'active'
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await userService.getAll();
      setStaff(response.users || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (staffMember = null) => {
    if (staffMember) {
      setSelectedStaff(staffMember);
      setFormData({
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
        password: '',
        employeeNo: staffMember.employeeNo || '',
        designation: staffMember.designation || '',
        contactNo: staffMember.contactNo || '',
        department: staffMember.department || '',
        role: staffMember.role,
        status: staffMember.status
      });
    } else {
      setSelectedStaff(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        employeeNo: '',
        designation: '',
        contactNo: '',
        department: '',
        role: 'employee',
        status: 'active'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStaff(null);
  };

  const handleSubmit = async () => {
    try {
      const submitData = { ...formData };
      
      // Remove password field if empty (for updates)
      if (selectedStaff && !submitData.password) {
        delete submitData.password;
      }

      if (selectedStaff) {
        await userService.update(selectedStaff._id, submitData);
      } else {
        await userService.create(submitData);
      }
      handleCloseDialog();
      loadStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      alert(error.response?.data?.message || 'Error saving staff member');
    }
  };

  const handleDelete = async (staffMember) => {
    const isInactive = staffMember.status === 'inactive';
    
    if (isInactive) {
      // Second click - permanent delete
      if (window.confirm('⚠️ WARNING: This will PERMANENTLY delete this staff member and cannot be undone. Are you sure?')) {
        try {
          await userService.permanentDelete(staffMember._id);
          alert('Staff member permanently deleted');
          loadStaff();
        } catch (error) {
          console.error('Error permanently deleting staff:', error);
          alert(error.response?.data?.message || 'Error permanently deleting staff member');
        }
      }
    } else {
      // First click - set to inactive
      if (window.confirm('This will deactivate the staff member. Click delete again to permanently remove.')) {
        try {
          await userService.delete(staffMember._id);
          alert('Staff member deactivated');
          loadStaff();
        } catch (error) {
          console.error('Error deactivating staff:', error);
          alert(error.response?.data?.message || 'Error deactivating staff member');
        }
      }
    }
  };

  const getStatusChip = (status) => {
    return (
      <Chip
        label={status.toUpperCase()}
        color={status === 'active' ? 'success' : 'default'}
        size="small"
      />
    );
  };

  const getRoleChip = (role) => {
    const colors = {
      admin: 'error',
      manager: 'warning',
      employee: 'primary'
    };
    return <Chip label={role.toUpperCase()} color={colors[role]} size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: '95%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#030C69' }}>
          Staff Management
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage employee information and access
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        {!isEmployee && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Staff
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Employee No</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Name</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Designation</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Contact No.</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Department</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Email</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Role</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
              {!isEmployee && <TableCell sx={{ whiteSpace: 'nowrap' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isEmployee ? 8 : 9} align="center">
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member._id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.employeeNo || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{`${member.firstName} ${member.lastName}`}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.designation || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.contactNo || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.department || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.email}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{getRoleChip(member.role)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{getStatusChip(member.status)}</TableCell>
                  {!isEmployee && (
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => handleOpenDialog(member)}>
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color={member.status === 'inactive' ? 'error' : 'warning'}
                        onClick={() => handleDelete(member)}
                        title={member.status === 'inactive' ? 'Permanently Delete' : 'Deactivate'}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee No"
                value={formData.employeeNo}
                onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                placeholder="e.g., KL-22-089"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g., Junior Designer"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact No."
                value={formData.contactNo}
                onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                placeholder="e.g., 016-3124548"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Engineering Department"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!selectedStaff}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedStaff}
                helperText={selectedStaff ? "Leave empty to keep current password" : ""}
              />
            </Grid>
            {isAdmin && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedStaff ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
