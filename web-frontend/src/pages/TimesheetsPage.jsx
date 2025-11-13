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
  CircularProgress
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
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    entries: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [timesheetsRes, projectsRes] = await Promise.all([
        timesheetService.getAll(),
        projectService.getAll({ status: 'active' })
      ]);
      setTimesheets(timesheetsRes.timesheets || []);
      setProjects(projectsRes.projects || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (timesheet = null) => {
    if (timesheet) {
      setSelectedTimesheet(timesheet);
      setFormData({
        projectId: timesheet.projectId._id,
        month: timesheet.month,
        year: timesheet.year,
        entries: timesheet.entries || []
      });
    } else {
      setSelectedTimesheet(null);
      setFormData({
        projectId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        entries: []
      });
    }
    setDialogOpen(true);
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
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Timesheets</Typography>
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
                  <TableCell>{timesheet.totalHours} hrs</TableCell>
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTimesheet ? 'View/Edit Timesheet' : 'Create New Timesheet'}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Project"
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            margin="normal"
            disabled={!!selectedTimesheet}
          >
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.projectCode} - {project.projectName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Month"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            margin="normal"
            disabled={!!selectedTimesheet}
          >
            {moment.months().map((month, index) => (
              <MenuItem key={index} value={index + 1}>
                {month}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="number"
            label="Year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            margin="normal"
            disabled={!!selectedTimesheet}
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Add daily entries in the timesheet form (implementation can be expanded)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={selectedTimesheet?.status === 'approved'}
          >
            {selectedTimesheet ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
