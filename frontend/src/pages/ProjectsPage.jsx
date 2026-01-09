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
  Tooltip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import moment from 'moment';
import { projectService } from '../services';
import { useAuth } from '../contexts/AuthContext';

export const ProjectsPage = () => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [areaProject, setAreaProject] = useState(null);
  const [newArea, setNewArea] = useState('');
  const [savingArea, setSavingArea] = useState(false);
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false);
  const [platformProject, setPlatformProject] = useState(null);
  const [newPlatform, setNewPlatform] = useState('');
  const [savingPlatform, setSavingPlatform] = useState(false);
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

  const handleOpenAreaDialog = (project) => {
    setAreaProject(project);
    setNewArea('');
    setAreaDialogOpen(true);
  };

  const handleCloseAreaDialog = () => {
    setAreaDialogOpen(false);
    setAreaProject(null);
    setNewArea('');
  };

  const handleOpenPlatformDialog = (project) => {
    setPlatformProject(project);
    setNewPlatform('');
    setPlatformDialogOpen(true);
  };

  const handleClosePlatformDialog = () => {
    setPlatformDialogOpen(false);
    setPlatformProject(null);
    setNewPlatform('');
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
        console.log('Attempting to delete project:', id);
        const result = await projectService.delete(id);
        console.log('Delete result:', result);
        alert('Project deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting project:', error);
        console.error('Error response:', error.response);
        alert(error.response?.data?.message || 'Error deleting project');
      }
    }
  };

  const handleAddArea = async () => {
    if (!areaProject?._id) return;

    const trimmedArea = newArea.trim();
    if (!trimmedArea) {
      alert('Please enter an area name');
      return;
    }

    try {
      setSavingArea(true);
      await projectService.addArea(areaProject._id, trimmedArea);
      handleCloseAreaDialog();
      loadData();
    } catch (error) {
      console.error('Error adding area:', error);
      alert(error.response?.data?.message || 'Error adding area');
    } finally {
      setSavingArea(false);
    }
  };

  const handleAddPlatform = async () => {
    if (!platformProject?._id) return;

    const trimmedPlatform = newPlatform.trim();
    if (!trimmedPlatform) {
      alert('Please enter a platform name');
      return;
    }

    try {
      setSavingPlatform(true);
      await projectService.addPlatform(platformProject._id, trimmedPlatform);
      handleClosePlatformDialog();
      loadData();
    } catch (error) {
      console.error('Error adding platform:', error);
      alert(error.response?.data?.message || 'Error adding platform');
    } finally {
      setSavingPlatform(false);
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
    <Container maxWidth={false} sx={{ maxWidth: '95%', px: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Projects
        </Typography>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Manage company and contractor projects
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 2, sm: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size={window.innerWidth < 600 ? 'small' : 'medium'}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          New Project
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: { xs: '0 2px 8px rgba(0,0,0,0.08)', sm: '0 4px 20px rgba(0,0,0,0.08)' } }}>
        <Table sx={{ minWidth: { xs: 700, md: 'unset' } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f5f7fa' }}>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Project Code</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Project Name</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Company</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Contractor</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Platforms</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Areas</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Start Date</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
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
                  <TableCell>
                    {project.platforms?.length ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {project.platforms.slice(0, 2).map((platform) => (
                          <Chip key={platform} label={platform} size="small" color="secondary" />
                        ))}
                        {project.platforms.length > 2 && (
                          <Typography variant="caption" color="textSecondary">
                            +{project.platforms.length - 2} more
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      '-' 
                    )}
                  </TableCell>
                  <TableCell>
                    {project.areas?.length ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {project.areas.slice(0, 3).map((area) => (
                          <Chip key={area} label={area} size="small" />
                        ))}
                        {project.areas.length > 3 && (
                          <Typography variant="caption" color="textSecondary">
                            +{project.areas.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      '-' 
                    )}
                  </TableCell>
                  <TableCell>{moment(project.startDate).format('MMM DD, YYYY')}</TableCell>
                  <TableCell>{getStatusChip(project.status)}</TableCell>
                  <TableCell>
                    {isAdmin && (
                      <>
                        <Tooltip title="Add platform">
                          <IconButton size="small" onClick={() => handleOpenPlatformDialog(project)}>
                            <Add />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Add area">
                          <IconButton size="small" onClick={() => handleOpenAreaDialog(project)}>
                            <Add />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { m: { xs: 1, sm: 2 }, maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' } } }}>
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
          {selectedProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
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

      <Dialog open={areaDialogOpen} onClose={handleCloseAreaDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Area to Project</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {areaProject ? `${areaProject.projectCode} - ${areaProject.projectName}` : ''}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Areas are used in timesheets and overtime requests for this project.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {areaProject?.areas?.length ? (
              areaProject.areas.map((area) => (
                <Chip key={area} label={area} size="small" />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">No areas yet</Typography>
            )}
          </Box>
          <TextField
            fullWidth
            label="New Area Name"
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
            placeholder="e.g. SOW 1"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAreaDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddArea} disabled={savingArea}>
            {savingArea ? 'Adding...' : 'Add Area'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={platformDialogOpen} onClose={handleClosePlatformDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Platform to Project</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {platformProject ? `${platformProject.projectCode} - ${platformProject.projectName}` : ''}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Platforms are used in timesheets for this project (e.g., PDMS, E3D, SmartPlant).
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {platformProject?.platforms?.length ? (
              platformProject.platforms.map((platform) => (
                <Chip key={platform} label={platform} size="small" color="secondary" />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">No platforms yet</Typography>
            )}
          </Box>
          <TextField
            fullWidth
            label="New Platform Name"
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            placeholder="e.g. PDMS, E3D, SmartPlant"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlatformDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPlatform} disabled={savingPlatform}>
            {savingPlatform ? 'Adding...' : 'Add Platform'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
