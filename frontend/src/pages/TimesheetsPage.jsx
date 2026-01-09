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
  FormControl,
  Tooltip
} from '@mui/material';
import { Add, Edit, Visibility, Send, Delete, Block } from '@mui/icons-material';
import moment from 'moment';
import { timesheetService, projectService, overtimeRequestService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const TimesheetsPage = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [formData, setFormData] = useState({
    projectId: '',
    disciplineCodes: [],
    area: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    entries: []
  });

  // Discipline codes
  const disciplineCodes = ['PMT', 'ADM', 'PRS', 'CIV', 'STR', 'PPG', 'ARC', 'MEC', 'ELE', 'INS', 'TEL', 'GEN', 'DCS'];
  const MAX_DISCIPLINE_CODES = 8;

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

  const selectedProject = projects.find((project) => project._id === formData.projectId);
  const projectAreaOptions = selectedProject?.areas || [];
  const areaOptions = formData.area && !projectAreaOptions.includes(formData.area)
    ? [...projectAreaOptions, formData.area]
    : projectAreaOptions;

  const toDisciplineArray = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  };

  useEffect(() => {
    loadData();
  }, [user, selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      const projectsRes = await projectService.getAll({ status: 'active' });
      let timesheetsRes = { timesheets: [] };
      
      if (user) {
        const userId = user._id || user.id;
        timesheetsRes = await timesheetService.getByUser(userId, { month: selectedMonth, year: selectedYear });
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

  const handleOpenDialog = async (timesheet = null) => {
    // Load overtime requests
    try {
      const otRes = await overtimeRequestService.getMyRequests();
      console.log('Loaded OT requests:', otRes); // Debug log
      setOvertimeRequests(otRes.requests || otRes.overtimeRequests || []);
    } catch (error) {
      console.error('Error loading OT requests:', error);
      setOvertimeRequests([]);
    }

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
        disciplineCodes: toDisciplineArray(timesheet.disciplineCode),
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
        disciplineCodes: [],
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
      
      // Block OT hours if there's no approved OT request for this date
      if (field === 'otHours' && numValue > 0) {
        const validation = validateOTHours(newEntries[index].date, numValue);
        if (!validation.isValid) {
          alert(validation.message);
          return;
        }
      }
      
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

  const handleDisciplineChange = (event) => {
    const value = event.target.value;
    const codes = Array.isArray(value) ? value : [value];
    if (codes.length > MAX_DISCIPLINE_CODES) return;
    setFormData({ ...formData, disciplineCodes: codes });
  };

  const handleSubmit = async () => {
    try {
      // Validate that OT hours have approved requests
      const invalidEntries = formData.entries.filter(entry => {
        if (entry.otHours > 0) {
          const validation = validateOTHours(entry.date, entry.otHours);
          return !validation.isValid;
        }
        return false;
      });

      if (invalidEntries.length > 0) {
        const dates = invalidEntries.map(e => moment(e.date).format('MMM DD')).join(', ');
        alert(`Cannot save timesheet. OT hours on these dates require approved OT requests: ${dates}`);
        return;
      }

      const payload = {
        ...formData,
        area: formData.area,
        disciplineCodes: formData.disciplineCodes
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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timesheet? This action cannot be undone.')) {
      return;
    }
    try {
      await timesheetService.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      alert(error.response?.data?.message || 'Error deleting timesheet');
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

  const validateOTHours = (date, hours) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    const currentProjectId = formData.projectId;
    
    if (!currentProjectId) {
      return {
        isValid: false,
        message: 'Please select a project first before entering OT hours.'
      };
    }
    
    console.log('Validating OT for date:', dateStr, 'Hours:', hours, 'Project:', currentProjectId);
    
    // Find approved OT request for this date and project
    const approvedRequest = overtimeRequests.find(req => {
      const reqDateStr = moment(req.date).format('YYYY-MM-DD');
      const reqProjectId = req.projectId?._id || req.projectId;
      
      return reqDateStr === dateStr && 
             reqProjectId === currentProjectId && 
             req.status === 'approved';
    });
    
    if (!approvedRequest) {
      return {
        isValid: false,
        message: `Cannot enter OT hours for ${moment(date).format('MMM DD, YYYY')}. You need an approved OT request for this date and project first.`
      };
    }
    
    // Check if hours exceed approved amount
    if (hours > approvedRequest.hours) {
      return {
        isValid: false,
        message: `OT hours (${hours}) exceed approved amount (${approvedRequest.hours} hrs) for ${moment(date).format('MMM DD, YYYY')}.`
      };
    }
    
    return { isValid: true };
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          My Timesheets
        </Typography>
        <Typography variant="body2">
          Track your daily hours for each project
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TextField
          select
          label="Month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 120 }}
        >
          {moment.months().map((month, idx) => (
            <MenuItem key={idx} value={idx + 1}>{month}</MenuItem>
          ))}
        </TextField>
        <TextField
          type="number"
          label="Year"
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 100 }}
        />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          New Timesheet
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f5f7fa' }}>
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
                    >
                      {['draft', 'rejected'].includes(timesheet.status) ? <Edit /> : <Visibility />}
                    </IconButton>
                    {['draft', 'rejected'].includes(timesheet.status) && (
                      <>
                        <IconButton size="small" color="primary" onClick={() => handleSubmitForApproval(timesheet._id)}>
                          <Send />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(timesheet._id)}>
                          <Delete />
                        </IconButton>
                      </>
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
            <Paper sx={{ p: 2, mb: 3, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2', border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid #fecaca' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626', mb: 1 }}>
                ⚠️ Rejection Reason:
              </Typography>
              <Typography variant="body2" sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#fecaca' : '#991b1b' }}>
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
                  onChange={(e) => {
                    const projectId = e.target.value;
                    setFormData({ ...formData, projectId, area: '' });
                  }}
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
                  multiple
                  value={formData.disciplineCodes}
                  label="Discipline Code *"
                  onChange={handleDisciplineChange}
                  disabled={isReadOnly(selectedTimesheet)}
                  renderValue={(selected) => (selected || []).join(', ')}
                >
                  {disciplineCodes.map((code) => (
                    <MenuItem
                      key={code}
                      value={code}
                      disabled={!formData.disciplineCodes.includes(code) && formData.disciplineCodes.length >= MAX_DISCIPLINE_CODES}
                    >
                      {code}
                    </MenuItem>
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
                        <TableRow key={index} sx={{ bgcolor: (theme) => isWeekend ? (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : '#f5f5f5') : 'inherit' }}>
                          <TableCell>{entryDate.format('DD')}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: (theme) => isWeekend ? (theme.palette.mode === 'dark' ? '#fca5a5' : '#d32f2f') : 'inherit' }}>
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
                            {(() => {
                              // Check if there's an approved OT request for this date
                              const dateStr = moment(entry.date).format('YYYY-MM-DD');
                              const approvedOT = overtimeRequests.find(req => {
                                const reqDateStr = moment(req.date).format('YYYY-MM-DD');
                                const reqProjectId = req.projectId?._id || req.projectId;
                                return reqDateStr === dateStr && 
                                       reqProjectId === formData.projectId && 
                                       req.status === 'approved';
                              });
                              
                              const hasApprovedOT = !!approvedOT;
                              const isOTDisabled = isReadOnly(selectedTimesheet) || !hasApprovedOT;
                              
                              return !hasApprovedOT && !isReadOnly(selectedTimesheet) ? (
                                <Tooltip title="No approved OT request for this date. Submit an OT request first." arrow>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      fullWidth
                                      value={entry.otHours || ''}
                                      disabled
                                      placeholder="0"
                                      sx={{
                                        '& .MuiInputBase-input.Mui-disabled': {
                                          WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b',
                                          cursor: 'not-allowed'
                                        }
                                      }}
                                    />
                                    <Block sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: 20 }} />
                                  </Box>
                                </Tooltip>
                              ) : (
                                <Tooltip title={hasApprovedOT ? `Approved: ${approvedOT.hours} hrs` : ''} arrow>
                                  <TextField
                                    type="number"
                                    size="small"
                                    fullWidth
                                    value={entry.otHours || ''}
                                    onChange={(e) => handleEntryChange(index, 'otHours', e.target.value)}
                                    inputProps={{ min: 0, max: approvedOT?.hours || 24, step: 0.5 }}
                                    disabled={isReadOnly(selectedTimesheet)}
                                  />
                                </Tooltip>
                              );
                            })()}
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

              <Box sx={{ mt: 2, p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#e3f2fd', borderRadius: 1 }}>
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
            disabled={isReadOnly(selectedTimesheet) || !formData.projectId || formData.disciplineCodes.length === 0}
          >
            {selectedTimesheet ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
