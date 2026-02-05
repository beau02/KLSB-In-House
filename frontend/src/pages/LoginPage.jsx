import React, { useState, useRef } from 'react';
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
import ReCAPTCHA from 'react-google-recaptcha';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const recaptchaRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if captcha is required and valid
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey && !captchaToken) {
      setError('Please complete the captcha verification');
      setLoading(false);
      return;
    }

    try {
      await login(email, password, captchaToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      // Reset captcha on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken('');
      }
    } finally {
      setLoading(false);
    }
  };

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
      <Container maxWidth="sm">
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
            <Box sx={{ mb: { xs: 1.5, sm: 2 }, display: 'flex', justifyContent: 'center' }}>
              <img 
                src="/timesheet/KLSB_Diamond_1.png" 
                alt="KLSB Logo" 
                style={{ height: '80px', width: 'auto', maxWidth: '90%' }}
              />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#546e7a',
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
            
            {/* reCAPTCHA - only show if site key is configured */}
            {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  onExpired={() => setCaptchaToken('')}
                />
              </Box>
            )}
            
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
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
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
                Don't have an account? Register here
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
