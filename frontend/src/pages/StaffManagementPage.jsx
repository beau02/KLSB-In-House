import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Button,
  InputAdornment,
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
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, AdminPanelSettings, Person, ManageAccounts, Search, Close } from '@mui/icons-material';
import { userService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const StaffManagementPage = () => {
  const { isAdmin, isEmployee } = useAuth();
  const [staff, setStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]); // Store all staff for client-side filtering
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
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
      setLoading(true);
      const response = await userService.getAll();
      const users = response.users || [];
      setAllStaff(users);
      setStaff(users); // Initially show all
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering - no server reload
  useEffect(() => {
    if (!nameFilter || nameFilter.trim() === '') {
      setStaff(allStaff);
      return;
    }
    
    const searchTerm = nameFilter.toLowerCase().trim();
    const filtered = allStaff.filter(s => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const email = (s.email || '').toLowerCase();
      const empNo = (s.employeeNo || '').toLowerCase();
      const designation = (s.designation || '').toLowerCase();
      
      return fullName.includes(searchTerm) ||
             email.includes(searchTerm) ||
             empNo.includes(searchTerm) ||
             designation.includes(searchTerm);
    });
    
    setStaff(filtered);
  }, [nameFilter, allStaff]);

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
        status: staffMember.status,
        hourlyRate: staffMember.hourlyRate || 0
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
        status: 'active',
        hourlyRate: 0
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

      console.log('Submitting staff update:', submitData);
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
        sx={{
          backgroundColor: status === 'active' ? '#e8f5e9' : '#fafafa',
          color: status === 'active' ? '#2e7d32' : '#757575',
          fontWeight: 600,
          border: status === 'active' ? '1px solid #2e7d3230' : '1px solid #75757530'
        }}
        size="small"
      />
    );
  };

  const getRoleChip = (role) => {
    const roleConfig = {
      admin: { 
        color: 'error', 
        icon: <AdminPanelSettings sx={{ fontSize: 16 }} />,
        bg: '#fff5f5',
        textColor: '#d32f2f'
      },
      manager: { 
        color: 'warning', 
        icon: <ManageAccounts sx={{ fontSize: 16 }} />,
        bg: '#fff8e1',
        textColor: '#f57c00'
      },
      employee: { 
        color: 'primary', 
        icon: <Person sx={{ fontSize: 16 }} />,
        bg: '#e3f2fd',
        textColor: '#1976d2'
      }
    };
    
    const config = roleConfig[role] || roleConfig.employee;
    
    return (
      <Chip 
        icon={config.icon}
        label={role.toUpperCase()} 
        sx={{
          backgroundColor: config.bg,
          color: config.textColor,
          fontWeight: 600,
          border: `1px solid ${config.textColor}30`,
          '& .MuiChip-icon': {
            color: config.textColor
          }
        }}
        size="small" 
      />
    );
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

      {/* Role Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                  <AdminPanelSettings sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {staff.filter(s => s.role === 'admin').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Administrators
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                  <ManageAccounts sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {staff.filter(s => s.role === 'manager').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Managers
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                  <Person sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {staff.filter(s => s.role === 'employee').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Employees
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        {!isEmployee && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            Add Staff
          </Button>
        )}
        <Box sx={{ ml: 2, minWidth: 320 }}>
          <TextField
            fullWidth
            label="Search staff"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Name, email, employee no, designation..."
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: nameFilter && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setNameFilter('')}
                    edge="end"
                  >
                    <Close />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
        <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f7fa' }}>
              <TableCell sx={{ width: 180, fontWeight: 700 }}>Employee No</TableCell>
              <TableCell sx={{ width: 120, fontWeight: 700 }}>Hourly Rate</TableCell>
              <TableCell sx={{ width: 200, fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ width: 160, fontWeight: 700 }}>Designation</TableCell>
              <TableCell sx={{ width: 130, fontWeight: 700 }}>Contact No.</TableCell>
              <TableCell sx={{ width: 160, fontWeight: 700 }}>Department</TableCell>
              <TableCell sx={{ width: 240, fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ width: 120, fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ width: 100, fontWeight: 700 }}>Status</TableCell>
              {!isEmployee && <TableCell sx={{ width: 110, fontWeight: 700 }}>Actions</TableCell>}
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
                <TableRow 
                  key={member._id}
                  sx={{ 
                    '&:hover': { bgcolor: '#f8f9fa' },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{member.employeeNo || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(member.hourlyRate || 0)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', fontWeight: 600 }}>{`${member.firstName} ${member.lastName}`}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{member.designation || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.contactNo || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{member.department || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{member.email}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{getRoleChip(member.role)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{getStatusChip(member.status)}</TableCell>
                  {!isEmployee && (
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(member)}
                        sx={{ 
                          color: '#1976d2',
                          '&:hover': { bgcolor: '#e3f2fd' }
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color={member.status === 'inactive' ? 'error' : 'warning'}
                        onClick={() => handleDelete(member)}
                        title={member.status === 'inactive' ? 'Permanently Delete' : 'Deactivate'}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: member.status === 'inactive' ? '#ffebee' : '#fff8e1' 
                          }
                        }}
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
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
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
                label="Hourly Rate (MYR)"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                helperText="Set employee's hourly cost in MYR"
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
                  <MenuItem value="employee">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Person sx={{ fontSize: 18, color: '#1976d2' }} />
                      <span>Employee</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="manager">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ManageAccounts sx={{ fontSize: 18, color: '#f57c00' }} />
                      <span>Manager</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="admin">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AdminPanelSettings sx={{ fontSize: 18, color: '#d32f2f' }} />
                      <span>Admin</span>
                    </Stack>
                  </MenuItem>
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
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ color: '#757575' }}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
          >
            {selectedStaff ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
