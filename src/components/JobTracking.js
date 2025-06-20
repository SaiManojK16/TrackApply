'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  Collapse,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Work as WorkIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Description as DescriptionIcon,
  Info as InfoIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import axios from 'axios';

const statusColors = {
  'Applied': { color: 'info', bgColor: '#e3f2fd', textColor: '#1976d2' },
  'Rejected': { color: 'error', bgColor: '#ffebee', textColor: '#d32f2f' },
  'Interview Scheduled': { color: 'warning', bgColor: '#fff3e0', textColor: '#f57c00' },
  'Interview Completed': { color: 'info', bgColor: '#e8f5e8', textColor: '#2e7d32' },
  'Offer Received': { color: 'success', bgColor: '#e8f5e8', textColor: '#2e7d32' },
  'Offer Accepted': { color: 'success', bgColor: '#e8f5e8', textColor: '#2e7d32' },
  'Offer Declined': { color: 'error', bgColor: '#ffebee', textColor: '#d32f2f' },
  'Withdrawn': { color: 'default', bgColor: '#f5f5f5', textColor: '#757575' },
  'Ongoing Loan': { color: 'primary', bgColor: '#e3f2fd', textColor: '#1976d2' },
  'Deferred': { color: 'warning', bgColor: '#fff3e0', textColor: '#f57c00' },
  'Confirmed offer': { color: 'success', bgColor: '#e8f5e8', textColor: '#2e7d32' },
  'Offer expired': { color: 'error', bgColor: '#ffebee', textColor: '#d32f2f' },
  'Loan ended': { color: 'default', bgColor: '#f5f5f5', textColor: '#757575' }
};

// Main filter statuses (only show these 4 in the filter dropdown)
const mainFilterStatuses = ['Applied', 'Rejected', 'Interview Scheduled', 'Interview Completed'];

