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
  Divider
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  People,
  AccessTime,
  Work,
  CalendarMonth
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
      setError('Failed to load projects');
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/costing/summary');
      setSummaryData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load costing summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async () => {
    if (!selectedProject) {
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

      const response = await api.get(`/costing/project/${selectedProject}`, { params });
      setProjectDetails(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load project costing details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatHours = (hours) => {
    return hours.toFixed(2);
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

  const SummaryTab = () => (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          onClick={fetchSummary}
          disabled={loading}
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
            {/* Removed global rate card — using per-user hourly rates instead */}
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
                    <TableCell align="right">Normal Hours</TableCell>
                    <TableCell align="right">OT Hours</TableCell>
                    <TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryData.projects.map((project) => (
                    <TableRow 
                      key={project.project.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedProject(project.project.id);
                        setActiveTab(1);
                      }}
                    >
                      <TableCell>
                        <Chip label={project.project.projectCode} size="small" color="primary" />
                      </TableCell>
                      <TableCell>{project.project.projectName}</TableCell>
                      <TableCell>{project.project.company || '-'}</TableCell>
                      <TableCell align="right">{formatHours(project.totalHours)}</TableCell>
                      <TableCell align="right">{formatHours(project.totalNormalHours)}</TableCell>
                      <TableCell align="right">{formatHours(project.totalOTHours)}</TableCell>
                      <TableCell align="right">{project.employeeCount}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#030C69' }}>
                        {isArifHensem ? formatCurrency(project.totalCost) : '********'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {summaryData.projects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
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
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            label="Select Project"
          >
            <MenuItem value="">
              <em>Select a project</em>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.projectCode} - {project.projectName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Month"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 200 }}
        />



        <Button 
          variant="contained" 
          onClick={fetchProjectDetails}
          disabled={loading || !selectedProject}
        >
          Generate Report
        </Button>
      </Box>

      {projectDetails && (
        <>
          <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#030C69' }}>
              {projectDetails.project.projectCode} - {projectDetails.project.projectName}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">Company</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {projectDetails.project.company || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">Contractor</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {projectDetails.project.contractor || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">Status</Typography>
                <Typography variant="body1">
                  <Chip 
                    label={projectDetails.project.status} 
                    size="small" 
                    color={projectDetails.project.status === 'active' ? 'success' : 'default'}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="textSecondary">Date Range</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
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
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Employee Costs Breakdown
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell align="right">Hourly Rate</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Normal Cost</TableCell>
                        <TableCell align="right">OT Cost</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectDetails.employeeCosts.map((emp) => (
                        <TableRow key={emp.user.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {emp.user.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {emp.user.employeeNo || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{emp.user.department || '-'}</TableCell>
                          <TableCell align="right">{isArifHensem ? formatCurrency(emp.hourlyRate || 0) : '********'}</TableCell>
                          <TableCell align="right">
                            {formatHours(emp.totalHours)}
                            <Typography variant="caption" display="block" color="textSecondary">
                              N: {formatHours(emp.normalHours)} | OT: {formatHours(emp.otHours)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{isArifHensem ? formatCurrency(emp.normalCost) : '********'}</TableCell>
                          <TableCell align="right">{isArifHensem ? formatCurrency(emp.otCost) : '********'}</TableCell>
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
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Monthly Breakdown
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        <TableCell align="right">Hours</TableCell>
                        <TableCell align="right">Employees</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectDetails.monthlyBreakdown.map((month, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Chip 
                              icon={<CalendarMonth />}
                              label={`${month.year}-${String(month.month).padStart(2, '0')}`}
                              size="small"
                              variant="outlined"
                            />
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
