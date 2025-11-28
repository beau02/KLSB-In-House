import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  People,
  AccessTime,
  Work,
  CalendarMonth,
  Visibility,
  ArrowForward
} from '@mui/icons-material';
import { api } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const ProjectCostingPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [error, setError] = useState('');
  
  // Check if current user is Arif Hensem
  const isArifHensem = user?.firstName?.toLowerCase() === 'arif' && user?.lastName?.toLowerCase() === 'hensem';

  useEffect(() => {
    fetchProjects();
    fetchSummary();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/costing/summary');
      setSummaryData(response.data);
      setError('');
    } catch (err) {
      console.error('Error loading summary:', err);
      setError('Failed to load costing summary');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (projectIdRaw) => {
    // Ensure ID is a string to avoid object/string mismatch
    const projectId = String(projectIdRaw);

    if (!projectId) {
        console.error("No project ID provided to handleProjectClick");
        return;
    }
    
    console.log("Navigating to project details for:", projectId);
    
    // 1. Update selection state
    setSelectedProject(projectId);
    
    // 2. Force switch to Details tab
    setActiveTab(1);
    
    // 3. Fetch details immediately
    fetchProjectDetails(projectId);
    
    // 4. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchProjectDetails = async (projectIdParam) => {
    // Prefer parameter, fallback to state
    const pid = projectIdParam ? String(projectIdParam) : selectedProject;

    if (!pid) {
      setError('Please select a project');
      return;
    }

    try {
      setLoading(true);
      const params = {};
      if (selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        if (year && month) {
          params.year = parseInt(year, 10);
          params.month = parseInt(month, 10);
        }
      }

      console.log(`Fetching details from /costing/project/${pid}`);
      const response = await api.get(`/costing/project/${pid}`, { params });
      setProjectDetails(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Failed to load project costing details. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatHours = (hours) => {
    return typeof hours === 'number' ? hours.toFixed(2) : '0.00';
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color === 'primary' ? '#030C69' : '#4CAF50'} 0%, ${color === 'primary' ? '#1a2d9e' : '#66BB6A'} 100%)`, color: 'white' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: 2, 
            p: 1, 
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: subtitle ? 1 : 0 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // --- TAB CONTENT COMPONENTS ---

  const SummaryTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          onClick={fetchSummary}
          disabled={loading}
          startIcon={<Work />}
        >
          Refresh Summary
        </Button>
      </Box>

      {summaryData && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Cost (All Projects)"
                value={isArifHensem ? formatCurrency(summaryData.summary.grandTotalCost) : '********'}
                icon={<AttachMoney />}
                color="primary"
                subtitle={`${summaryData.summary.totalProjects} active projects`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Hours"
                value={formatHours(summaryData.summary.grandTotalHours)}
                icon={<AccessTime />}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Average Cost per Project"
                value={isArifHensem ? formatCurrency(summaryData.summary.averageCostPerProject) : '********'}
                icon={<TrendingUp />}
                color="primary"
              />
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Projects Breakdown
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project Code</TableCell>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell align="right">Total Hours</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell align="center" width="80">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryData.projects.map((projectItem) => {
                    const p = projectItem.project;
                    // Handle ID: The API returns `id` in the summary object, but `_id` in regular project objects
                    // We use String() to ensure it's a primitive string
                    const projectId = String(p._id || p.id);
                    
                    return (
                      <TableRow 
                        key={projectId}
                        hover
                        sx={{ 
                            cursor: 'pointer', 
                            transition: 'background-color 0.2s',
                            '&:hover': { backgroundColor: 'rgba(3, 12, 105, 0.04)' } 
                        }}
                        onClick={() => handleProjectClick(projectId)}
                      >
                        <TableCell>
                          <Chip 
                            label={p.projectCode} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ fontWeight: 600, cursor: 'pointer' }}
                            // IMPORTANT: Remove onClick from Chip so row click works, 
                            // or explicitly delegate to row handler
                            onClick={(e) => {
                                e.stopPropagation();
                                handleProjectClick(projectId);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{p.projectName}</TableCell>
                        <TableCell>{p.company || '-'}</TableCell>
                        <TableCell align="right">
                          {formatHours(projectItem.totalHours)}
                          <Typography variant="caption" display="block" color="textSecondary">
                            N: {formatHours(projectItem.totalNormalHours)} | OT: {formatHours(projectItem.totalOTHours)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{projectItem.employeeCount}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#030C69' }}>
                          {isArifHensem ? formatCurrency(projectItem.totalCost) : '********'}
                        </TableCell>
                        <TableCell align="center">
                            <Tooltip title="View Details">
                                <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        handleProjectClick(projectId);
                                    }}
                                >
                                    <Visibility fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {summaryData.projects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">No project data available</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );

  const ProjectDetailsTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button 
            startIcon={<ArrowForward sx={{ transform: 'rotate(180deg)' }} />}
            onClick={() => setActiveTab(0)}
            sx={{ mr: 1 }}
        >
            Back
        </Button>

        <FormControl sx={{ minWidth: 300 }} size="small">
          <InputLabel id="project-select-label">Select Project</InputLabel>
          <Select
            labelId="project-select-label"
            id="project-select"
            value={selectedProject}
            onChange={(e) => {
                setSelectedProject(e.target.value);
                // If user manually changes dropdown, fetch that project
                if (e.target.value) fetchProjectDetails(e.target.value);
            }}
            label="Select Project"
          >
            <MenuItem value="">
              <em>Select a project</em>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id || project.id} value={project._id || project.id}>
                {project.projectCode} - {project.projectName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Month"
          type="month"
          size="small"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />

        <Button 
          variant="contained" 
          onClick={() => fetchProjectDetails()} 
          disabled={loading || !selectedProject}
        >
          Generate Report
        </Button>
      </Box>

      {/* Show content if details exist */}
      {projectDetails ? (
        <>
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="overline" color="textSecondary" sx={{ letterSpacing: 1 }}>
                        Project Details
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#030C69' }}>
                    {projectDetails.project.projectCode} - {projectDetails.project.projectName}
                    </Typography>
                </Box>
                <Chip 
                    label={projectDetails.project.status.toUpperCase()} 
                    color={projectDetails.project.status === 'active' ? 'success' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                />
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="textSecondary" display="block">Company</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {projectDetails.project.company || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="textSecondary" display="block">Contractor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {projectDetails.project.contractor || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="caption" color="textSecondary" display="block">Date Range</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {typeof projectDetails.costingParameters.dateRange === 'string' 
                    ? projectDetails.costingParameters.dateRange 
                    : `${projectDetails.costingParameters.dateRange.startDate} to ${projectDetails.costingParameters.dateRange.endDate}`}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Project Cost"
                value={isArifHensem ? formatCurrency(projectDetails.summary.totalCost) : '********'}
                icon={<AttachMoney />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Hours"
                value={formatHours(projectDetails.summary.totalHours)}
                icon={<AccessTime />}
                color="secondary"
                subtitle={`Normal: ${formatHours(projectDetails.summary.totalNormalHours)} | OT: ${formatHours(projectDetails.summary.totalOTHours)}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Employees"
                value={projectDetails.summary.employeeCount}
                icon={<People />}
                color="primary"
                subtitle={`${projectDetails.summary.timesheetCount} timesheets`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Cost per Employee"
                value={isArifHensem ? formatCurrency(projectDetails.summary.averageCostPerEmployee) : '********'}
                icon={<TrendingUp />}
                color="secondary"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Employee Costs Breakdown
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell align="right">Hourly Rate</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectDetails.employeeCosts.map((emp) => (
                        <TableRow key={emp.user.id || emp.user._id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {emp.user.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {emp.user.department || '-'} • {emp.user.employeeNo || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">{isArifHensem ? formatCurrency(emp.hourlyRate || 0) : '********'}</TableCell>
                          <TableCell align="right">
                            <Box display="flex" flexDirection="column" alignItems="flex-end">
                                <Typography variant="body2">{formatHours(emp.totalHours)}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    N:{formatHours(emp.normalHours)} OT:{formatHours(emp.otHours)}
                                </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#030C69' }}>
                            {isArifHensem ? formatCurrency(emp.totalCost) : '********'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Monthly Breakdown
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Staff</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectDetails.monthlyBreakdown.map((month, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                                <CalendarMonth fontSize="small" color="action" />
                                {`${month.year}-${String(month.month).padStart(2, '0')}`}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {formatHours(month.totalHours)}
                          </TableCell>
                          <TableCell align="right">{month.employeeCount}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {isArifHensem ? formatCurrency(month.totalCost) : '********'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : (
        // Fallback state if no details loaded yet
        <Paper sx={{ p: 4, textAlign: 'center', background: '#f5f7fa', border: '1px dashed #ccc' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
                {loading ? 'Loading Project Details...' : 'Select a project to view details'}
            </Typography>
            {!loading && !selectedProject && (
                <Typography variant="body2" color="textSecondary">
                    Go back to the Summary tab or select a project from the dropdown above.
                </Typography>
            )}
        </Paper>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#030C69', mb: 1 }}>
          Project Costing
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Calculate and analyze manhour costs per project
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Projects Summary" icon={<Work />} iconPosition="start" />
          {/* REMOVED disabled={!selectedProject} to ensure switch works */}
          <Tab label="Project Details" icon={<TrendingUp />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && <SummaryTab />}
        {activeTab === 1 && <ProjectDetailsTab />}
      </Box>
    </Box>
  );
};