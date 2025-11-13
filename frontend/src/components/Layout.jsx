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
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Assignment,
  People,
  Work,
  Assessment,
  BarChart,
  ExitToApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

export const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    { text: 'Staff Management', icon: <People />, path: '/staff' },
  ];

  if (isManager) {
    menuItems.push(
      { text: 'Approvals', icon: <Assessment />, path: '/approvals' },
      { text: 'Reports', icon: <BarChart />, path: '/reports' }
    );
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ 
        background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)', 
        minHeight: '70px !important',
        color: 'white',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            KLSB
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1 }}>
            Timesheet System
          </Typography>
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
              '&:hover': {
                backgroundColor: 'rgba(3, 12, 105, 0.08)',
              },
              ...(window.location.pathname === item.path && {
                backgroundColor: 'rgba(3, 12, 105, 0.12)',
                '& .MuiListItemIcon-root': {
                  color: '#030C69',
                },
                '& .MuiListItemText-primary': {
                  color: '#030C69',
                  fontWeight: 600,
                },
              }),
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
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
          background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
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
          <Typography variant="h5" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            KLSB
          </Typography>
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
            <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
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
          p: 3,
          width: { xs: '100%', md: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { xs: 0, md: sidebarOpen ? 0 : `-${drawerWidth}px` },
          mt: '86px',
          backgroundColor: '#f5f7fa',
          minHeight: '100vh',
          transition: 'all 0.3s ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
