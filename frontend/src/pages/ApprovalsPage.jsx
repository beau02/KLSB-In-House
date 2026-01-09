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
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  MenuItem
} from '@mui/material';
import { Visibility, CheckCircle, Cancel } from '@mui/icons-material';
import moment from 'moment';
import { timesheetService, projectService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const ApprovalsPage = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [comments, setComments] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    loadTimesheets();
    loadProjects();
  }, [selectedMonth, selectedYear]);

  const loadTimesheets = async () => {
    try {
      const params = { month: selectedMonth, year: selectedYear };
      const response = await timesheetService.getAll(params);
      setTimesheets(response.timesheets || []);
    } catch (error) {
      console.error('Error loading timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleOpenDialog = async (timesheet) => {
    // fetch fresh timesheet details to ensure _id and populated fields are present
    try {
      if (timesheet && timesheet._id) {
        const resp = await timesheetService.getById(timesheet._id);
        // resp may be { success, timesheet }
        const full = resp && resp.timesheet ? resp.timesheet : timesheet;
        setSelectedTimesheet(full);
      } else {
        setSelectedTimesheet(timesheet);
      }
    } catch (err) {
      console.error('Failed to fetch timesheet details, falling back to provided object', err);
      setSelectedTimesheet(timesheet);
    }
    setComments('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTimesheet(null);
    setComments('');
  };

  const handleApprove = async (timesheetParam) => {
    try {
      const target = timesheetParam || selectedTimesheet;
      const payloadComments = timesheetParam ? '' : comments;
      
      console.log('=== APPROVE DEBUG ===');
      console.log('timesheetParam:', timesheetParam);
      console.log('selectedTimesheet:', selectedTimesheet);
      console.log('target:', target);
      console.log('target keys:', target ? Object.keys(target) : 'no target');
      
      // Extract ID - handle both _id and id fields
      let id = null;
      if (target) {
        // MongoDB documents use _id
        if (target._id) {
          id = typeof target._id === 'object' ? target._id.toString() : target._id;
          console.log('Found _id:', id, 'type:', typeof target._id);
        } else if (target.id) {
          id = target.id;
          console.log('Found id:', id);
        }
      }
      
      if (!id) {
        console.error('No valid timesheet ID found. Target object:', JSON.stringify(target, null, 2));
        alert('No valid timesheet selected for approval. Check console for details.');
        return;
      }
      
      console.log('Calling approve API with ID:', id);
      await timesheetService.approve(id, payloadComments);
      handleCloseDialog();
      loadTimesheets();
    } catch (error) {
      console.error('Error approving timesheet:', error);
      alert(error.response?.data?.message || 'Error approving timesheet');
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      // Extract ID robustly
      let id = null;
      if (selectedTimesheet) {
        if (selectedTimesheet._id) {
          id = typeof selectedTimesheet._id === 'object' ? selectedTimesheet._id.toString() : selectedTimesheet._id;
        } else if (selectedTimesheet.id) {
          id = selectedTimesheet.id;
        }
      }
      
      if (!id) {
        console.error('No valid timesheet ID for rejection. Selected:', selectedTimesheet);
        alert('No valid timesheet selected for rejection');
        return;
      }
      
      await timesheetService.reject(id, comments);
      handleCloseDialog();
      loadTimesheets();
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      alert(error.response?.data?.message || 'Error rejecting timesheet');
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
    const labels = {
      draft: 'DRAFT',
      submitted: 'SUBMITTED',
      resubmitted: 'RESUBMITTED',
      approved: 'APPROVED',
      rejected: 'REJECTED'
    };
    return <Chip label={labels[status] || status.toUpperCase()} color={colors[status]} size="small" />;
  };

  const filterTimesheets = () => {
    let filtered = timesheets;

    // Filter by status based on tab
    switch (tabValue) {
      case 0: // Pending
        filtered = filtered.filter(t => t.status === 'submitted' || t.status === 'resubmitted');
        break;
      case 1: // Approved
        filtered = filtered.filter(t => t.status === 'approved');
        break;
      case 2: // Rejected
        filtered = filtered.filter(t => t.status === 'rejected');
        break;
      default:
        break;
    }

    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(t => {
        const projectId = t.projectId?._id || t.projectId;
        return projectId === selectedProject;
      });
    }

    return filtered;
  };

  const filteredTimesheets = filterTimesheets();

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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Timesheet Approvals
        </Typography>
        <Typography variant="body2">
          Review and approve employee timesheets
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
        <TextField
          select
          label="Project"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          size="small"
          sx={{ minWidth: 250 }}
        >
          <MenuItem value="all">All Projects</MenuItem>
          {projects.map((project) => (
            <MenuItem key={project._id} value={project._id}>
              {project.projectCode} - {project.projectName}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                '&.Mui-selected': {
                  color: (theme) => theme.palette.mode === 'dark' ? '#818cf8' : '#030C69',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#818cf8' : '#030C69',
              },
            }}
          >
            <Tab label={`Pending (${timesheets.filter(t => t.status === 'submitted' || t.status === 'resubmitted').length})`} />
            <Tab label={`Approved (${timesheets.filter(t => t.status === 'approved').length})`} />
            <Tab label={`Rejected (${timesheets.filter(t => t.status === 'rejected').length})`} />
          </Tabs>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 180, fontWeight: 700 }}>Employee</TableCell>
              <TableCell sx={{ width: 120, fontWeight: 700 }}>Period</TableCell>
              <TableCell sx={{ width: 420, fontWeight: 700 }}>Project</TableCell>
              <TableCell sx={{ width: 110, fontWeight: 700 }}>Normal Hours</TableCell>
              <TableCell sx={{ width: 110, fontWeight: 700 }}>OT Hours</TableCell>
              <TableCell sx={{ width: 110, fontWeight: 700 }}>Total Hours</TableCell>
              <TableCell sx={{ width: 100, fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ width: 140, fontWeight: 700 }}>Submitted Date</TableCell>
              <TableCell sx={{ width: 120, fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTimesheets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No timesheets found
                </TableCell>
              </TableRow>
            ) : (
              filteredTimesheets.map((timesheet) => (
                <TableRow key={timesheet._id}>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {timesheet.userId?.firstName} {timesheet.userId?.lastName}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {moment().month(timesheet.month - 1).format('MMMM')} {timesheet.year}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {timesheet.projectId?.projectName || 'N/A'}
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
                    {getStatusChip(timesheet.status)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {timesheet.submittedAt
                      ? moment(timesheet.submittedAt).format('MMM DD, YYYY')
                      : '-'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(timesheet)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                    {(timesheet.status === 'submitted' || timesheet.status === 'resubmitted') && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(timesheet)}
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDialog(timesheet)}
                        >
                          <Cancel />
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          Timesheet Details - {selectedTimesheet?.userId?.firstName} {selectedTimesheet?.userId?.lastName}
        </DialogTitle>
        <DialogContent>
          {selectedTimesheet && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="subtitle2" >
                    Period
                  </Typography>
                  <Typography variant="body1">
                    {moment().month(selectedTimesheet.month - 1).format('MMMM')} {selectedTimesheet.year}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3.6}>
                  <Typography variant="subtitle2" >
                    Project
                  </Typography>
                  <Typography variant="body1">
                    {selectedTimesheet.projectId?.projectName || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" >
                    Discipline
                  </Typography>
                  <Typography variant="body1">
                    {(() => {
                      const entries = selectedTimesheet.entries || [];
                      const codes = new Set();
                      entries.forEach((e) => {
                        (Array.isArray(e.disciplineCodes) ? e.disciplineCodes : e.disciplineCodes ? [e.disciplineCodes] : []).forEach((c) => codes.add(c));
                      });
                      const list = Array.from(codes);
                      return list.length ? list.join(', ') : '-';
                    })()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" >
                    Area
                  </Typography>
                  <Typography variant="body1">
                    {selectedTimesheet.area || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="subtitle2" >
                    Status
                  </Typography>
                  {getStatusChip(selectedTimesheet.status)}
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="subtitle2" >
                    Submitted
                  </Typography>
                  <Typography variant="body1">
                    {selectedTimesheet.submittedAt
                      ? moment(selectedTimesheet.submittedAt).format('MMM DD, YYYY')
                      : '-'}
                  </Typography>
                </Grid>
              </Grid>

              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Daily Hours Entry - {moment().month(selectedTimesheet.month - 1).format('MMMM')} {selectedTimesheet.year}
                  </Typography>
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : undefined }}>
                          <TableCell width="60px"><strong>Date</strong></TableCell>
                          <TableCell width="60px"><strong>Day</strong></TableCell>
                          <TableCell width="160px"><strong>Discipline Code</strong></TableCell>
                          <TableCell width="100px"><strong>Normal Hours</strong></TableCell>
                          <TableCell width="100px"><strong>OT Hours</strong></TableCell>
                          <TableCell width="260px"><strong>Description</strong></TableCell>
                          <TableCell><strong>Detailed Description</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedTimesheet.entries?.map((entry, index) => {
                          const entryDate = moment(entry.date);
                          const isWeekend = entryDate.day() === 0 || entryDate.day() === 6;
                          if (entry.normalHours === 0 && entry.otHours === 0) return null;
                          return (
                            <TableRow
                              key={index}
                              sx={{ backgroundColor: (theme) => isWeekend ? (theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.08)' : '#f5f5f5') : 'inherit' }}
                            >
                              <TableCell>{entryDate.format('DD')}</TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{ color: (theme) => isWeekend ? (theme.palette.mode === 'dark' ? '#fca5a5' : 'error.main') : 'inherit' }}
                                >
                                  {entryDate.format('ddd')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {(Array.isArray(entry.disciplineCodes) ? entry.disciplineCodes : entry.disciplineCodes ? [entry.disciplineCodes] : []).join(', ') || '-'}
                              </TableCell>
                              <TableCell>{entry.normalHours || 0}</TableCell>
                              <TableCell>{entry.otHours || 0}</TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', color: (theme) => theme.palette.text.primary }}>
                                  {entry.description || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', color: (theme) => theme.palette.text.primary }}>
                                  {entry.detailedDescription || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, p: 2, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : '#e3f2fd', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="h6">
                          Normal: {selectedTimesheet.totalNormalHours || 0} hrs
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="h6">
                          OT: {selectedTimesheet.totalOTHours || 0} hrs
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="h6">
                          Total: {selectedTimesheet.totalHours} hrs
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>

              {(selectedTimesheet.status === 'submitted' || selectedTimesheet.status === 'resubmitted') && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add comments (required for rejection)"
                  margin="normal"
                />
              )}

              {selectedTimesheet.comments && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#fff3e0', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Comments:</Typography>
                  <Typography variant="body2">{selectedTimesheet.comments}</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {(selectedTimesheet?.status === 'submitted' || selectedTimesheet?.status === 'resubmitted') && (
            <>
              <Button onClick={handleReject} color="error" variant="outlined">
                Reject
              </Button>
              <Button onClick={() => handleApprove()} color="success" variant="contained">
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

