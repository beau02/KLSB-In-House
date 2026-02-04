import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Card,
  CardContent,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { overtimeRequestService, projectService } from '../services';

// Helper function to get start of week (Monday)
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// Helper function to get week dates
const getWeekDates = (startDate) => {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const OvertimeRequestPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const start = getWeekStart(new Date());
    return start.toISOString().split('T')[0];
  });
  const [formData, setFormData] = useState({
    projectId: '',
    weekStartDate: '',
    dailyHours: [],
    reason: '',
    workDescription: '',
    disciplineCode: '',
    area: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchProjects();
  }, []);

  const selectedProject = projects.find((project) => project._id === formData.projectId);
  const projectAreaOptions = selectedProject?.areas || [];
  const areaOptions = formData.area && !projectAreaOptions.includes(formData.area)
    ? [...projectAreaOptions, formData.area]
    : projectAreaOptions;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await overtimeRequestService.getMyRequests();
      setRequests(response.overtimeRequests || response.requests || []);
    } catch (err) {
      setError('Failed to load overtime requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleOpenDialog = (request = null) => {
    if (request) {
      setEditingId(request._id);
      setFormData({
        projectId: request.projectId?._id || '',
        weekStartDate: request.weekStartDate ? new Date(request.weekStartDate).toISOString().split('T')[0] : '',
        dailyHours: request.dailyHours || [],
        reason: request.reason || '',
        workDescription: request.workDescription || '',
        disciplineCode: request.disciplineCode || '',
        area: request.area || ''
      });
    } else {
      const weekStart = getWeekStart(new Date());
      const weekDates = getWeekDates(weekStart);
      const defaultDailyHours = weekDates.map(date => ({
        date: date.toISOString().split('T')[0],
        hours: 0
      }));
      
      setEditingId(null);
      setFormData({
        projectId: '',
        weekStartDate: weekStart.toISOString().split('T')[0],
        dailyHours: defaultDailyHours,
        reason: '',
        workDescription: '',
        disciplineCode: '',
        area: ''
      });
    }
    setDialogOpen(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setFormData({
      projectId: '',
      weekStartDate: '',
      dailyHours: [],
      reason: '',
      workDescription: '',
      disciplineCode: '',
      area: ''
    });
  };

  const handleWeekChange = (newWeekStart) => {
    const weekStart = new Date(newWeekStart);
    const weekDates = getWeekDates(weekStart);
    const dailyHours = weekDates.map(date => ({
      date: date.toISOString().split('T')[0],
      hours: formData.dailyHours.find(dh => dh.date === date.toISOString().split('T')[0])?.hours || 0
    }));
    setFormData({ ...formData, weekStartDate: newWeekStart, dailyHours });
  };

  const handleHoursChange = (dateStr, hours) => {
    const updatedDailyHours = formData.dailyHours.map(dh => 
      dh.date === dateStr ? { ...dh, hours: parseFloat(hours) || 0 } : dh
    );
    setFormData({ ...formData, dailyHours: updatedDailyHours });
  };

  const handleSubmit = async () => {
    if (!formData.projectId || !formData.weekStartDate || !formData.reason) {
      setError('Please fill in all required fields');
      return;
    }

    // Filter out days with 0 hours
    const validDailyHours = formData.dailyHours.filter(dh => dh.hours > 0);

    if (validDailyHours.length === 0) {
      setError('Please enter hours for at least one day');
      return;
    }

    // Validate hours range
    for (const dh of validDailyHours) {
      if (dh.hours < 0 || dh.hours > 24) {
        setError('Hours must be between 0 and 24 for each day');
        return;
      }
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        dailyHours: validDailyHours
      };
      
      if (editingId) {
        await overtimeRequestService.update(editingId, submitData);
        setSuccess('Overtime request updated successfully');
      } else {
        await overtimeRequestService.create(submitData);
        setSuccess('Overtime request submitted successfully');
      }
      handleCloseDialog();
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit overtime request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this overtime request?')) {
      return;
    }

    try {
      setLoading(true);
      await overtimeRequestService.delete(id);
      setSuccess('Overtime request deleted successfully');
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete overtime request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle fontSize="small" />;
      case 'rejected':
        return <Cancel fontSize="small" />;
      default:
        return <Pending fontSize="small" />;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Overtime Requests
        </Typography>
        <Typography variant="body1">
          Request overtime hours for your projects
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Pending sx={{ color: '#f59e0b', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {pendingCount}
                </Typography>
              </Box>
              <Typography variant="body2">
                Pending Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: '#10b981', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {approvedCount}
                </Typography>
              </Box>
              <Typography variant="body2">
                Approved Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Cancel sx={{ color: '#ef4444', mr: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {rejectedCount}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Rejected Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #020850 0%, #030C69 100%)',
            }
          }}
        >
          New Overtime Request
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Week Period</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Discipline</TableCell>
                <TableCell>Area</TableCell>
                <TableCell align="right">Total Hours</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => {
                const weekStart = request.weekStartDate ? new Date(request.weekStartDate) : null;
                const weekEnd = request.weekEndDate ? new Date(request.weekEndDate) : null;
                const totalHours = request.totalRequestedHours || request.dailyHours?.reduce((sum, dh) => sum + (dh.hours || 0), 0) || 0;
                
                return (
                  <TableRow key={request._id}>
                    <TableCell>
                      {weekStart && weekEnd ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {weekStart.toLocaleDateString('en-MY')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            to {weekEnd.toLocaleDateString('en-MY')}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2">
                          {request.date ? new Date(request.date).toLocaleDateString('en-MY') : '-'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {request.projectId?.projectCode}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {request.projectId?.projectName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {request.disciplineCode ? (
                        <Chip label={request.disciplineCode} size="small" color="primary" variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.area || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        icon={<AccessTime />}
                        label={`${totalHours}h`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {request.dailyHours && request.dailyHours.length > 0 && (
                        <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5 }}>
                          {request.dailyHours.filter(dh => dh.hours > 0).length} days
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {request.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(request.status)}
                        label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        color={getStatusColor(request.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {request.status === 'pending' && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(request)}
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(request._id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      No overtime requests yet. Click "New Overtime Request" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Weekly Overtime Request' : 'New Weekly Overtime Request'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Project</InputLabel>
              <Select
                value={formData.projectId}
                label="Project"
                onChange={(e) => {
                  const projectId = e.target.value;
                  setFormData({ ...formData, projectId, area: '' });
                }}
              >
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.projectCode} - {project.projectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Week Starting (Monday)"
              type="date"
              value={formData.weekStartDate}
              onChange={(e) => handleWeekChange(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
              helperText="Select the Monday of the week you want to request overtime"
            />

            {/* Daily Hours Input */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Overtime Hours per Day
              </Typography>
              <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                Enter the overtime hours you plan to work each day of the week
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {formData.dailyHours.map((dayHours, index) => {
                  const date = new Date(dayHours.date);
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const dayName = dayNames[date.getDay()];
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={dayHours.date}>
                      <Box sx={{ 
                        p: 2, 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        backgroundColor: dayHours.hours > 0 ? '#f0f7ff' : '#fff'
                      }}>
                        <Typography variant="caption" color="textSecondary">
                          {dayName}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}
                        </Typography>
                        <TextField
                          type="number"
                          value={dayHours.hours}
                          onChange={(e) => handleHoursChange(dayHours.date, e.target.value)}
                          inputProps={{ min: 0, max: 24, step: 0.5 }}
                          size="small"
                          fullWidth
                          label="Hours"
                          sx={{
                            '& .MuiInputBase-input': {
                              fontSize: '1.1rem',
                              fontWeight: 600
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
              <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
                Total Week Hours: {formData.dailyHours.reduce((sum, dh) => sum + (dh.hours || 0), 0).toFixed(1)}h
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Discipline Code</InputLabel>
              <Select
                value={formData.disciplineCode}
                onChange={(e) => setFormData({ ...formData, disciplineCode: e.target.value })}
                label="Discipline Code"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="PMT">PMT</MenuItem>
                <MenuItem value="ADM">ADM</MenuItem>
                <MenuItem value="PRS">PRS</MenuItem>
                <MenuItem value="CIV">CIV</MenuItem>
                <MenuItem value="STR">STR</MenuItem>
                <MenuItem value="PPG">PPG</MenuItem>
                <MenuItem value="ARC">ARC</MenuItem>
                <MenuItem value="MEC">MEC</MenuItem>
                <MenuItem value="ELE">ELE</MenuItem>
                <MenuItem value="INS">INS</MenuItem>
                <MenuItem value="TEL">TEL</MenuItem>
                <MenuItem value="GEN">GEN</MenuItem>
                <MenuItem value="DCS">DCS</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Area</InputLabel>
              <Select
                value={formData.area}
                label="Area"
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {areaOptions.map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              multiline
              rows={2}
              required
              fullWidth
              helperText="Explain why you need to work overtime this week"
            />

            <TextField
              label="Work Description"
              value={formData.workDescription}
              onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
              multiline
              rows={3}
              fullWidth
              helperText="Describe the work you'll be doing (optional)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #030C69 0%, #1a2d9e 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #020850 0%, #030C69 100%)',
              }
            }}
          >
            {loading ? 'Submitting...' : editingId ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
