import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 50%, #4CAF50 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={24} 
          sx={{ 
            p: { xs: 2, sm: 5 }, 
            borderRadius: 4,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Box sx={{ mb: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'center' }}>
              <img 
                src="/KLSB Diamond 1 .png" 
                alt="KLSB Logo" 
                style={{ height: '80px', width: 'auto', maxWidth: '90%' }}
              />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#546e7a',
                fontWeight: 500,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              Timesheet Management System
            </Typography>
          </Box>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #020850 0%, #030C69 100%)',
                },
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                type="button"
                sx={{ 
                  color: '#030C69',
                  fontWeight: 500,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Don't have an account? Register here
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
