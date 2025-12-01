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
  CardContent,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { Add, Edit, Visibility, Send } from '@mui/icons-material';
import moment from 'moment';
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
    area: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    entries: []
  });

  // Discipline codes
  const disciplineCodes = ['PMT', 'ADM', 'PRS', 'CIV', 'STR', 'PPG', 'ARC', 'MEC', 'ELE', 'INS', 'TEL', 'GEN', 'DCS'];
  
  // Area options
  const areaOptions = [
    'NA',
    'SOW 1 [BASED SCOPE]',
    'SOW 2 [HOLD SCOPE]',
    'VO-002',
    'VO-003',
    'VO-004',
    'VO-005',
    'VO-006',
    'VO-007',
    'VO-008',
    'VO-009',
    'VO-010',
    'DATA REMEDIATION',
    'DATA CONVERSION'
  ];

  // Activity descriptions
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

  // Hours legend
  const hoursLegend = [
    { value: '0', label: '0 - Non chargeable', hours: 0 },
    { value: '8', label: '8 - Full day work', hours: 8 },
    { value: '4', label: '4 - Half day work', hours: 4 },
    { value: 'CUSTOM', label: 'Custom hours', hours: 0 },
    { value: 'AL', label: 'AL - Annual leave', hours: 0 },
    { value: 'MC', label: 'MC - Medical leave', hours: 0 },
    { value: 'UL', label: 'UL - Unpaid leave', hours: 0 },
    { value: 'HL', label: 'HL - Hospital leave', hours: 0 },
    { value: 'PL', label: 'PL - Paternity leave', hours: 0 },
    { value: 'ML', label: 'ML - Maternity leave', hours: 0 },
    { value: 'PH', label: 'PH - Public Holiday', hours: 0 },
    { value: 'CL', label: 'CL - Compassionate leave', hours: 0 }
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const projectsRes = await projectService.getAll({ status: 'active' });
      let timesheetsRes = { timesheets: [] };
      
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

  const generateEmptyEntries = (month, year) => {
    const daysInMonth = moment(`${year}-${month}`, 'YYYY-M').daysInMonth();
    const entries = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      entries.push({
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        normalHours: 0,
        otHours: 0,
        hoursCode: '0',
        description: '',
        detailedDescription: ''
      });
    }
    
    return entries;
  };

  const handleOpenDialog = (timesheet = null) => {
    if (timesheet) {
      setSelectedTimesheet(timesheet);
      
      const migratedEntries = (timesheet.entries || []).map(entry => ({
        date: entry.date,
        normalHours: entry.normalHours !== undefined ? entry.normalHours : (entry.hours || 0),
        otHours: entry.otHours !== undefined ? entry.otHours : 0,
        hoursCode: entry.hoursCode !== undefined ? entry.hoursCode : 
          (entry.normalHours === 8 ? '8' : entry.normalHours === 4 ? '4' : entry.normalHours === 0 ? '0' : ''),
        description: entry.description || '',
        detailedDescription: entry.detailedDescription || ''
      }));
      
      setFormData({
        projectId: timesheet.projectId._id,
        disciplineCode: timesheet.disciplineCode || '',
        area: timesheet.area || '',
        month: timesheet.month,
        year: timesheet.year,
        entries: migratedEntries.length > 0 ? migratedEntries : generateEmptyEntries(timesheet.month, timesheet.year)
      });
    } else {
      setSelectedTimesheet(null);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      setFormData({
        projectId: '',
        disciplineCode: '',
        area: '',
        month: currentMonth,
        year: currentYear,
        entries: generateEmptyEntries(currentMonth, currentYear)
      });
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTimesheet(null);
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
    
    if (field === 'normalHours' || field === 'otHours') {
      const numValue = value === '' ? 0 : parseFloat(value) || 0;
      newEntries[index][field] = numValue;
    } else if (field === 'hoursCode') {
      const legendItem = hoursLegend.find(h => h.value === value);
      newEntries[index].hoursCode = value;
      
      if (value !== 'CUSTOM') {
        newEntries[index].normalHours = legendItem?.hours || 0;
      }
      
      if (value === 'PH' && !newEntries[index].description) {
        newEntries[index].description = 'Public Holiday';
      }
    } else {
      newEntries[index][field] = value;
    }
    
    setFormData({ ...formData, entries: newEntries });
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        area: formData.area,
        disciplineCode: formData.disciplineCode
      };
      
      if (selectedTimesheet) {
        await timesheetService.update(selectedTimesheet._id, payload);
      } else {
        await timesheetService.create(payload);
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
      resubmitted: 'info',
      approved: 'success',
      rejected: 'error'
    };
    
    return <Chip label={status.toUpperCase()} color={colors[status]} size="small" />;
  };

  const isReadOnly = (timesheet) => {
    return timesheet && ['approved', 'submitted', 'resubmitted'].includes(timesheet.status);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ maxWidth: '95%', py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#030C69' }}>
          My Timesheets
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Track your daily hours for each project
        </Typography>
      </Box>

      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          New Timesheet
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f7fa' }}>
              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Normal Hours</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>OT Hours</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Total Hours</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Submitted Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No timesheets found</TableCell>
              </TableRow>
            ) : (
              timesheets.map((timesheet) => (
                <TableRow key={timesheet._id} hover>
                  <TableCell>
                    {moment().month(timesheet.month - 1).format('MMMM')} {timesheet.year}
                  </TableCell>
                  <TableCell>{timesheet.projectId?.projectName || 'N/A'}</TableCell>
                  <TableCell>{timesheet.totalNormalHours || 0} hrs</TableCell>
                  <TableCell>{timesheet.totalOTHours || 0} hrs</TableCell>
                  <TableCell><strong>{timesheet.totalHours} hrs</strong></TableCell>
                  <TableCell>{getStatusChip(timesheet.status)}</TableCell>
                  <TableCell>
                    {timesheet.submittedAt ? moment(timesheet.submittedAt).format('MMM DD, YYYY') : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(timesheet)}
                      disabled={['approved', 'submitted', 'resubmitted'].includes(timesheet.status)}
                    >
                      {['draft', 'rejected'].includes(timesheet.status) ? <Edit /> : <Visibility />}
                    </IconButton>
                    {['draft', 'rejected'].includes(timesheet.status) && (
                      <IconButton size="small" color="primary" onClick={() => handleSubmitForApproval(timesheet._id)}>
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          {selectedTimesheet ? 'View/Edit Timesheet' : 'Create New Timesheet'}
          {selectedTimesheet && (
            <Typography variant="caption" display="block" color="textSecondary">
              Status: {getStatusChip(selectedTimesheet.status)}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          {selectedTimesheet?.rejectionReason && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#dc2626', mb: 1 }}>
                ⚠️ Rejection Reason:
              </Typography>
              <Typography variant="body2" sx={{ color: '#991b1b' }}>
                {selectedTimesheet.rejectionReason}
              </Typography>
            </Paper>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Project *</InputLabel>
                <Select
                  value={formData.projectId}
                  label="Project *"
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  disabled={!!selectedTimesheet}
                >
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.projectCode} - {project.projectName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Discipline Code *</InputLabel>
                <Select
                  value={formData.disciplineCode}
                  label="Discipline Code *"
                  onChange={(e) => setFormData({ ...formData, disciplineCode: e.target.value })}
                  disabled={isReadOnly(selectedTimesheet)}
                >
                  {disciplineCodes.map((code) => (
                    <MenuItem key={code} value={code}>{code}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Area</InputLabel>
                <Select
                  value={formData.area}
                  label="Area"
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  disabled={isReadOnly(selectedTimesheet)}
                >
                  <MenuItem value="">None</MenuItem>
                  {areaOptions.map((area) => (
                    <MenuItem key={area} value={area}>{area}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Month *</InputLabel>
                <Select
                  value={formData.month}
                  label="Month *"
                  onChange={(e) => handleMonthYearChange('month', e.target.value)}
                  disabled={!!selectedTimesheet}
                >
                  {moment.months().map((month, index) => (
                    <MenuItem key={index} value={index + 1}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <TextField
                fullWidth
                type="number"
                label="Year *"
                value={formData.year}
                onChange={(e) => handleMonthYearChange('year', e.target.value)}
                margin="normal"
                disabled={!!selectedTimesheet}
                required
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Daily Hours Entry - {moment().month(formData.month - 1).format('MMMM')} {formData.year}
          </Typography>

          <Card variant="outlined">
            <CardContent>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell width="60px"><strong>Date</strong></TableCell>
                      <TableCell width="60px"><strong>Day</strong></TableCell>
                      <TableCell width="220px"><strong>Normal Hours</strong></TableCell>
                      <TableCell width="100px"><strong>OT Hours</strong></TableCell>
                      <TableCell width="280px"><strong>Description</strong></TableCell>
                      <TableCell><strong>Detailed Description</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.entries.map((entry, index) => {
                      const entryDate = moment(entry.date);
                      const isWeekend = entryDate.day() === 0 || entryDate.day() === 6;
                      
                      return (
                        <TableRow key={index} sx={{ bgcolor: isWeekend ? '#f5f5f5' : 'white' }}>
                          <TableCell>{entryDate.format('DD')}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color={isWeekend ? 'error' : 'textPrimary'}>
                              {entryDate.format('ddd')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {entry.hoursCode === 'CUSTOM' ? (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <FormControl size="small" sx={{ minWidth: 130 }}>
                                  <Select
                                    value="CUSTOM"
                                    onChange={(e) => handleEntryChange(index, 'hoursCode', e.target.value)}
                                    disabled={isReadOnly(selectedTimesheet)}
                                  >
                                    {hoursLegend.map(h => (
                                      <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={entry.normalHours || ''}
                                  onChange={(e) => handleEntryChange(index, 'normalHours', e.target.value)}
                                  inputProps={{ min: 0, max: 24, step: 0.5 }}
                                  disabled={isReadOnly(selectedTimesheet)}
                                  placeholder="hrs"
                                  sx={{ width: 80 }}
                                />
                              </Box>
                            ) : (
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={entry.hoursCode || '0'}
                                  onChange={(e) => handleEntryChange(index, 'hoursCode', e.target.value)}
                                  disabled={isReadOnly(selectedTimesheet)}
                                >
                                  {hoursLegend.map(h => (
                                    <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              fullWidth
                              value={entry.otHours || ''}
                              onChange={(e) => handleEntryChange(index, 'otHours', e.target.value)}
                              inputProps={{ min: 0, max: 24, step: 0.5 }}
                              disabled={isReadOnly(selectedTimesheet)}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={entry.description || ''}
                                onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                                disabled={isReadOnly(selectedTimesheet)}
                                displayEmpty
                              >
                                <MenuItem value=""><em>Select description...</em></MenuItem>
                                {activityDescriptions.map((desc, i) => (
                                  <MenuItem key={i} value={desc}>{desc}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={entry.detailedDescription || ''}
                              onChange={(e) => handleEntryChange(index, 'detailedDescription', e.target.value)}
                              placeholder="Add more details..."
                              disabled={isReadOnly(selectedTimesheet)}
                              multiline
                              maxRows={2}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
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
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isReadOnly(selectedTimesheet) || !formData.projectId || !formData.disciplineCode}
          >
            {selectedTimesheet ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