const JobTracking = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [viewingApplication, setViewingApplication] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Email generation state
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    hiringManagerName: '',
    hiringManagerEmail: ''
  });
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    applicationStatus: 'Applied',
    interviewDate: '',
    notes: '',
    location: '',
    contactEmail: ''
  });

  const theme = useTheme();

  useEffect(() => {
    if (user) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      console.log('Fetching applications...');
      
      // Use axios interceptor instead of manual headers
      const response = await axios.get('/api/job-applications');
      console.log('Applications fetched:', response.data.applications?.length || 0);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Fetch applications error:', error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to home/login
        window.location.reload();
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to fetch applications',
          severity: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post('/api/job-applications', formData);
      setSnackbar({
        open: true,
        message: 'Job application added successfully!',
        severity: 'success'
      });
      setFormData({
        jobTitle: '',
        companyName: '',
        jobDescription: '',
        applicationStatus: 'Applied',
        interviewDate: '',
        notes: '',
        location: '',
        contactEmail: ''
      });
      setOpenDialog(false);
      fetchApplications();
    } catch (error) {
      console.error('Add application error:', error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Failed to add application',
          severity: 'error'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (application) => {
    setEditingApplication(application);
    setFormData({
      jobTitle: application.jobTitle,
      companyName: application.companyName,
      jobDescription: application.jobDescription,
      applicationStatus: application.applicationStatus,
      interviewDate: application.interviewDate ? new Date(application.interviewDate).toISOString().split('T')[0] : '',
      notes: application.notes || '',
      location: application.location || '',
      contactEmail: application.contactEmail || ''
    });
    setOpenDialog(true);
  };

  const handleView = (application) => {
    setViewingApplication(application);
  };

  const handleDelete = async (applicationId) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await axios.delete(`/api/job-applications/${applicationId}`);
        setSnackbar({
          open: true,
          message: 'Application deleted successfully!',
          severity: 'success'
        });
        fetchApplications();
      } catch (error) {
        console.error('Delete application error:', error);
        if (error.response?.status === 401) {
          setSnackbar({
            open: true,
            message: 'Session expired. Please log in again.',
            severity: 'error'
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
        } else {
          setSnackbar({
            open: true,
            message: 'Failed to delete application',
            severity: 'error'
          });
        }
      }
    }
  };

  const handleGenerateEmail = async (application) => {
    try {
      setEmailLoading(true);
      setEmailFormData({
        hiringManagerName: '',
        hiringManagerEmail: ''
      });
      setEmailDialog(true);

      const response = await axios.post('/api/generate-email', {
        jobTitle: application.jobTitle,
        companyName: application.companyName,
        jobDescription: application.jobDescription,
        hiringManagerName: '',
        hiringManagerEmail: ''
      });

      setEmailData({
        ...response.data,
        application: application
      });
    } catch (error) {
      console.error('Generate email error:', error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Failed to generate email',
          severity: 'error'
        });
      }
      setEmailDialog(false);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailFormChange = (e) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegenerateEmail = async () => {
    if (!emailData) return;
    
    try {
      setEmailLoading(true);
      const response = await axios.post('/api/generate-email', {
        jobTitle: emailData.application.jobTitle,
        companyName: emailData.application.companyName,
        jobDescription: emailData.application.jobDescription,
        hiringManagerName: emailFormData.hiringManagerName,
        hiringManagerEmail: emailFormData.hiringManagerEmail
      });

      setEmailData({
        ...response.data,
        application: emailData.application
      });
    } catch (error) {
      console.error('Regenerate email error:', error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: 'Session expired. Please log in again.',
          severity: 'error'
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Failed to regenerate email',
          severity: 'error'
        });
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCopyEmail = () => {
    if (!emailData) return;
    
    const emailText = `Subject: ${emailData.email.subject}\n\n${emailData.email.body}`;
    navigator.clipboard.writeText(emailText).then(() => {
      setSnackbar({
        open: true,
        message: 'Email copied to clipboard!',
        severity: 'success'
      });
    }).catch(() => {
      setSnackbar({
        open: true,
        message: 'Failed to copy email',
        severity: 'error'
      });
    });
  };

  const handleSendEmail = () => {
    if (!emailData) return;
    
    const subject = encodeURIComponent(emailData.email.subject);
    const body = encodeURIComponent(emailData.email.body);
    const mailtoLink = `mailto:${emailFormData.hiringManagerEmail || ''}?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink, '_blank');
  };

  const handleCloseEmailDialog = () => {
    setEmailDialog(false);
    setEmailData(null);
    setEmailFormData({
      hiringManagerName: '',
      hiringManagerEmail: ''
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingApplication(null);
    setFormData({
      jobTitle: '',
      companyName: '',
      jobDescription: '',
      applicationStatus: 'Applied',
      interviewDate: '',
      notes: '',
      location: '',
      contactEmail: ''
    });
  };

  const handleAddNew = () => {
    setEditingApplication(null);
    setFormData({
      jobTitle: '',
      companyName: '',
      jobDescription: '',
      applicationStatus: 'Applied',
      interviewDate: '',
      notes: '',
      location: '',
      contactEmail: ''
    });
    setOpenDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter applications based on status and search
  const filteredApplications = applications.filter(application => {
    const matchesStatus = statusFilter === 'All' || application.applicationStatus === statusFilter;
    const matchesSearch =
      application.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.applicationStatus.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 3
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: '#1e293b',
            mb: 1
          }}>
            Job Application Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your job applications and track your progress with TrackApply
          </Typography>
        </Box>

        {/* Search and Filter Bar */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap'
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            <TextField
              placeholder="Search by company or job title..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                  },
                }
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#3b82f6',
                  },
                }}
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Applied">Applied</MenuItem>
                <MenuItem value="Interview Scheduled">Interview Scheduled</MenuItem>
                <MenuItem value="Interview Completed">Interview Completed</MenuItem>
                <MenuItem value="Offer Received">Offer Received</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Withdrawn">Withdrawn</MenuItem>
              </Select>
            </FormControl>

            <IconButton
              onClick={fetchApplications}
              disabled={loading}
              sx={{
                color: '#64748b',
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                  color: '#3b82f6',
                },
                '&:disabled': {
                  backgroundColor: '#f8fafc',
                  color: '#cbd5e1',
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{
              backgroundColor: '#3b82f6',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                backgroundColor: '#2563eb',
              }
            }}
          >
            Add Application
          </Button>
        </Box>

        {/* Table */}
        <Paper sx={{ 
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    COMPANY
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    JOB ROLE
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    STATUS
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    LAST UPDATE
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 2,
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                      <Box>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          Loading applications...
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Please wait while we fetch your job applications
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                      <Box>
                        <WorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No applications found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add your first job application to get started
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((application, index) => (
                    <TableRow 
                      key={`main-row-${application._id || application.id || index}`}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: '#f8fafc',
                        },
                        borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                          {application.companyName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {application.jobTitle}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>
                        <Chip
                          label={application.applicationStatus}
                          size="small"
                          sx={{
                            backgroundColor: statusColors[application.applicationStatus]?.bgColor || '#f1f5f9',
                            color: statusColors[application.applicationStatus]?.textColor || '#64748b',
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: 24,
                            '& .MuiChip-label': {
                              px: 1.5
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {formatTime(application.updatedAt || application.applicationDate)} {formatDate(application.updatedAt || application.applicationDate)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2, borderBottom: 'none' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleView(application)}
                            sx={{ 
                              color: '#64748b',
                              '&:hover': {
                                backgroundColor: '#f1f5f9',
                                color: '#3b82f6'
                              }
                            }}
                          >
                            <ViewIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleEdit(application)}
                            sx={{ 
                              color: '#64748b',
                              '&:hover': {
                                backgroundColor: '#f1f5f9',
                                color: '#f59e0b'
                              }
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleGenerateEmail(application)}
                            sx={{ 
                              color: '#64748b',
                              '&:hover': {
                                backgroundColor: '#f1f5f9',
                                color: '#10b981'
                              }
                            }}
                          >
                            <EmailIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the application for ${application.jobTitle} at ${application.companyName}?`)) {
                                handleDelete(application._id || application.id);
                              }
                            }}
                            sx={{ 
                              color: '#64748b',
                              '&:hover': {
                                backgroundColor: '#f1f5f9',
                                color: '#ef4444'
                              }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* Add/Edit Job Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          pt: 4,
          px: 4,
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              {editingApplication ? 'Edit Application' : 'Add New Application'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editingApplication ? 'Update your job application details' : 'Track a new job opportunity'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              color: '#64748b',
              backgroundColor: '#f8fafc',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                color: '#ef4444'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, backgroundColor: '#fafbfc' }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Job Title *
                </Typography>
                <TextField
                  fullWidth
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Senior Frontend Developer"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Company Name *
                </Typography>
                <TextField
                  fullWidth
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Google, Microsoft, Apple"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Job Description
                </Typography>
                <TextField
                  fullWidth
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  placeholder="Paste the job description here..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Application Status
                </Typography>
                <FormControl fullWidth>
                  <Select
                    name="applicationStatus"
                    value={formData.applicationStatus}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }}
                  >
                    {Object.keys(statusColors).map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Interview Date
                </Typography>
                <TextField
                  fullWidth
                  name="interviewDate"
                  type="date"
                  value={formData.interviewDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Location
                </Typography>
                <TextField
                  fullWidth
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. San Francisco, CA or Remote"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Contact Email
                </Typography>
                <TextField
                  fullWidth
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="recruiter@company.com"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Notes
                </Typography>
                <TextField
                  fullWidth
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  placeholder="Add any additional notes about this application..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderColor: '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#3b82f6',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                      },
                    }
                  }}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, backgroundColor: 'white', borderTop: '1px solid #f1f5f9' }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: 3,
              px: 4,
              py: 1.5,
              borderColor: '#e5e7eb',
              color: '#6b7280',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#d1d5db',
                backgroundColor: '#f9fafb',
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{
              textTransform: 'none',
              borderRadius: 3,
              px: 4,
              py: 1.5,
              backgroundColor: '#3b82f6',
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                backgroundColor: '#2563eb',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              '&:disabled': {
                backgroundColor: '#94a3b8',
                color: 'white'
              }
            }}
          >
            {submitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                {editingApplication ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              editingApplication ? 'Update Application' : 'Add Application'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Generation Dialog */}
      <Dialog open={emailDialog} onClose={handleCloseEmailDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Generate Follow-up Email
          </Typography>
          <IconButton
            onClick={handleCloseEmailDialog}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {emailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : emailData ? (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hiring Manager Name"
                    name="hiringManagerName"
                    value={emailFormData.hiringManagerName}
                    onChange={handleEmailFormChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Hiring Manager Email"
                    name="hiringManagerEmail"
                    type="email"
                    value={emailFormData.hiringManagerEmail}
                    onChange={handleEmailFormChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Generated Email
              </Typography>
              
              <Paper sx={{ p: 3, backgroundColor: '#f8fafc', borderRadius: '12px', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Subject: {emailData.email.subject}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {emailData.email.body}
                </Typography>
              </Paper>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRegenerateEmail}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 3
                  }}
                >
                  Regenerate
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyEmail}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 3
                  }}
                >
                  Copy
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSendEmail}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 3,
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                    }
                  }}
                >
                  Send Email
                </Button>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog 
        open={Boolean(viewingApplication)} 
        onClose={() => setViewingApplication(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          pt: 4,
          px: 4,
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              Application Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View complete information about this job application
            </Typography>
          </Box>
          <IconButton
            onClick={() => setViewingApplication(null)}
            sx={{
              color: '#64748b',
              backgroundColor: '#f8fafc',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                color: '#ef4444'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, backgroundColor: '#fafbfc' }}>
          {viewingApplication && (
            <Box>
              {/* Header Section */}
              <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 2, 
                    backgroundColor: '#3b82f6', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <WorkIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                      {viewingApplication.jobTitle}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b' }}>
                      {viewingApplication.companyName}
                    </Typography>
                  </Box>
                  <Chip
                    label={viewingApplication.applicationStatus}
                    size="medium"
                    sx={{
                      backgroundColor: statusColors[viewingApplication.applicationStatus]?.bgColor || '#f1f5f9',
                      color: statusColors[viewingApplication.applicationStatus]?.textColor || '#64748b',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      height: 32,
                      '& .MuiChip-label': {
                        px: 2
                      }
                    }}
                  />
                </Box>
              </Paper>

              {/* Details Grid */}
              <Grid container spacing={3}>
                {/* Job Description */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <DescriptionIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        Job Description
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      color: '#64748b', 
                      lineHeight: 1.6,
                      backgroundColor: '#f8fafc',
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      {viewingApplication.jobDescription || 'No description provided'}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Application Details */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <InfoIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        Application Details
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                          Applied Date
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                          {formatDate(viewingApplication.applicationDate)}
                        </Typography>
                      </Box>
                      
                      {viewingApplication.location && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                            Location
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                            {viewingApplication.location}
                          </Typography>
                        </Box>
                      )}
                      
                      {viewingApplication.contactEmail && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                            Contact Email
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                            {viewingApplication.contactEmail}
                          </Typography>
                        </Box>
                      )}
                      
                      {viewingApplication.interviewDate && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 0.5 }}>
                            Interview Date
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#1e293b', fontWeight: 500 }}>
                            {formatDate(viewingApplication.interviewDate)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>

                {/* Notes */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <NoteIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        Notes
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      color: '#64748b', 
                      lineHeight: 1.6,
                      backgroundColor: '#f8fafc',
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      minHeight: 120
                    }}>
                      {viewingApplication.notes || 'No notes added'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, borderTop: '1px solid #f1f5f9', backgroundColor: '#fafbfc' }}>
          <Button 
            variant="outlined"
            onClick={() => setViewingApplication(null)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1,
              borderColor: '#e2e8f0',
              color: '#64748b',
              '&:hover': {
                borderColor: '#cbd5e1',
                backgroundColor: '#f8fafc'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JobTracking; 