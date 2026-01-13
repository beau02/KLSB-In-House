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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  PendingActions,
  Work,
  Cancel,
  TrendingUp,
  People,
  NewReleases,
  CheckCircleOutline
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { timesheetService, projectService, statsService } from '../services';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [patchNoteDialogOpen, setPatchNoteDialogOpen] = useState(false);
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
    // Check if patch notes have been shown for this version
    const patchVersion = 'v2.1.0';
    const shownPatchKey = `patchNoteShown_${patchVersion}`;
    const hasShownPatch = localStorage.getItem(shownPatchKey);
    
    if (!hasShownPatch) {
      setPatchNoteDialogOpen(true);
      localStorage.setItem(shownPatchKey, 'true');
    }
    
    loadDashboardData();
  }, []);

  const handleClosePatchNote = () => {
    setPatchNoteDialogOpen(false);
  };

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

      // Calculate LAST month hours (since timesheets are for the previous month)
      const currentDate = new Date();
      const lastMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
      const lastMonthYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
      
      const currentMonthHours = isAdmin
        ? (dashboardStats?.stats?.currentMonthHours || 0)
        : relevantTimesheets
            .filter(t => t.month === lastMonth && t.year === lastMonthYear && t.status === 'approved')
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
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
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
  const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const lastMonthName = lastMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
              📊 Last Month's Hours
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, position: 'relative', zIndex: 1 }}>
              {stats.currentMonthHours.toFixed(1)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, position: 'relative', zIndex: 1 }}>
              {isAdmin ? `total hours logged for ${lastMonthName}` : `hours logged for ${lastMonthName}`}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 4, 
            borderRadius: 3,
            minHeight: '180px'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {isAdmin ? '🎯 All Active Projects' : '🎯 My Active Projects'}
            </Typography>
            {stats.myProjects.length > 0 ? (
              <Box
                sx={{
                  maxHeight: isAdmin ? '120px' : 'auto',
                  overflowY: isAdmin ? 'auto' : 'visible',
                  pr: 1
                }}
              >
                {stats.myProjects.map((project) => (
                  <Box
                    key={project._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 1.2,
                      background: (theme) => theme.palette.mode === 'dark' ? alpha('#6366f1', 0.2) : alpha('#6366f1', 0.07),
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      transition: 'background 0.2s',
                      '&:hover': {
                        background: (theme) => theme.palette.mode === 'dark' ? alpha('#6366f1', 0.35) : alpha('#6366f1', 0.15),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: '#22c55e',
                        mr: 1.5,
                        flexShrink: 0,
                        boxShadow: '0 0 0 2px #fff',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#3730a3',
                        fontWeight: 500,
                        fontSize: '1rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: { xs: '180px', sm: '320px', md: '420px' },
                        cursor: 'pointer',
                      }}
                      title={`${project.projectCode} - ${project.projectName}`}
                    >
                      {`${project.projectCode} - ${project.projectName}`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {isAdmin ? 'No active projects in the system.' : 'No active projects yet. Start by creating a timesheet!'}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={patchNoteDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
          borderBottom: '2px solid #22c55e',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 700,
          color: '#16a34a'
        }}>
          <NewReleases />
          What's New in v2.1.0
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#374151' }}>
            ✨ New Features & Improvements
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <CheckCircleOutline sx={{ color: '#22c55e', fontSize: 24, flexShrink: 0, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Multi-Timesheet Hour Validation
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#6b7280' }}>
                  When you have multiple timesheets in the same month, you can no longer exceed 8 hours per day across all projects. Dates that would exceed this limit are automatically grayed out to prevent conflicts.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <CheckCircleOutline sx={{ color: '#22c55e', fontSize: 24, flexShrink: 0, mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Detailed Conflict Warnings
                </Typography>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#6b7280' }}>
                  If you try to exceed 8 hours on a day, a detailed warning dialog now shows you exactly which projects have hours already assigned, helping you manage your time better.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ 
            p: 2, 
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
            borderRadius: 1,
            border: '1px solid #c7d2fe'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: '#4f46e5' }}>
              💡 TIP
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', color: (theme) => theme.palette.mode === 'dark' ? '#cbd5e1' : '#4b5563' }}>
              Use the grayed-out dates as a guide - they indicate dates where adding more hours would exceed the 8-hour daily limit. Hover over these dates for more details.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleClosePatchNote} 
            variant="contained"
            sx={{
              bgcolor: '#22c55e',
              '&:hover': {
                bgcolor: '#16a34a'
              }
            }}
          >
            Got It!
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
