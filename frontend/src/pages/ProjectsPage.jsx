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
import { projectService } from '../services';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    projectCode: '',
    projectName: '',
    description: '',
    startDate: '',
    endDate: '',
    company: '',
    contractor: '',
    status: 'active'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const projectsRes = await projectService.getAll();
      setProjects(projectsRes.projects || []);
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
        company: project.company || '',
        contractor: project.contractor || '',
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
        company: '',
        contractor: '',
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
    <Container maxWidth={false} sx={{ maxWidth: '95%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#030C69' }}>
          Projects
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage company and contractor projects
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
            <TableCell>Company</TableCell>
            <TableCell>Contractor</TableCell>
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
                  <TableCell>{project.company || '-'}</TableCell>
                  <TableCell>{project.contractor || '-'}</TableCell>
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
            fullWidth
            label="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Contractor"
            value={formData.contractor}
            onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
            margin="normal"
          />
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
