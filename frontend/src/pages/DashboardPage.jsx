import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  Chip
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  PendingActions,
  Work,
  Cancel,
  TrendingUp,
  People
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService, projectService, statsService } from '../services';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTimesheets: 0,
    pendingTimesheets: 0,
    approvedTimesheets: 0,
    rejectedTimesheets: 0,
    myProjects: [],
    currentMonthHours: 0,
    totalStaff: 0,
    activeProjects: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const isAdmin = user?.role === 'admin' || user?.role === 'manager';
      
      const promises = [
        timesheetService.getAll(),
        projectService.getAll({ status: 'active' })
      ];
      
      if (isAdmin) {
        promises.push(statsService.getDashboard());
      }
      
      const results = await Promise.all(promises);
      const [timesheetsRes, projectsRes, dashboardStats] = results;

      const timesheets = timesheetsRes.timesheets || [];
      
      // For regular users, filter to only their timesheets
      const relevantTimesheets = isAdmin 
        ? timesheets 
        : timesheets.filter(t => t.userId?._id === user.id || t.userId === user.id);

      // Get projects
      let myProjects = [];
      if (isAdmin) {
        myProjects = projectsRes.projects || [];
      } else {
        const userProjectIds = [...new Set(relevantTimesheets.map(t => t.projectId?._id || t.projectId))];
        myProjects = (projectsRes.projects || []).filter(p => userProjectIds.includes(p._id));
      }

      // Calculate current month hours
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const currentMonthHours = isAdmin
        ? (dashboardStats?.stats?.currentMonthHours || 0)
        : relevantTimesheets
            .filter(t => t.month === currentMonth && t.year === currentYear && t.status === 'approved')
            .reduce((sum, t) => sum + (t.totalHours || 0), 0);

      setStats({
        totalTimesheets: relevantTimesheets.length,
        pendingTimesheets: relevantTimesheets.filter(t => t.status === 'submitted').length,
        approvedTimesheets: relevantTimesheets.filter(t => t.status === 'approved').length,
        rejectedTimesheets: relevantTimesheets.filter(t => t.status === 'rejected').length,
        myProjects,
        currentMonthHours,
        totalStaff: isAdmin ? (dashboardStats?.stats?.totalStaff || 0) : 0,
        activeProjects: projectsRes.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ 
      height: '100%',
      background: '#fff',
      border: '1px solid',
      borderColor: alpha(color, 0.2),
      borderRadius: { xs: 2, sm: 3 },
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-4px)' },
        boxShadow: `0 12px 24px ${alpha(color, 0.2)}`,
        borderColor: alpha(color, 0.4),
      },
    }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={{ xs: 1.5, sm: 2 }}>
          <Box 
            sx={{ 
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: alpha(color, 0.1),
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5, fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            {subtitle}
          </Typography>
        )}
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

  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          {isAdmin ? `Overview for ${monthName}` : `Here's your timesheet overview for ${monthName}`}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {isAdmin && (
          <>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Staff"
                value={stats.totalStaff}
                icon={<People sx={{ fontSize: 28 }} />}
                color="#6366f1"
                subtitle="Active employees"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Active Projects"
                value={stats.activeProjects}
                icon={<Work sx={{ fontSize: 28 }} />}
                color="#8b5cf6"
                subtitle="Currently running"
              />
            </Grid>
          </>
        )}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Pending Approval"
            value={stats.pendingTimesheets}
            icon={<PendingActions sx={{ fontSize: 28 }} />}
            color="#f59e0b"
            subtitle="Awaiting review"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Approved"
            value={stats.approvedTimesheets}
            icon={<CheckCircle sx={{ fontSize: 28 }} />}
            color="#10b981"
            subtitle="Successfully approved"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Rejected"
            value={stats.rejectedTimesheets}
            icon={<Cancel sx={{ fontSize: 28 }} />}
            color="#ef4444"
            subtitle="Needs revision"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Timesheets"
            value={stats.totalTimesheets}
            icon={<Assignment sx={{ fontSize: 28 }} />}
            color="#6366f1"
            subtitle="All time"
          />
        </Grid>
      </Grid>

      {/* Info Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            minHeight: '180px',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40%',
              height: '100%',
              background: 'rgba(255,255,255,0.05)',
              transform: 'skewX(-10deg) translateX(20%)',
            }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, position: 'relative', zIndex: 1 }}>
              📊 This Month's Hours
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, position: 'relative', zIndex: 1 }}>
              {stats.currentMonthHours.toFixed(1)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, position: 'relative', zIndex: 1 }}>
              {isAdmin ? 'total hours logged this month' : 'hours logged this month'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            minHeight: '180px'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
              {isAdmin ? '🎯 All Active Projects' : '🎯 My Active Projects'}
            </Typography>
            {stats.myProjects.length > 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                maxHeight: isAdmin ? '120px' : 'auto',
                overflowY: isAdmin ? 'auto' : 'visible'
              }}>
                {stats.myProjects.map((project) => (
                  <Chip
                    key={project._id}
                    label={`${project.projectCode} - ${project.projectName}`}
                    sx={{ 
                      background: alpha('#6366f1', 0.1),
                      color: '#6366f1',
                      fontWeight: 500,
                      '&:hover': {
                        background: alpha('#6366f1', 0.2),
                      }
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {isAdmin ? 'No active projects in the system.' : 'No active projects yet. Start by creating a timesheet!'}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
