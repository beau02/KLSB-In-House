import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  PendingActions,
  Work,
  People,
  AccessTime
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService, projectService, statsService } from '../services';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTimesheets: 0,
    pendingTimesheets: 0,
    approvedTimesheets: 0,
    activeProjects: 0,
    totalStaff: 0,
    currentMonthHours: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [timesheetsRes, projectsRes, dashboardStats] = await Promise.all([
        timesheetService.getAll(),
        projectService.getAll({ status: 'active' }),
        statsService.getDashboard()
      ]);

      const timesheets = timesheetsRes.timesheets || [];
      setStats({
        totalTimesheets: timesheets.length,
        pendingTimesheets: timesheets.filter(t => t.status === 'submitted').length,
        approvedTimesheets: timesheets.filter(t => t.status === 'approved').length,
        activeProjects: projectsRes.count || 0,
        totalStaff: dashboardStats.stats?.totalStaff || 0,
        currentMonthHours: dashboardStats.stats?.currentMonthHours || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '140px',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.1)',
      },
    }}>
      <CardContent sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontWeight: 500, fontSize: '0.875rem' }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            fontSize: 48, 
            opacity: 0.3,
            ml: 1,
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

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
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's your timesheet overview
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Staff"
            value={stats.totalStaff}
            icon={<People />}
            color="#030C69"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Current Month Hours"
            value={`${stats.currentMonthHours.toFixed(0)} hrs`}
            icon={<AccessTime />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Timesheets"
            value={stats.totalTimesheets}
            icon={<Assignment />}
            color="#2196F3"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={<Work />}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Approval"
            value={stats.pendingTimesheets}
            icon={<PendingActions />}
            color="#FF6B6B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Approved"
            value={stats.approvedTimesheets}
            icon={<CheckCircle />}
            color="#51CF66"
          />
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 4, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#030C69' }}>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Use the sidebar navigation to access timesheets, projects, staff management, approvals, and reports.
        </Typography>
      </Paper>
    </Container>
  );
};
