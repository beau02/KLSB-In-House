import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
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
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Person,
  AccessTime,
  Work
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { overtimeRequestService } from '../services';

export const OvertimeApprovalPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await overtimeRequestService.getAll();
      setRequests(response.requests || response.overtimeRequests || []);
    } catch (err) {
      setError('Failed to load overtime requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setDialogOpen(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await overtimeRequestService.approve(selectedRequest._id);
      setSuccess('Overtime request approved successfully');
      handleCloseDialog();
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      await overtimeRequestService.reject(selectedRequest._id, rejectionReason);
      setSuccess('Overtime request rejected');
      handleCloseDialog();
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
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

  const filteredRequests = requests.filter(request => {
    if (activeTab === 0) return request.status === 'pending';
    if (activeTab === 1) return request.status === 'approved';
    if (activeTab === 2) return request.status === 'rejected';
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Overtime Approvals
        </Typography>
        <Typography variant="body1">
          Review and approve overtime requests from employees
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
                Pending Approval
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
                Approved
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
              <Typography variant="body2">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Pending (${pendingCount})`} />
          <Tab label={`Approved (${approvedCount})`} />
          <Tab label={`Rejected (${rejectedCount})`} />
        </Tabs>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Discipline</TableCell>
                <TableCell>Area</TableCell>
                <TableCell align="right">Requested Hours</TableCell>
                <TableCell align="right">Actual Hours</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: '#030C69', width: 36, height: 36 }}>
                        <Person fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {request.userId?.firstName} {request.userId?.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {request.userId?.department}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(request.date).toLocaleDateString('en-MY')}
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
                      label={`${request.requestedHours}h`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {request.actualHours ? (
                      <Chip
                        icon={<AccessTime />}
                        label={`${request.actualHours}h`}
                        size="small"
                        color="success"
                      />
                    ) : (
                      <Typography variant="caption" color="textSecondary">
                        Not filled
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 250 }}>
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
                    {request.status === 'pending' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDialog(request)}
                      >
                        Review
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleOpenDialog(request)}
                      >
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      No {activeTab === 0 ? 'pending' : activeTab === 1 ? 'approved' : 'rejected'} overtime requests
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Overtime Request Details
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Employee
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedRequest.userId?.firstName} {selectedRequest.userId?.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedRequest.date).toLocaleDateString('en-MY', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Requested Hours
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {selectedRequest.requestedHours} hours
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Project
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest.projectId?.projectCode} - {selectedRequest.projectId?.projectName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Discipline Code
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest.disciplineCode || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Area
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest.area || '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Reason
                  </Typography>
                  <Typography variant="body1">
                    {selectedRequest.reason}
                  </Typography>
                </Grid>
                {selectedRequest.workDescription && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Work Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedRequest.workDescription}
                    </Typography>
                  </Grid>
                )}
                {selectedRequest.status === 'pending' && (
                  <Grid item xs={12}>
                    <TextField
                      label="Rejection Reason (if rejecting)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                      helperText="Required only if rejecting the request"
                    />
                  </Grid>
                )}
                {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2">Rejection Reason</Typography>
                      <Typography variant="body2">{selectedRequest.rejectionReason}</Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Close
          </Button>
          {selectedRequest?.status === 'pending' && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={handleReject}
                disabled={loading}
                startIcon={<Cancel />}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleApprove}
                disabled={loading}
                startIcon={<CheckCircle />}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};
