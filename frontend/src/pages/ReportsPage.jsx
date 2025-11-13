import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button
} from '@mui/material';
import { Download } from '@mui/icons-material';
import moment from 'moment';
import { timesheetService, projectService } from '../services';

export const ReportsPage = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTimesheets();
  }, [selectedMonth, selectedYear, selectedProject]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const response = await timesheetService.getAll();
      let approvedTimesheets = (response.timesheets || []).filter(
        t => t.status === 'approved' && 
             t.month === selectedMonth && 
             t.year === selectedYear
      );
      
      if (selectedProject !== 'all') {
        approvedTimesheets = approvedTimesheets.filter(t => t.projectId?._id === selectedProject);
      }
      
      setTimesheets(approvedTimesheets);
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return timesheets.reduce(
      (acc, timesheet) => {
        acc.normalHours += timesheet.totalNormalHours || 0;
        acc.otHours += timesheet.totalOTHours || 0;
        acc.totalHours += timesheet.totalHours || 0;
        return acc;
      },
      { normalHours: 0, otHours: 0, totalHours: 0 }
    );
  };

  const totals = calculateTotals();

  const handleExport = () => {
    // Create CSV content
    const headers = ['Employee', 'Employee No', 'Project', 'Normal Hours', 'OT Hours', 'Total Hours', 'Approved Date'];
    const rows = timesheets.map(t => [
      `${t.userId?.firstName} ${t.userId?.lastName}`,
      t.userId?.employeeNo || '-',
      t.projectId?.projectName || '-',
      t.totalNormalHours || 0,
      t.totalOTHours || 0,
      t.totalHours || 0,
      t.approvalDate ? moment(t.approvalDate).format('YYYY-MM-DD') : '-'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total,,,${totals.normalHours},${totals.otHours},${totals.totalHours},`
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-report-${moment().month(selectedMonth - 1).format('MMMM')}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#030C69' }}>
          Timesheet Reports
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          View approved timesheets and monthly summaries
        </Typography>
      </Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
          disabled={timesheets.length === 0}
        >
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {moment.months().map((month, index) => (
              <MenuItem key={index} value={index + 1}>
                {month}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            select
            fullWidth
            label="Project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <MenuItem value="all">All Projects</MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.projectName}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Employees
              </Typography>
              <Typography variant="h4">{timesheets.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Normal Hours
              </Typography>
              <Typography variant="h4">{totals.normalHours.toFixed(1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total OT Hours
              </Typography>
              <Typography variant="h4">{totals.otHours.toFixed(1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: '#e3f2fd' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <strong>Total Hours</strong>
              </Typography>
              <Typography variant="h4">
                <strong>{totals.totalHours.toFixed(1)}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Employee</strong></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Employee No</strong></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Department</strong></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Project</strong></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Normal Hours</strong></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>OT Hours</strong></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Total Hours</strong></TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}><strong>Approved Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No approved timesheets found for {moment().month(selectedMonth - 1).format('MMMM')} {selectedYear}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {timesheets.map((timesheet) => (
                  <TableRow key={timesheet._id}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {timesheet.userId?.firstName} {timesheet.userId?.lastName}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {timesheet.userId?.employeeNo || '-'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {timesheet.userId?.department || '-'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {timesheet.projectId?.projectName || '-'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {timesheet.totalNormalHours || 0} hrs
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {timesheet.totalOTHours || 0} hrs
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <strong>{timesheet.totalHours} hrs</strong>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {timesheet.approvalDate
                        ? moment(timesheet.approvalDate).format('MMM DD, YYYY')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell colSpan={4} align="right">
                    <strong>TOTAL:</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <strong>{totals.normalHours.toFixed(1)} hrs</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <strong>{totals.otHours.toFixed(1)} hrs</strong>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <strong>{totals.totalHours.toFixed(1)} hrs</strong>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};
