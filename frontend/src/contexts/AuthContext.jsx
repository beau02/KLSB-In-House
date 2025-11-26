import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';
import { Snackbar, Alert, Button } from '@mui/material';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showIdleWarning, setShowIdleWarning] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  // Auto logout on browser close - use sessionStorage instead of localStorage
  useEffect(() => {
    if (user) {
      // Mark session as active
      sessionStorage.setItem('sessionActive', 'true');
      
      // Check if this is a new session (browser was closed)
      const handleLoad = () => {
        const wasActive = sessionStorage.getItem('sessionActive');
        if (!wasActive && user) {
          // Browser was closed, logout
          authService.logout();
          setUser(null);
        }
      };

      // Listen for beforeunload to clear session marker
      const handleBeforeUnload = () => {
        sessionStorage.removeItem('sessionActive');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      handleLoad();

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [user]);

  // Idle timeout - 5 minutes
  useEffect(() => {
    if (!user) return;

    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
    const WARNING_TIME = 4 * 60 * 1000; // Show warning at 4 minutes

    // Update last activity on user interactions
    const updateActivity = () => {
      setLastActivity(Date.now());
      setShowIdleWarning(false); // Hide warning if user becomes active
    };

    // Event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for idle timeout every 10 seconds
    const checkIdle = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      
      // Show warning at 4 minutes
      if (idleTime >= WARNING_TIME && idleTime < IDLE_TIMEOUT && !showIdleWarning) {
        setShowIdleWarning(true);
      }
      
      // Auto logout at 5 minutes
      if (idleTime >= IDLE_TIMEOUT) {
        console.log('User idle for 5 minutes, logging out...');
        authService.logout();
        setUser(null);
        window.location.href = '/login';
      }
    }, 10000); // Check every 10 seconds

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      clearInterval(checkIdle);
    };
  }, [user, lastActivity, showIdleWarning]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleStayActive = () => {
    setLastActivity(Date.now());
    setShowIdleWarning(false);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Snackbar
        open={showIdleWarning}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          severity="warning" 
          sx={{ width: '100%', alignItems: 'center' }}
          action={
            <Button color="inherit" size="small" onClick={handleStayActive}>
              I'm Here
            </Button>
          }
        >
          You've been idle for 4 minutes. You'll be logged out in 1 minute.
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
