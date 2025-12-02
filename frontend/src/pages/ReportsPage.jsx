import React, { useState, useEffect, useRef } from 'react';
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
import * as XLSX from 'xlsx';
import moment from 'moment';
import { timesheetService, projectService, userService } from '../services';

export const ReportsPage = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProject, setSelectedProject] = useState('all');
  const [nameFilter, setNameFilter] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadTimesheets();
  }, [selectedMonth, selectedYear, selectedProject]);

  // Debounced live search on name filter (auto-search while typing)
  const nameSearchTimerRef = useRef(null);
  useEffect(() => {
    if (nameSearchTimerRef.current) clearTimeout(nameSearchTimerRef.current);
    nameSearchTimerRef.current = setTimeout(() => {
      loadTimesheets();
    }, 400);
    return () => {
      if (nameSearchTimerRef.current) clearTimeout(nameSearchTimerRef.current);
    };
  }, [nameFilter]);

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
      // Coerce selectors to numbers for server params
      const monthNum = parseInt(selectedMonth, 10);
      const yearNum = parseInt(selectedYear, 10);

      const params = { status: 'approved', month: monthNum, year: yearNum };
      if (selectedProject && selectedProject !== 'all') params.projectId = selectedProject;
      if (nameFilter && nameFilter.trim() !== '') params.name = nameFilter.trim();

      // Let backend do filtering to avoid client-side mismatch
      const response = await timesheetService.getAll(params);
      const fetched = response.timesheets || [];
      // If user details (employeeNo/department) are missing, fetch user records
      const timesheetsWithUserInfo = [...fetched];
      const missingUserIds = [];
      fetched.forEach(t => {
        const uid = t.userId && (typeof t.userId === 'object' ? (t.userId._id || t.userId) : t.userId);
        if (uid && (!t.userId?.employeeNo || !t.userId?.department)) missingUserIds.push(uid);
      });

      const uniqueUserIds = Array.from(new Set(missingUserIds));
      if (uniqueUserIds.length > 0) {
        try {
          const userPromises = uniqueUserIds.map(id => userService.getById(id));
          const users = await Promise.all(userPromises);
          const userMap = {};
          users.forEach(u => {
            if (u && u.user) userMap[u.user._id || u.user.id || u.user._id] = u.user;
            else if (u && u._id) userMap[u._id] = u;
          });

          timesheetsWithUserInfo.forEach((t, idx) => {
            const uid = t.userId && (typeof t.userId === 'object' ? (t.userId._id || t.userId) : t.userId);
            const userRecord = userMap[uid];
            if (userRecord) {
              // ensure userId is object with fields for display
              t.userId = { ...(typeof t.userId === 'object' ? t.userId : {}), ...userRecord };
              timesheetsWithUserInfo[idx] = t;
            }
          });
        } catch (err) {
          console.warn('Error fetching missing user details for reports:', err);
        }
      }

      setTimesheets(timesheetsWithUserInfo);
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

  // Build export rows with totals per employee
  const buildExportRows = () => {
    const rows = [];
    timesheets.forEach(t => {
      const rate = Number(t.userId?.hourlyRate || 0);
      const employee = `${t.userId?.firstName || ''} ${t.userId?.lastName || ''}`.trim();
      const code = t.disciplineCode || '';
      const area = t.area || '';
      const normalHours = Number(t.totalNormalHours || 0);
      const otHours = Number(t.totalOTHours || 0);
      const totalHours = Number(t.totalHours || 0);
      const cost = rate * totalHours;
      
      // Collect all unique descriptions and detailed descriptions
      const descriptions = new Set();
      const detailedDescriptions = new Set();
      (t.entries || []).forEach(e => {
        if (e.description && e.description.trim()) descriptions.add(e.description.trim());
        if (e.detailedDescription && e.detailedDescription.trim()) detailedDescriptions.add(e.detailedDescription.trim());
      });
      
      rows.push({
        Employee: employee,
        Code: code,
        Area: area,
        Description: Array.from(descriptions).join('; '),
        'Detailed Description': Array.from(detailedDescriptions).join('; '),
        'Normal Hours': normalHours,
        'OT Hours': otHours,
        'Total Hours': totalHours,
        Rate: rate,
        Cost: Number(cost.toFixed(2))
      });
    });
    return rows;
  };

  const handleExportCsv = () => {
    const headers = ['Employee','Code','Area','Description','Detailed Description','Normal Hours','OT Hours','Total Hours','Rate','Cost'];
    const rows = buildExportRows().map(r => headers.map(h => r[h]));
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g,'""')}"` : v).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-details-${moment().month(selectedMonth - 1).format('MMMM')}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportXlsx = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet Details');
    XLSX.writeFile(wb, `timesheet-details-${moment().month(selectedMonth - 1).format('MMMM')}-${selectedYear}.xlsx`);
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
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Timesheet Reports
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          View approved timesheets and monthly summaries
        </Typography>
      </Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3} gap={1}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExportCsv}
          disabled={timesheets.length === 0}
        >
          Export CSV
        </Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportXlsx}
          disabled={timesheets.length === 0}
        >
          Export XLSX
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
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Search employee name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadTimesheets(); }}
            placeholder="First or last name"
            size="small"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography  gutterBottom>
                Total Employees
              </Typography>
              <Typography variant="h4">{timesheets.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography  gutterBottom>
                Total Normal Hours
              </Typography>
              <Typography variant="h4">{totals.normalHours.toFixed(1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography  gutterBottom>
                Total OT Hours
              </Typography>
              <Typography variant="h4">{totals.otHours.toFixed(1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#e3f2fd' }}>
            <CardContent>
              <Typography  gutterBottom>
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
                <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f5f5f5' }}>
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

