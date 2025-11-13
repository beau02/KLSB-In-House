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
  Work
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService, projectService } from '../services';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTimesheets: 0,
    pendingTimesheets: 0,
    approvedTimesheets: 0,
    activeProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [timesheetsRes, projectsRes] = await Promise.all([
        timesheetService.getAll(),
        projectService.getAll({ status: 'active' })
      ]);

      const timesheets = timesheetsRes.timesheets || [];
      setStats({
        totalTimesheets: timesheets.length,
        pendingTimesheets: timesheets.filter(t => t.status === 'submitted').length,
        approvedTimesheets: timesheets.filter(t => t.status === 'approved').length,
        activeProjects: projectsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 48 }}>
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
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Timesheets"
            value={stats.totalTimesheets}
            icon={<Assignment />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approval"
            value={stats.pendingTimesheets}
            icon={<PendingActions />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Approved"
            value={stats.approvedTimesheets}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={<Work />}
            color="info.main"
          />
        </Grid>
      </Grid>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Use the sidebar to navigate to different sections of the application.
        </Typography>
      </Paper>
    </Container>
  );
};
