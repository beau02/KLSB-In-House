import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Visibility,
  ArrowBack,
  TrendingUp,
  People,
  AccessTime,
  AttachMoney,
  CalendarMonth,
  Assessment
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProjectCostingPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'detail'
  const [allProjects, setAllProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [avgMode, setAvgMode] = useState('hour'); // 'hour' | 'employee'

  // Check if user has finance access (email contains 'arif' or is admin/manager)
  const isArif = (user?.email?.toLowerCase() === 'arif.r@kemuncaklanai.com');

  // Admin/Manager can access pages and details, but only Arif sees financial amounts
  const showDetailedBreakdown = (user?.role === 'admin' || user?.role === 'manager');

  // Initialize the page
  useEffect(() => {
    loadProjectsSummary();
  }, []);

  // Fetch all projects summary
  const loadProjectsSummary = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get('/costing/summary');
      // Backend returns { projects: [...] }
      const projectsList = response.data?.projects || [];
      const projects = Array.isArray(projectsList) ? projectsList : [];
      setAllProjects(projects);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load project summary');
      setAllProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load detailed project data
  const loadProjectData = async (projectId, month = '', year = '') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);
      if (year) params.append('year', year);
      
      const url = `/costing/project/${projectId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      // Map backend response to frontend structure
      const data = {
        summary: response.data?.summary || {},
        employeeBreakdown: Array.isArray(response.data?.employeeCosts) ? response.data.employeeCosts : [],
        monthlyBreakdown: Array.isArray(response.data?.monthlyBreakdown) ? response.data.monthlyBreakdown : []
      };
      setProjectData(data);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load project details');
      setProjectData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle project selection
  const selectProject = (project) => {
    setActiveProject(project);
    setViewMode('detail');
    const projectId = project.project?.id || project.id;
    loadProjectData(projectId, filterMonth, filterYear);
  };

  // Handle back to overview
  const returnToOverview = () => {
    setViewMode('overview');
    setActiveProject(null);
    setProjectData(null);
    setFilterMonth('');
    setFilterYear('');
  };

  // Handle filter change
  const applyFilters = () => {
    if (activeProject) {
      const projectId = activeProject.project?.id || activeProject.id;
      loadProjectData(projectId, filterMonth, filterYear);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Mask currency unless Arif
  const formatCurrencyMasked = (amount) => {
    if (!isArif) return '******';
    return formatCurrency(amount);
  };

  // Format hours
  const formatHours = (hours) => {
    return `${(hours || 0).toFixed(2)}h`;
  };

  // Render overview mode
  const renderOverview = () => (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Project Costing Overview
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={loadProjectsSummary}
        >
          Refresh Data
        </Button>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {Array.isArray(allProjects) && allProjects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {project.project?.projectCode || project.projectCode}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {project.project?.projectName || project.projectName}
                      </Typography>
                      <Chip
                        label={project.project?.company || project.company || 'No Company'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <IconButton
                      color="primary"
                      onClick={() => selectProject(project)}
                      sx={{ ml: 1 }}
                    >
                      <Visibility />
                    </IconButton>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Total Cost
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        {formatCurrencyMasked(project.totalCost)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Total Hours
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {formatHours(project.totalHours)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Employees
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {project.employeeCount || 0}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={() => selectProject(project)}
                    sx={{ mt: 3 }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!isLoading && allProjects.length === 0 && !errorMessage && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No project data available
          </Typography>
        </Paper>
      )}
    </Box>
  );

  // Render detail mode
  const renderDetail = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={returnToOverview}
          sx={{ mb: 2 }}
        >
          Back to Overview
        </Button>

        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Typography variant="h4" fontWeight="bold" color="white" gutterBottom>
            {activeProject?.project?.projectCode || activeProject?.projectCode}
          </Typography>
          <Typography variant="body1" color="white" sx={{ opacity: 0.9 }}>
            {activeProject?.project?.projectName || activeProject?.projectName}
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter by Period
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <MenuItem value="">All Months</MenuItem>
                <MenuItem value="1">January</MenuItem>
                <MenuItem value="2">February</MenuItem>
                <MenuItem value="3">March</MenuItem>
                <MenuItem value="4">April</MenuItem>
                <MenuItem value="5">May</MenuItem>
                <MenuItem value="6">June</MenuItem>
                <MenuItem value="7">July</MenuItem>
                <MenuItem value="8">August</MenuItem>
                <MenuItem value="9">September</MenuItem>
                <MenuItem value="10">October</MenuItem>
                <MenuItem value="11">November</MenuItem>
                <MenuItem value="12">December</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Year"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                <MenuItem value="2024">2024</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
                <MenuItem value="2026">2026</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={applyFilters}
                disabled={isLoading}
              >
                Apply Filter
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {isArif && !showDetailedBreakdown && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Finance View:</strong> You have access to view financial analysis and cost summaries. 
          Detailed employee breakdowns are restricted to managers and administrators.
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : projectData ? (
        <Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ color: 'white', mr: 1 }} />
                    <Typography variant="body2" color="white">
                      Total Cost
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {formatCurrencyMasked(projectData.summary?.totalCost)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime sx={{ color: 'white', mr: 1 }} />
                    <Typography variant="body2" color="white">
                      Total Hours
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {formatHours(projectData.summary?.totalHours)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <People sx={{ color: 'white', mr: 1 }} />
                    <Typography variant="body2" color="white">
                      Employees
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {projectData.summary?.employeeCount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Tooltip title="Click to toggle average metric">
                <Card onClick={() => setAvgMode(avgMode === 'hour' ? 'employee' : 'hour')}
                      sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', cursor: 'pointer' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUp sx={{ color: 'white', mr: 1 }} />
                      <Typography variant="body2" color="white">
                        {avgMode === 'hour' ? 'Avg Cost/Hour' : 'Avg Cost/Employee'}
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="white">
                      {formatCurrencyMasked(
                        avgMode === 'hour'
                          ? (projectData.summary?.totalHours > 0
                              ? projectData.summary.totalCost / projectData.summary.totalHours
                              : 0)
                          : (projectData.summary?.employeeCount > 0
                              ? projectData.summary.totalCost / projectData.summary.employeeCount
                              : 0)
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          </Grid>

          {/* Financial Analysis Summary removed for Arif: replaced by toggle on Avg Cost card */}

          {/* Detailed Breakdown - Only for Admin/Manager */}
          {showDetailedBreakdown && (
            <>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People />
                  Employee Cost Breakdown
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Employee No</strong></TableCell>
                        <TableCell align="right"><strong>Rate</strong></TableCell>
                        <TableCell align="right"><strong>Normal Hours</strong></TableCell>
                        <TableCell align="right"><strong>OT Hours</strong></TableCell>
                        <TableCell align="right"><strong>Total Hours</strong></TableCell>
                        <TableCell align="right"><strong>Total Cost</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(projectData.employeeBreakdown) && projectData.employeeBreakdown.map((emp, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {emp.user?.name?.charAt(0) || '?'}
                              </Avatar>
                              {emp.user?.name || 'Unknown'}
                            </Box>
                          </TableCell>
                          <TableCell>{emp.user?.employeeNo || 'N/A'}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={isArif ? formatCurrency(emp.hourlyRate) : '******'}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatHours(emp.normalHours)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatHours(emp.otHours)}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatHours(emp.totalHours)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="success.main">
                              {formatCurrencyMasked(emp.totalCost)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {(!projectData.employeeBreakdown || projectData.employeeBreakdown.length === 0) && (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No employee data available for this period
                  </Typography>
                )}
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonth />
                  Monthly Cost Breakdown
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Month</strong></TableCell>
                        <TableCell><strong>Year</strong></TableCell>
                        <TableCell align="right"><strong>Hours</strong></TableCell>
                        <TableCell align="right"><strong>Cost</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Array.isArray(projectData.monthlyBreakdown) && projectData.monthlyBreakdown.map((month, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip
                              label={new Date(2000, month.month - 1).toLocaleString('default', { month: 'long' })}
                              color="secondary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{month.year}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatHours(month.totalHours)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" color="success.main">
                              {formatCurrency(month.totalCost)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {(!projectData.monthlyBreakdown || projectData.monthlyBreakdown.length === 0) && (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                    No monthly data available
                  </Typography>
                )}
              </Paper>
            </>
          )}
        </Box>
      ) : null}
    </Box>
  );

  // Everyone with access to the app can open costing; masking applied where needed

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {viewMode === 'overview' ? renderOverview() : renderDetail()}
    </Container>
  );
};

export { ProjectCostingPage };
