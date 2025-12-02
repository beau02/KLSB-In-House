import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ThemeModeContext = createContext(null);
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimesheetsPage } from './pages/TimesheetsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProjectCostingPage } from './pages/ProjectCostingPage';
import { ProfilePage } from './pages/ProfilePage';
import { OvertimeRequestPage } from './pages/OvertimeRequestPage';
import { OvertimeApprovalPage } from './pages/OvertimeApprovalPage';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#030C69',
      light: '#1a2d9e',
      dark: '#020850',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(3,12,105,0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(3,12,105,0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f8f9fa',
          fontWeight: 600,
          color: '#030C69',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    text: {
      primary: '#e5e7eb',
      secondary: '#9ca3af',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            borderColor: '#475569',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          boxShadow: 'none',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(99,102,241,0.3)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(99,102,241,0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #334155',
        },
        head: {
          backgroundColor: '#0f172a',
          fontWeight: 600,
          color: '#e5e7eb',
          borderBottom: '2px solid #334155',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#334155',
          color: '#e5e7eb',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1e293b',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#334155',
            },
            '&:hover fieldset': {
              borderColor: '#475569',
            },
          },
        },
      },
    },
  },
});

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return context;
};

function AppContent() {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  const themeModeValue = {
    mode,
    toggleTheme,
  };

  return (
    <ThemeModeContext.Provider value={themeModeValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/timesheets"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TimesheetsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <StaffManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ApprovalsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ReportsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/costing"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectCostingPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/overtime-requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OvertimeRequestPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/overtime-approvals"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OvertimeApprovalPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
