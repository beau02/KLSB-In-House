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
import { Add, Edit, Delete } from '@mui/icons-material';
import moment from 'moment';
import { projectService, userService } from '../services';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    projectCode: '',
    projectName: '',
    description: '',
    startDate: '',
    endDate: '',
    managerId: '',
    budget: 0,
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        projectService.getAll(),
        userService.getAll({ role: 'manager' })
      ]);
      setProjects(projectsRes.projects || []);
      setUsers(usersRes.users || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        projectCode: project.projectCode,
        projectName: project.projectName,
        description: project.description || '',
        startDate: moment(project.startDate).format('YYYY-MM-DD'),
        endDate: project.endDate ? moment(project.endDate).format('YYYY-MM-DD') : '',
        managerId: project.managerId._id,
        budget: project.budget || 0,
        status: project.status
      });
    } else {
      setSelectedProject(null);
      setFormData({
        projectCode: '',
        projectName: '',
        description: '',
        startDate: '',
        endDate: '',
        managerId: '',
        budget: 0,
        status: 'active'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProject(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedProject) {
        await projectService.update(selectedProject._id, formData);
      } else {
        await projectService.create(formData);
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
      alert(error.response?.data?.message || 'Error saving project');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert(error.response?.data?.message || 'Error deleting project');
      }
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      active: 'success',
      completed: 'primary',
      'on-hold': 'warning',
      cancelled: 'error'
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
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Project
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Code</TableCell>
              <TableCell>Project Name</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No projects found
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project._id}>
                  <TableCell>{project.projectCode}</TableCell>
                  <TableCell>{project.projectName}</TableCell>
                  <TableCell>
                    {project.managerId?.firstName} {project.managerId?.lastName}
                  </TableCell>
                  <TableCell>{moment(project.startDate).format('MMM DD, YYYY')}</TableCell>
                  <TableCell>{getStatusChip(project.status)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(project)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(project._id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Project Code"
            value={formData.projectCode}
            onChange={(e) => setFormData({ ...formData, projectCode: e.target.value.toUpperCase() })}
            margin="normal"
            disabled={!!selectedProject}
            required
          />
          <TextField
            fullWidth
            label="Project Name"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Project Manager"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            margin="normal"
            required
          >
            {users.map((user) => (
              <MenuItem key={user._id} value={user._id}>
                {user.firstName} {user.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            type="date"
            label="End Date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="number"
            label="Budget"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            margin="normal"
          />
          <TextField
            select
            fullWidth
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            margin="normal"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="on-hold">On Hold</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
