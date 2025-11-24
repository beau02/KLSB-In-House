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
  Divider,
  useTheme,
  useMediaQuery,
  Pagination
} from '@mui/material';
import { Add, Edit, Delete, AdminPanelSettings, Person, ManageAccounts, Search, Close } from '@mui/icons-material';
import { userService, departmentService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const StaffManagementPage = () => {
  const { isAdmin, isEmployee } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [staff, setStaff] = useState([]);
  const [allStaff, setAllStaff] = useState([]); // Store all staff for client-side filtering
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [employeeNoFilter, setEmployeeNoFilter] = useState('');
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
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(25);

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await departmentService.getAll();
        // normalize department names to uppercase for consistent display/storage
        setDepartments((res.departments || []).map(d => ({
          ...d,
          name: (d.name || d.label || d.value || '').toString().toUpperCase()
        })));
      } catch (err) {
        console.error('Failed to load departments:', err);
        // fallback to a minimal list if backend not available
        setDepartments([
          { id: 'engineering', name: 'ENGINEERING DEPARTMENT' }
        ]);
      }
    };
    loadDepartments();
  }, []);

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

  // Calculate paginated staff
  const totalPages = Math.ceil(staff.length / rowsPerPage);
  const paginatedStaff = staff.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [employeeNoFilter, nameFilter]);

  // Client-side filtering - no server reload
  useEffect(() => {
    let filtered = allStaff;
    
    // Filter by employee number
    if (employeeNoFilter && employeeNoFilter.trim() !== '') {
      const empSearch = employeeNoFilter.trim().toLowerCase();
      filtered = filtered.filter(s => {
        const empNo = (s.employeeNo || '').toLowerCase();
        return empNo.includes(empSearch);
      });
    }
    
    // Filter by name
    if (nameFilter && nameFilter.trim() !== '') {
      const nameSearch = nameFilter.trim().toLowerCase();
      filtered = filtered.filter(s => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const email = (s.email || '').toLowerCase();
        const designation = (s.designation || '').toLowerCase();
        const department = (s.department || '').toLowerCase();
        const contactNo = (s.contactNo || '').toLowerCase();
        
        return fullName.includes(nameSearch) ||
               email.includes(nameSearch) ||
               designation.includes(nameSearch) ||
               department.includes(nameSearch) ||
               contactNo.includes(nameSearch);
      });
    }
    
    setStaff(filtered);
  }, [nameFilter, employeeNoFilter, allStaff]);

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
        department: staffMember.department ? staffMember.department.toString().toUpperCase() : '',
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
      
      // Save current scroll position
      const scrollY = window.scrollY;
      
      if (selectedStaff) {
        await userService.update(selectedStaff._id, submitData);
      } else {
        await userService.create(submitData);
      }
      handleCloseDialog();
      await loadStaff();
      
      // Restore scroll position after data loads
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
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
          // Save current scroll position
          const scrollY = window.scrollY;
          
          await userService.permanentDelete(staffMember._id);
          alert('Staff member permanently deleted');
          await loadStaff();
          
          // Restore scroll position
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        } catch (error) {
          console.error('Error permanently deleting staff:', error);
          alert(error.response?.data?.message || 'Error permanently deleting staff member');
        }
      }
    } else {
      // First click - set to inactive
      if (window.confirm('This will deactivate the staff member. Click delete again to permanently remove.')) {
        try {
          // Save current scroll position
          const scrollY = window.scrollY;
          
          await userService.delete(staffMember._id);
          alert('Staff member deactivated');
          await loadStaff();
          
          // Restore scroll position
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
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

      <Box sx={{ mb: 3 }}>
        <Paper
          elevation={2}
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: { xs: 1.5, md: 2 },
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            backgroundColor: 'background.paper'
          }}
        >
          {/* Add Staff Button - Full width on mobile */}
          {!isEmployee && (
            <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                fullWidth={isMobile}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
                  }
                }}
              >
                Add Staff
              </Button>
            </Box>
          )}

          {/* Search Fields - Stack on mobile */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 1.5, md: 2 }, 
            flex: 1
          }}>
            <TextField
              variant="outlined"
              size="small"
              label="Employee No"
              value={employeeNoFilter}
              onChange={(e) => setEmployeeNoFilter(e.target.value)}
              placeholder="KL-22-089"
              sx={{ 
                flex: { xs: '1', md: '1 1 320px' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: employeeNoFilter ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setEmployeeNoFilter('')}>
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />

            <TextField
              variant="outlined"
              size="small"
              label="Name / Email / Designation"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Search by name, email or role"
              sx={{ 
                flex: { xs: '1', md: '2 1 420px' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: nameFilter ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setNameFilter('')}>
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Box>

          {/* Result Count and Clear - Side by side on all screens */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 1.5,
            minWidth: { xs: 'auto', md: 'fit-content' }
          }}>
            <Box sx={{ textAlign: 'left' }}>
              { (employeeNoFilter || nameFilter) ? (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Showing</Typography>
                  <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' }, lineHeight: 1.2 }}>{staff.length}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>of {allStaff.length}</Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' }, display: 'block' }}>Total users</Typography>
                  <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' }, lineHeight: 1.2 }}>{allStaff.length}</Typography>
                </Box>
              )}
            </Box>

            <Box>
              <Button
                variant="text"
                size="small"
                onClick={() => { setEmployeeNoFilter(''); setNameFilter(''); }}
                sx={{ 
                  color: 'text.secondary', 
                  minWidth: 'auto',
                  px: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Mobile Card Layout */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {paginatedStaff.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No staff members found</Typography>
            </Paper>
          ) : (
            paginatedStaff.map((member) => (
              <Card 
                key={member._id}
                sx={{ 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                        {`${member.firstName} ${member.lastName}`}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85rem' }}>
                        {member.designation || 'No designation'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {getRoleChip(member.role)}
                      {getStatusChip(member.status)}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        Employee No
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {member.employeeNo || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        Hourly Rate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(member.hourlyRate || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        Contact
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {member.contactNo || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        Department
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                        {member.department ? member.department.toString().toUpperCase() : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', wordBreak: 'break-word' }}>
                        {member.email}
                      </Typography>
                    </Grid>
                  </Grid>

                  {!isEmployee && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid #e0e0e0' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(member)}
                        fullWidth
                        sx={{ 
                          fontSize: '0.8rem',
                          textTransform: 'none',
                          borderColor: '#1976d2',
                          color: '#1976d2'
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Delete />}
                        onClick={() => handleDelete(member)}
                        fullWidth
                        color={member.status === 'inactive' ? 'error' : 'warning'}
                        sx={{ 
                          fontSize: '0.8rem',
                          textTransform: 'none'
                        }}
                      >
                        {member.status === 'inactive' ? 'Delete' : 'Deactivate'}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      ) : (
        /* Desktop Table Layout */
        <TableContainer component={Paper} sx={{ boxShadow: { xs: '0 2px 8px rgba(0,0,0,0.08)', sm: '0 4px 20px rgba(0,0,0,0.08)' }, overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 1200, md: '100%' }, tableLayout: { xs: 'auto', md: 'fixed' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ width: { md: 180 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Employee No</TableCell>
                <TableCell sx={{ width: { md: 120 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Hourly Rate</TableCell>
                <TableCell sx={{ width: { md: 200 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Name</TableCell>
                <TableCell sx={{ width: { md: 160 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Designation</TableCell>
                <TableCell sx={{ width: { md: 130 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Contact No.</TableCell>
                <TableCell sx={{ width: { md: 160 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Department</TableCell>
                <TableCell sx={{ width: { md: 240 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Email</TableCell>
                <TableCell sx={{ width: { md: 120 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Role</TableCell>
                <TableCell sx={{ width: { md: 100 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Status</TableCell>
                {!isEmployee && <TableCell sx={{ width: { md: 110 }, fontWeight: 700, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isEmployee ? 8 : 9} align="center">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStaff.map((member) => (
                  <TableRow 
                    key={member._id}
                    sx={{ 
                      '&:hover': { bgcolor: '#f8f9fa' },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{member.employeeNo || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(member.hourlyRate || 0)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', fontWeight: 600 }}>{`${member.firstName}, ${member.lastName}`}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{member.designation || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{member.contactNo || '-'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{member.department ? member.department.toString().toUpperCase() : '-'}</TableCell>
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
      )}

      {/* Pagination */}
      {staff.length > 0 && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: { xs: '0.85rem', sm: '0.95rem' }
              }
            }}
          />
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth fullScreen={false} sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 2 }, maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' } } }}>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 700,
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          py: { xs: 1.5, sm: 2 }
        }}>
          {selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        </DialogTitle>
        <DialogContent sx={{ mt: { xs: 1, sm: 2 }, px: { xs: 2, sm: 3 } }}>
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
                select
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: (e.target.value || '').toString().toUpperCase() })}
                placeholder="e.g., Engineering Department"
              >
                <MenuItem value="">NONE</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id || d.value || d.name} value={(d.name || d.label || d.value).toString().toUpperCase()}>
                    {(d.name || d.label || d.value).toString().toUpperCase()}
                  </MenuItem>
                ))}
              </TextField>
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
