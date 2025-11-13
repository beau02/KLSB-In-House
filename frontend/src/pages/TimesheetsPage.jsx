import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Add, Edit, Visibility, Send } from '@mui/icons-material';
import moment from 'moment';
import api from '../services/api';
import { timesheetService, projectService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const TimesheetsPage = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [formData, setFormData] = useState({
    projectId: '',
    disciplineCode: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    entries: []
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const projectsRes = await projectService.getAll({ status: 'active' });

      let timesheetsRes = { timesheets: [] };
      // Always fetch only the current user's timesheets
      if (user) {
        const userId = user._id || user.id;
        timesheetsRes = await timesheetService.getByUser(userId);
      }

      const fetchedTimesheets = timesheetsRes.timesheets || timesheetsRes.timesheet || [];
      setTimesheets(fetchedTimesheets);
      setProjects(projectsRes.projects || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (timesheet = null) => {
    if (timesheet) {
      setSelectedTimesheet(timesheet);
      // Migrate old entries to new format if needed
      const migratedEntries = (timesheet.entries || []).map(entry => ({
        date: entry.date,
        normalHours: entry.normalHours !== undefined ? entry.normalHours : (entry.hours || 0),
        otHours: entry.otHours !== undefined ? entry.otHours : 0,
        // Derive hoursCode from existing data if present
        hoursCode: entry.hoursCode !== undefined ? entry.hoursCode : (
          entry.normalHours === 8 ? '8' : (entry.normalHours === 4 ? '4' : (entry.normalHours === 0 ? '0' : ''))
        ),
        description: entry.description || ''
      }));
      setFormData({
        projectId: timesheet.projectId._id,
        disciplineCode: timesheet.disciplineCode || '',
        month: timesheet.month,
        year: timesheet.year,
        entries: migratedEntries.length > 0 ? migratedEntries : generateEmptyEntries(timesheet.month, timesheet.year)
      });
    } else {
      setSelectedTimesheet(null);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      let entries = generateEmptyEntries(currentMonth, currentYear);
      // try to fetch public holidays for the month and mark entries
      await applyPublicHolidays(entries, currentYear, currentMonth);

      setFormData({
        projectId: '',
        disciplineCode: '',
        month: currentMonth,
        year: currentYear,
        entries
      });
    }
    setDialogOpen(true);
  };

  const [publicHolidays, setPublicHolidays] = useState([]);

  const fetchPublicHolidays = async (year, month) => {
    // Try backend endpoint first. If it doesn't exist or returns nothing, fallback to Nager.Date public API for Malaysia.
    try {
      const resp = await api.get('/holidays', { params: { year, month } });
      const holidays = resp.data.holidays || resp.data || [];
      if (holidays && holidays.length > 0) {
        setPublicHolidays(holidays);
        return holidays;
      }
    } catch (err) {
      // ignore and fallback to public API
    }

    try {
      // Nager.Date public holidays API (country code MY for Malaysia)
      const nagerUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/MY`;
      const resp2 = await fetch(nagerUrl);
      if (!resp2.ok) throw new Error('Nager API error');
      const nagerData = await resp2.json();
      // nagerData is an array of { date: 'YYYY-MM-DD', localName, name, ... }
      const holidays = nagerData.map(h => ({ date: h.date, name: h.name || h.localName }));
      // Filter by month if provided
      const filtered = holidays.filter(h => {
        if (!month) return true;
        const m = parseInt(h.date.split('-')[1], 10);
        return m === parseInt(month, 10);
      });
      setPublicHolidays(filtered);
      return filtered;
    } catch (err) {
      console.warn('Failed to fetch public holidays from backend and Nager.Date:', err);
      setPublicHolidays([]);
      return [];
    }
  };

  const applyPublicHolidays = async (entries, year, month) => {
    // fetch holidays then modify entries in-place
    const holidays = await fetchPublicHolidays(year, month);
    // normalize holidays to set of date strings 'YYYY-MM-DD' with optional name
    const holidayMap = {};
    holidays.forEach(h => {
      if (!h) return;
      if (typeof h === 'string') holidayMap[h] = 'Public Holiday';
      else if (h.date) holidayMap[h.date] = 'Public Holiday';
    });

    entries.forEach((entry, idx) => {
      if (holidayMap[entry.date]) {
        entry.hoursCode = 'PH';
        entry.normalHours = 0;
        // only overwrite description if empty
        if (!entry.description || entry.description === '') entry.description = holidayMap[entry.date];
      }
    });
  };

  const disciplineCodes = ['PMT', 'ADM', 'PRS', 'CIV', 'STR', 'PPG', 'ARC', 'MEC', 'ELE', 'INS', 'TEL', 'GEN', 'DCS'];

  const activityDescriptions = [
    'Project - Management and Report',
    'Project - Model Review',
    'Admin - Project system initial setup',
    'Admin - Maintenance, customization and report',
    'Admin - Spec Creation',
    'Designer and Drafter - 3D Modeling and Design',
    'Designer and Drafter - 2D Drawing and Layout',
    'Checker - 3D Modeling and Design',
    'Checker - 2D Drawing and Layout',
    'Engineer - Calculation and report',
    'Engineer - Others',
    'Public Holiday',
    'Others'
  ];

  const hoursLegend = [
    { value: '0', label: '0 - Non chargeable' },
    { value: '8', label: '8 - Full day work' },
    { value: '4', label: '4 - Half day work' },
    { value: 'AL', label: 'AL - Annual leave' },
    { value: 'MC', label: 'MC - Medical leave' },
    { value: 'UL', label: 'UL - Unpaid leave' },
    { value: 'HL', label: 'HL - Hosp. leave' },
    { value: 'PL', label: 'PL - Paternity leave' },
    { value: 'ML', label: 'ML - Maternity leave' },
    { value: 'PH', label: 'PH - Public Holiday' },
    { value: 'CL', label: 'CL - Compassionate leave' }
  ];

  const generateEmptyEntries = (month, year) => {
    const daysInMonth = moment(`${year}-${month}`, 'YYYY-M').daysInMonth();
    const entries = [];
    for (let day = 1; day <= daysInMonth; day++) {
      entries.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        normalHours: 0,
        otHours: 0,
        hoursCode: '0',
        description: ''
      });
    }
    return entries;
  };

  const handleMonthYearChange = (field, value) => {
    const newFormData = { ...formData, [field]: parseInt(value) };
    if (!selectedTimesheet) {
      newFormData.entries = generateEmptyEntries(
        field === 'month' ? value : formData.month,
        field === 'year' ? value : formData.year
      );
    }
    setFormData(newFormData);
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...formData.entries];
    
    // Only process as number for hour fields
    if (field === 'normalHours' || field === 'otHours') {
      let numValue = value === '' ? '' : parseFloat(value);
      if (numValue === '' || isNaN(numValue)) {
        numValue = '';
      }
      newEntries[index] = { ...newEntries[index], [field]: numValue };
    } else if (field === 'hoursCode') {
      // Map hoursCode to normalHours when applicable
      const code = value;
      let mappedHours = newEntries[index].normalHours || 0;
      if (code === '8') mappedHours = 8;
      else if (code === '4') mappedHours = 4;
      else if (code === '0') mappedHours = 0;
      else mappedHours = 0; // leave codes and others default to 0

      newEntries[index] = { ...newEntries[index], hoursCode: code, normalHours: mappedHours };
      
      // Auto-set description for Public Holiday (PH)
      if (code === 'PH') {
        newEntries[index].description = 'Public Holiday';
      }
    } else {
      // For description and other text fields, use value directly
      newEntries[index] = { ...newEntries[index], [field]: value };
    }
    
    setFormData({ ...formData, entries: newEntries });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTimesheet(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedTimesheet) {
        await timesheetService.update(selectedTimesheet._id, formData);
      } else {
        await timesheetService.create(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving timesheet:', error);
      alert(error.response?.data?.message || 'Error saving timesheet');
    }
  };

  const handleSubmitForApproval = async (id) => {
    try {
      await timesheetService.submit(id);
      loadData();
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert(error.response?.data?.message || 'Error submitting timesheet');
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'warning',
      approved: 'success',
      rejected: 'error'
    };
    return <Chip label={status.toUpperCase()} color={colors[status]} size="small" />;
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#030C69' }}>
          My Timesheets
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Track your daily hours for each project
        </Typography>
      </Box>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Timesheet
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Period</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Normal Hours</TableCell>
              <TableCell>OT Hours</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No timesheets found
                </TableCell>
              </TableRow>
            ) : (
              timesheets.map((timesheet) => (
                <TableRow key={timesheet._id}>
                  <TableCell>
                    {moment().month(timesheet.month - 1).format('MMMM')} {timesheet.year}
                  </TableCell>
                  <TableCell>{timesheet.projectId?.projectName || 'N/A'}</TableCell>
                  <TableCell>{timesheet.totalNormalHours || 0} hrs</TableCell>
                  <TableCell>{timesheet.totalOTHours || 0} hrs</TableCell>
                  <TableCell><strong>{timesheet.totalHours} hrs</strong></TableCell>
                  <TableCell>{getStatusChip(timesheet.status)}</TableCell>
                  <TableCell>
                    {timesheet.submittedAt
                      ? moment(timesheet.submittedAt).format('MMM DD, YYYY')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(timesheet)}
                      disabled={timesheet.status === 'approved'}
                    >
                      {timesheet.status === 'draft' ? <Edit /> : <Visibility />}
                    </IconButton>
                    {timesheet.status === 'draft' && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleSubmitForApproval(timesheet._id)}
                      >
                        <Send />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTimesheet ? 'View/Edit Timesheet' : 'Create New Timesheet'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Project"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                margin="normal"
                disabled={!!selectedTimesheet}
                required
              >
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.projectCode} - {project.projectName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Discipline Code"
                value={formData.disciplineCode}
                onChange={(e) => setFormData({ ...formData, disciplineCode: e.target.value })}
                margin="normal"
                disabled={!!selectedTimesheet}
                required
              >
                {disciplineCodes.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Month"
                value={formData.month}
                onChange={(e) => handleMonthYearChange('month', e.target.value)}
                margin="normal"
                disabled={!!selectedTimesheet}
                required
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
                value={formData.year}
                onChange={(e) => handleMonthYearChange('year', e.target.value)}
                margin="normal"
                disabled={!!selectedTimesheet}
                required
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Hours Entry - {moment().month(formData.month - 1).format('MMMM')} {formData.year}
            </Typography>
            <Card variant="outlined">
              <CardContent>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell width="10%"><strong>Date</strong></TableCell>
                        <TableCell width="10%"><strong>Day</strong></TableCell>
                        <TableCell width="15%"><strong>Normal Hours</strong></TableCell>
                        <TableCell width="15%"><strong>OT Hours</strong></TableCell>
                        <TableCell width="50%"><strong>Description</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.entries.map((entry, index) => {
                        const entryDate = moment(entry.date);
                        const isWeekend = entryDate.day() === 0 || entryDate.day() === 6;
                        return (
                          <TableRow 
                            key={index}
                            sx={{ 
                              backgroundColor: isWeekend ? '#f5f5f5' : 'white',
                              '&:hover': { backgroundColor: '#e3f2fd' }
                            }}
                          >
                            <TableCell>{entryDate.format('DD')}</TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                color={isWeekend ? 'error' : 'textPrimary'}
                              >
                                {entryDate.format('ddd')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                select
                                size="small"
                                value={entry.hoursCode || '0'}
                                onChange={(e) => handleEntryChange(index, 'hoursCode', e.target.value)}
                                disabled={selectedTimesheet?.status === 'approved'}
                                sx={{ width: '180px' }}
                              >
                                {hoursLegend.map(h => (
                                  <MenuItem key={h.value} value={h.value}>
                                    {h.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={entry.otHours || ''}
                                onChange={(e) => handleEntryChange(index, 'otHours', e.target.value)}
                                onFocus={(e) => e.target.select()}
                                inputProps={{ min: 0, max: 24, step: 0.5 }}
                                disabled={selectedTimesheet?.status === 'approved'}
                                sx={{ width: '100px' }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                select
                                size="small"
                                fullWidth
                                value={entry.description}
                                onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                                disabled={selectedTimesheet?.status === 'approved'}
                              >
                                <MenuItem value="">-</MenuItem>
                                {activityDescriptions.map((desc) => (
                                  <MenuItem key={desc} value={desc}>
                                    {desc}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="h6">
                        Normal: {formData.entries.reduce((sum, e) => sum + (parseFloat(e.normalHours) || 0), 0).toFixed(1)} hrs
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h6">
                        OT: {formData.entries.reduce((sum, e) => sum + (parseFloat(e.otHours) || 0), 0).toFixed(1)} hrs
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="h6">
                        Total: {formData.entries.reduce((sum, e) => sum + (parseFloat(e.normalHours) || 0) + (parseFloat(e.otHours) || 0), 0).toFixed(1)} hrs
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={selectedTimesheet?.status === 'approved' || !formData.projectId}
          >
            {selectedTimesheet ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
