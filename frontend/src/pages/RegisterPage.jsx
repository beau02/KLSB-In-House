import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  Alert,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    employeeNo: '',
    designation: '',
    contactNo: '',
    department: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await authService.register(registerData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
            : 'linear-gradient(135deg, #030C69 0%, #1a2d9e 50%, #4CAF50 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Alert 
            severity="success" 
            sx={{ 
              borderRadius: 3,
              fontSize: '1.1rem',
              py: 2,
            }}
          >
            Registration successful! Redirecting to dashboard...
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #030C69 0%, #1a2d9e 50%, #4CAF50 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper 
          elevation={24} 
          sx={{ 
            p: { xs: 2, sm: 5 }, 
            borderRadius: 4,
            background: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(30, 41, 59, 0.95)' 
              : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(10px)',
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid #334155' : 'none',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                color: (theme) => theme.palette.mode === 'dark' ? '#f1f5f9' : '#030C69',
                mb: 1,
                letterSpacing: '-1px',
                fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Join KLSB
            </Typography>
            <Typography 
              variant="body1" 
              color="textSecondary"
              sx={{ fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Register to join the timesheet management system
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee No"
                  name="employeeNo"
                  value={formData.employeeNo}
                  onChange={handleChange}
                  placeholder="e.g., KL-22-089"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="e.g., Junior Designer"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact No."
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleChange}
                  placeholder="e.g., 016-3124548"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 4,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                  : 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
                '&:hover': {
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
                    : 'linear-gradient(135deg, #020850 0%, #030C69 100%)',
                },
              }}
            >
              Register
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
                type="button"
                sx={{ 
                  color: (theme) => theme.palette.mode === 'dark' ? '#818cf8' : '#030C69',
                  fontWeight: 500,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
