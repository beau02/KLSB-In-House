import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Assignment,
  People,
  Work,
  Assessment,
  BarChart,
  AttachMoney,
  ExitToApp,
  AccessTime,
  CheckCircle,
  Brightness4,
  Brightness7
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../App';

const drawerWidth = 200;

export const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { user, logout, isManager, isAdmin } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDarkMode = theme.palette.mode === 'dark';

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'My Timesheets', icon: <Assignment />, path: '/timesheets' },
    { text: 'Projects', icon: <Work />, path: '/projects' },
    { text: 'Overtime Request', icon: <AccessTime />, path: '/overtime-requests' },
  ];

  // Only show staff management to admins
  if (isAdmin) {
    menuItems.push({ text: 'Staff Management', icon: <People />, path: '/staff' });
  }

  if (isManager) {
    menuItems.push(
      { text: 'Approvals', icon: <Assessment />, path: '/approvals' },
      { text: 'OT Approvals', icon: <CheckCircle />, path: '/overtime-approvals' },
      { text: 'Reports', icon: <BarChart />, path: '/reports' },
      { text: 'Project Costing', icon: <AttachMoney />, path: '/costing' }
    );
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: isDarkMode ? '#0f172a' : 'white' }}>
      <Toolbar sx={{ 
        background: isDarkMode 
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
          : 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)', 
        minHeight: '70px !important',
        color: 'white',
        borderBottom: isDarkMode ? '1px solid #334155' : '1px solid rgba(255,255,255,0.1)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          <img 
            src="/KLSB Diamond 1 .png" 
            alt="KLSB Logo" 
            style={{ height: '40px', width: 'auto' }}
          />
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1, display: 'block', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              Timesheet System
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: isDarkMode ? '#e5e7eb' : 'inherit',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(3, 12, 105, 0.08)',
              },
              ...(window.location.pathname === item.path && {
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(3, 12, 105, 0.12)',
                '& .MuiListItemIcon-root': {
                  color: isDarkMode ? '#818cf8' : '#030C69',
                },
                '& .MuiListItemText-primary': {
                  color: isDarkMode ? '#818cf8' : '#030C69',
                  fontWeight: 600,
                },
              }),
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: isDarkMode ? '#e5e7eb' : 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  color: isDarkMode ? '#e5e7eb' : 'inherit',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2, borderTop: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
        <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="right">
          <IconButton
            onClick={toggleTheme}
            sx={{
              width: '100%',
              borderRadius: 2,
              py: 1.5,
              color: isDarkMode ? '#e5e7eb' : '#030C69',
              backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(3, 12, 105, 0.08)',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.25)' : 'rgba(3, 12, 105, 0.15)',
              },
            }}
          >
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
            <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Typography>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xs: '100%', md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { xs: 0, md: sidebarOpen ? `${drawerWidth}px` : 0 },
          background: isDarkMode 
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
            : 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
          borderBottom: isDarkMode ? '1px solid #334155' : '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '6px 12px',
            borderRadius: 2,
            flexShrink: 0,
          }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/profile')}
              size="small"
              sx={{ 
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                {user?.firstName} {user?.lastName}
              </Typography>
            </Button>
            <Button 
              color="inherit" 
              onClick={handleLogout} 
              startIcon={<ExitToApp />}
              size="small"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { xs: 0, md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: 'none',
              transform: sidebarOpen ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
              transition: 'transform 0.3s ease',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { xs: '100%', md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { xs: 0, md: sidebarOpen ? 0 : `-${drawerWidth}px` },
          mt: '86px',
          backgroundColor: isDarkMode ? '#0f172a' : '#f5f7fa',
          minHeight: '100vh',
          transition: 'all 0.3s ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
