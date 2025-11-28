import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  MenuItem
} from '@mui/material';
import { Email, VerifiedUser, Edit, Save } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [step, setStep] = useState(1); // 1: enter email, 2: enter code
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeNo: '',
    designation: '',
    contactNo: '',
    department: ''
  });

  // Fetch fresh user data from backend on mount
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('Fetching user data from /users/me...');
        const response = await api.get('/users/me');
        console.log('User data received:', response.data);
        const freshUser = response.data.user;
        setUserData(freshUser);
        setFormData({
          firstName: freshUser.firstName || '',
          lastName: freshUser.lastName || '',
          employeeNo: freshUser.employeeNo || '',
          designation: freshUser.designation || '',
          contactNo: freshUser.contactNo || '',
          department: freshUser.department || ''
        });
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        console.error('Error response:', err.response?.data);
        // Fallback to context user
        setUserData(user);
        setFormData({
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          employeeNo: user?.employeeNo || '',
          designation: user?.designation || '',
          contactNo: user?.contactNo || '',
          department: user?.department || ''
        });
      }
    };
    fetchUserData();
  }, [user]);

  const handleRequestCode = async () => {
    if (!newEmail || !newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users/change-email/request', { newEmail });
      setSuccess('Verification code sent to ' + newEmail);
      setStep(2);
      
      // Show code in console for testing (backend returns it in dev mode)
      if (response.data.code) {
        console.log('Verification code:', response.data.code);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/users/change-email/verify', { code: verificationCode });
      setSuccess('Email updated successfully!');
      
      // Update user context
      updateUser({ ...user, email: response.data.email });
      
      // Close dialog after delay
      setTimeout(() => {
        setDialogOpen(false);
        setStep(1);
        setNewEmail('');
        setVerificationCode('');
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setStep(1);
    setNewEmail('');
    setVerificationCode('');
    setError('');
    setSuccess('');
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Reset form data if canceling
      setFormData({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        employeeNo: userData?.employeeNo || '',
        designation: userData?.designation || '',
        contactNo: userData?.contactNo || '',
        department: userData?.department || ''
      });
    }
    setEditMode(!editMode);
    setError('');
    setSuccess('');
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/users/me', formData);
      const updatedUser = response.data.user;
      setSuccess('Profile updated successfully!');
      setUserData(updatedUser);
      updateUser(updatedUser);
      setEditMode(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
          <Typography>Loading profile...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#030C69' }}>
            Profile Settings
          </Typography>
          <Button
            variant={editMode ? "outlined" : "contained"}
            startIcon={editMode ? <Save /> : <Edit />}
            onClick={editMode ? handleSaveProfile : handleEditToggle}
            disabled={loading}
            sx={{
              ...(!editMode && {
                background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #020850 0%, #030C69 100%)',
                }
              }),
              ...(editMode && {
                borderColor: '#4CAF50',
                color: '#4CAF50',
                '&:hover': {
                  borderColor: '#388E3C',
                  backgroundColor: 'rgba(76, 175, 80, 0.04)'
                }
              })
            }}
          >
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </Box>
        
        {editMode && (
          <Button
            size="small"
            onClick={handleEditToggle}
            sx={{ mb: 2, color: '#666' }}
          >
            Cancel
          </Button>
        )}

        <Divider sx={{ my: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              First Name
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                size="small"
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {userData?.firstName}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Last Name
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                size="small"
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {userData?.lastName}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Employee No
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={formData.employeeNo}
                onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                size="small"
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {userData?.employeeNo || '-'}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Designation
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                size="small"
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {userData?.designation || '-'}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Contact No
            </Typography>
            {editMode ? (
              <TextField
                fullWidth
                value={formData.contactNo}
                onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                size="small"
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {userData?.contactNo || '-'}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Department
            </Typography>
            {editMode ? (
              <TextField
                select
                fullWidth
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                size="small"
              >
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="IT">IT</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Administration">Administration</MenuItem>
              </TextField>
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {userData?.department || '-'}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.email}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() => setDialogOpen(true)}
                disabled={editMode}
                sx={{ 
                  borderColor: '#030C69',
                  color: '#030C69',
                  '&:hover': {
                    borderColor: '#020850',
                    backgroundColor: 'rgba(3, 12, 105, 0.04)'
                  }
                }}
              >
                Change Email
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Email Change Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {step === 1 ? 'Change Email Address' : 'Verify Email'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {step === 1 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enter your new email address. We'll send a verification code to confirm the change.
              </Typography>
              <TextField
                fullWidth
                label="New Email Address"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enter the 6-digit verification code sent to <strong>{newEmail}</strong>
              </Typography>
              <TextField
                fullWidth
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
                disabled={loading}
                inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          {step === 1 ? (
            <Button
              variant="contained"
              onClick={handleRequestCode}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #020850 0%, #030C69 100%)',
                }
              }}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleVerifyCode}
              disabled={loading}
              startIcon={<VerifiedUser />}
              sx={{
                background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #020850 0%, #030C69 100%)',
                }
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};
