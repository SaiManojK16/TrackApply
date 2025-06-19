'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Avatar,
  Grid,
  Dialog,
  DialogContent,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  CircularProgress,
  ThemeProvider,
  Chip
} from '@mui/material';
import { 
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Upload as UploadFileIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import JobTracking from './components/JobTracking';

import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import CoverLetterGenerator from './components/CoverLetterGenerator';
import SidebarDemo from './components/sidebar-demo';
import theme from './theme';

const placeholderAvatar = 'https://www.w3schools.com/howto/img_avatar.png';

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resumeFile: null,
    resumeText: '',
    userInstructions: '',
  });
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showLatex, setShowLatex] = useState(false);
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  // Add hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'generator', 'tracking'
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  const fileInputRef = useRef(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check for existing authentication on app load
  useEffect(() => {
    if (!isHydrated) return; // Don't run until hydrated
    
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Pre-fill form with user data
      const userData = JSON.parse(savedUser);
      setFormData(prev => ({
        ...prev,
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        linkedin: userData.linkedin || '',
        github: userData.github || '',
        portfolio: userData.portfolio || ''
      }));
      
      // Set current page to home for logged-in users (dashboard)
      setCurrentPage('home');
    } else {
      // Set current page to home (landing page) for non-logged-in users
      setCurrentPage('home');
    }
  }, [isHydrated]);

  // Set up axios interceptor to include auth token
  useEffect(() => {
    if (token) {
      console.log('Setting axios authorization header with token:', token.substring(0, 20) + '...');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('Removing axios authorization header');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, resumeFile: file, resumeText: '' }));
  };

  const handleNext = () => {
    const currentSteps = getSteps(user);
    if (activeStep === currentSteps.length - 1) {
      // This is the last step (Job Information), so generate the cover letter
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Reset activeStep when user profile changes
  useEffect(() => {
    setActiveStep(0);
  }, [user]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validate required fields
    const currentSteps = getSteps(user);
    const isLastStep = activeStep === currentSteps.length - 1;
    
    if (!isLastStep) {
      // If not on the last step, just move to next step
      handleNext();
      return;
    }

    // Validate required fields for the current step
    if (activeStep === 0 && !user) {
      // User Details step (for non-logged-in users)
      if (!formData.fullName || !formData.email) {
        setError('Please fill in all required fields.');
        return;
      }
    } else if ((activeStep === 0 && user && !user.resumeData) || (activeStep === 1 && !user)) {
      // Resume step
      if (!formData.resumeFile && !formData.resumeText) {
        setError('Please upload a resume or paste resume text.');
        return;
      }
    } else if ((activeStep === 0 && user && user.resumeData) || (activeStep === 1 && user) || activeStep === 2) {
      // Job Information step
      if (!formData.jobTitle || !formData.companyName || !formData.jobDescription) {
        setError('Please fill in all required job information fields.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        ...formData,
        user: user ? {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          linkedin: user.linkedin,
          github: user.github,
          portfolio: user.portfolio,
          resumeData: user.resumeData
        } : null
      };

      const response = await axios.post('/api/generate-cover-letter', requestData);
      
      if (response.data.success) {
        setCoverLetter(response.data.coverLetter);
        setSnackbar({ open: true, message: 'Cover letter generated successfully!', severity: 'success' });
        
        // Generate PDF preview
        try {
          const pdfResponse = await axios.post('/api/generate-pdf', {
            latexContent: response.data.coverLetter
          }, {
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([pdfResponse.data]));
          setPreviewUrl(url);
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
        }
      } else {
        setError(response.data.error || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setError(error.response?.data?.error || 'Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, userToken) => {
    console.log('Login successful - User data:', userData);
    console.log('Login successful - Token received:', userToken ? userToken.substring(0, 20) + '...' : 'No token');
    
    setUser(userData);
    setToken(userToken);
    setShowAuth(false);
    setAuthMode('login');
    setCurrentPage('home'); // Changed from 'tracking' to 'home' (dashboard)
    
    // Pre-fill form with user data
    setFormData(prev => ({
      ...prev,
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      linkedin: userData.linkedin || '',
      github: userData.github || '',
      portfolio: userData.portfolio || ''
    }));
    
    // Save to localStorage
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('Token saved to localStorage');
    
    setSnackbar({ open: true, message: 'Login successful!', severity: 'success' });
  };

  const handleRegister = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setShowAuth(false);
    setAuthMode('register');
    setCurrentPage('home');
    
    // Pre-fill form with user data
    setFormData(prev => ({
      ...prev,
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      linkedin: userData.linkedin || '',
      github: userData.github || '',
      portfolio: userData.portfolio || ''
    }));
    
    // Save to localStorage
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Show welcome banner and redirect to dashboard
    setShowWelcomeBanner(true);
    
    setSnackbar({ open: true, message: 'Registration successful! Welcome to Cover Letter Generator!', severity: 'success' });
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCurrentPage('home');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset form data
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      portfolio: '',
      companyName: '',
      jobTitle: '',
      jobDescription: '',
      resumeFile: null,
      resumeText: '',
      userInstructions: '',
    });
    
    setSnackbar({ open: true, message: 'Logged out successfully!', severity: 'success' });
  };





  const getSteps = (user) => {
    const steps = [];
    
    // Add user details step only if user is not logged in
    if (!user) {
      steps.push('User Details');
    }
    
    // Add resume step only if user doesn't have resume data
    if (!user || !user.resumeData) {
      steps.push('Resume');
    }
    
    // Always add job information step
    steps.push('Job Information');
    
    return steps;
  };

  const renderSection = () => {
    switch (activeStep) {
      case 0:
        // User Details step (only shown if user is not logged in)
        if (!user) {
          return (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="LinkedIn Profile"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="GitHub Profile"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Portfolio Website"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          );
        } else {
          // If user is logged in, show resume step or job information
          if (!user.resumeData) {
            return (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Resume Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Upload your resume or paste the text content below.
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Upload Resume (PDF, DOC, DOCX)
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => fileInputRef.current?.click()}
                    startIcon={<UploadFileIcon />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      borderWidth: '2px',
                      fontSize: '0.875rem',
                      '&:hover': {
                        borderWidth: '2px',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }
                    }}
                  >
                    Choose File
                  </Button>
                  {formData.resumeFile && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      ✓ {formData.resumeFile.name}
                    </Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Or paste resume text
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    placeholder="Paste your resume content here..."
                    name="resumeText"
                    value={formData.resumeText}
                    onChange={handleInputChange}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: '2px',
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            );
          } else {
            // If user has resume data, show job information step
            return renderJobInformation();
          }
        }
      case 1:
        // Resume step (for non-logged-in users) or Job Information step (for logged-in users without resume)
        if (!user) {
          // Non-logged-in user: this is the resume step
          return (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Resume Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload your resume or paste the text content below.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Upload Resume (PDF, DOC, DOCX)
                </Typography>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<UploadFileIcon />}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    borderWidth: '2px',
                    fontSize: '0.875rem',
                    '&:hover': {
                      borderWidth: '2px',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  Choose File
                </Button>
                {formData.resumeFile && (
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    ✓ {formData.resumeFile.name}
                  </Typography>
                )}
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Or paste resume text
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Paste your resume content here..."
                  name="resumeText"
                  value={formData.resumeText}
                  onChange={handleInputChange}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px',
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          );
        } else {
          // Logged-in user without resume data: this is the resume step
          return (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Resume Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload your resume or paste the text content below.
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Upload Resume (PDF, DOC, DOCX)
                </Typography>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<UploadFileIcon />}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    borderWidth: '2px',
                    fontSize: '0.875rem',
                    '&:hover': {
                      borderWidth: '2px',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  Choose File
                </Button>
                {formData.resumeFile && (
                  <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                    ✓ {formData.resumeFile.name}
                  </Typography>
                )}
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Or paste resume text
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Paste your resume content here..."
                  name="resumeText"
                  value={formData.resumeText}
                  onChange={handleInputChange}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                        borderWidth: '2px',
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          );
        }
      case 2:
        // Job Information step (for non-logged-in users) or final step for logged-in users
        return renderJobInformation();
      default:
        return null;
    }
  };

  const renderJobInformation = () => {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Job Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Job Title"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Job Description"
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleInputChange}
              required
              multiline
              rows={4}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Hiring Manager Name (Optional)"
              name="hiringManagerName"
              value={formData.hiringManagerName}
              onChange={handleInputChange}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  }
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return user ? (
          // Dashboard view for logged-in users
          <DashboardView user={user} />
        ) : (
          <LandingPage onGetStarted={() => setShowAuth(true)} />
        );
      case 'generator':
        return <CoverLetterGenerator user={user} onUserUpdate={setUser} />;
      case 'tracking':
        return <JobTracking user={user} />;
      case 'profile':
        return <ProfilePage user={user} onUserUpdate={setUser} />;
      default:
        return user ? (
          <DashboardView user={user} />
        ) : (
          <LandingPage onGetStarted={() => setShowAuth(true)} />
        );
    }
  };

  // Dashboard component for logged-in users
  const DashboardView = ({ user }) => {
    const [dashboardStats, setDashboardStats] = useState({
      totalApplications: 0,
      interviews: 0,
      pending: 0,
      rejected: 0
    });

    useEffect(() => {
      fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
      try {
        // Use axios interceptor instead of manual headers
        const response = await axios.get('/api/job-applications');
        const applications = response.data.applications || [];
        
        const stats = {
          totalApplications: applications.length,
          interviews: applications.filter(app => 
            app.applicationStatus === 'Interview Scheduled' || 
            app.applicationStatus === 'Interview Completed'
          ).length,
          pending: applications.filter(app => 
            app.applicationStatus === 'Applied' || 
            app.applicationStatus === 'Ongoing Loan'
          ).length,
          rejected: applications.filter(app => 
            app.applicationStatus === 'Rejected' || 
            app.applicationStatus === 'Offer Declined'
          ).length
        };
        
        setDashboardStats(stats);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        if (error.response?.status === 401) {
          console.log('401 error in dashboard stats - token might be invalid');
          // Don't immediately log out - just show empty stats
          setDashboardStats({
            totalApplications: 0,
            interviews: 0,
            pending: 0,
            rejected: 0
          });
        } else {
          // For other errors, just log them
          console.error('Dashboard stats error:', error);
        }
      }
    };

    return (
      <Box sx={{ p: 0 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>
          Welcome back, {user.fullName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          What would you like to do today?
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }
            }} onClick={() => setCurrentPage('generator')}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DescriptionIcon sx={{ fontSize: 40, color: '#3b82f6', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Generate Cover Letter
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Create a professional, AI-powered cover letter tailored to your job application.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 3, 
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
              }
            }} onClick={() => setCurrentPage('tracking')}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WorkIcon sx={{ fontSize: 40, color: '#10b981', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Track Applications
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Manage and track your job applications in one organized dashboard.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Quick Stats */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                  {dashboardStats.totalApplications}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Applications
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                  {dashboardStats.interviews}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Interviews
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                  {dashboardStats.pending}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>
                  {dashboardStats.rejected}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rejected
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  // Profile Page Component
  const ProfilePage = ({ user, onUserUpdate }) => {
    // Helper function to split fullName into firstName and lastName
    const getNameParts = (fullName) => {
      if (!fullName) return { firstName: '', lastName: '' };
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      return { firstName, lastName };
    };

    const { firstName: initialFirstName, lastName: initialLastName } = getNameParts(user?.fullName);

    const [formData, setFormData] = useState({
      firstName: initialFirstName,
      lastName: initialLastName,
      email: user?.email || '',
      phone: user?.phone || '',
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      portfolio: user?.portfolio || '',
      accessKey: ''
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef(null);

    useEffect(() => {
      const { firstName: updatedFirstName, lastName: updatedLastName } = getNameParts(user?.fullName);
      setFormData({
        firstName: updatedFirstName,
        lastName: updatedLastName,
        email: user?.email || '',
        phone: user?.phone || '',
        linkedin: user?.linkedin || '',
        github: user?.github || '',
        portfolio: user?.portfolio || '',
        accessKey: ''
      });
    }, [user]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      try {
        const token = localStorage.getItem('token');
        
        // Check if access key is provided and validate it
        if (formData.accessKey) {
          if (formData.accessKey === '16092001') {
            // Valid key - unlock unlimited access
            const unlockResponse = await axios.post('/api/auth/unlock-access', 
              { accessKey: formData.accessKey }, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (unlockResponse.data.success) {
              const updatedUser = { ...user, hasUnlimitedAccess: true, generationCount: 0 };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setMessage({ text: 'Access key verified! You now have unlimited CV generation.', type: 'success' });
              if (onUserUpdate) onUserUpdate(updatedUser);
              setFormData(prev => ({ ...prev, accessKey: '' })); // Clear the key field
            }
          } else {
            setMessage({ text: 'Invalid access key. Please check and try again.', type: 'error' });
            setLoading(false);
            return;
          }
        }
        
        // Update profile with other data (excluding accessKey)
        const { accessKey, firstName, lastName, ...profileData } = formData;
        
        // Combine firstName and lastName into fullName for backend
        const profileDataWithFullName = {
          ...profileData,
          fullName: `${firstName} ${lastName}`.trim()
        };
        
        const response = await axios.put('/api/auth/profile', profileDataWithFullName, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Preserve hasUnlimitedAccess status if it exists
        const updatedUser = { 
          ...response.data.user, 
          hasUnlimitedAccess: user?.hasUnlimitedAccess || false,
          generationCount: user?.generationCount || 0
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        if (onUserUpdate) onUserUpdate(updatedUser);
      } catch (error) {
        setMessage({ text: error.response?.data?.error || 'Failed to update profile', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    const handleResumeUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setResumeFile(file);
      setResumeLoading(true);
      try {
        const formDataData = new FormData();
        formDataData.append('resume', file);
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/auth/upload-resume', formDataData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setMessage({ text: 'Resume uploaded successfully!', type: 'success' });
        if (onUserUpdate) onUserUpdate(response.data.user);
      } catch (error) {
        setMessage({ text: error.response?.data?.error || 'Failed to upload resume', type: 'error' });
      } finally {
        setResumeLoading(false);
      }
    };

    function stringAvatar(name) {
      if (!name) return '';
      const [first, last] = name.split(' ');
      return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
    }

    const tabs = [
      { id: 'profile', label: 'Profile', icon: '👤' },
      { id: 'resume', label: 'Resume', icon: '📄' },
      { id: 'settings', label: 'Account Settings', icon: '⚙️' }
    ];

    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#ffffff', // Pure white background
        py: 6,
        px: 2
      }}>
        <Container maxWidth="md">
          <Paper sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            backgroundColor: 'white'
          }}>
            {/* Header with Cover Image and Avatar */}
            <Box sx={{ 
              height: 200,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              p: 3
            }}>
              {/* Avatar */}
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    border: '4px solid white',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#667eea',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {stringAvatar(`${formData.firstName} ${formData.lastName}`)}
                </Avatar>
                {/* Online indicator */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: '3px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: 'white' 
                  }} />
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCurrentPage('tracking')}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  📊 Dashboard
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleLogout}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  🚪 Sign out
                </Button>
              </Box>
            </Box>

            {/* Profile Info */}
            <Box sx={{ px: 3, pt: 2, pb: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {formData.firstName || 'Your'} {formData.lastName || 'Name'}
                </Typography>
                <Box sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                    ✓
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, color: '#64748b' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">📧</Typography>
                  <Typography variant="body2">{formData.email || 'your@email.com'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">📍</Typography>
                  <Typography variant="body2">TrackApply User</Typography>
                </Box>
                {user?.hasUnlimitedAccess && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">👑</Typography>
                    <Typography variant="body2">Premium User</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ px: 3, borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', gap: 0 }}>
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    sx={{
                      minWidth: 'auto',
                      px: 3,
                      py: 2,
                      color: activeTab === tab.id ? '#1e293b' : '#64748b',
                      backgroundColor: 'transparent',
                      borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                      borderRadius: 0,
                      textTransform: 'none',
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.04)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{tab.icon}</Typography>
                      <Typography variant="body2">{tab.label}</Typography>
                    </Box>
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Tab Content */}
            <Box sx={{ p: 4 }}>
              {activeTab === 'profile' && (
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                        Full Name
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                  borderWidth: '2px',
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                  borderWidth: '2px',
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                  borderWidth: '2px',
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="LinkedIn Profile"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleInputChange}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                  borderWidth: '2px',
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="GitHub Profile"
                            name="github"
                            value={formData.github}
                            onChange={handleInputChange}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                  borderWidth: '2px',
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Portfolio Website"
                            name="portfolio"
                            value={formData.portfolio}
                            onChange={handleInputChange}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'primary.main',
                                  borderWidth: '2px',
                                }
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                        Phone Number
                      </Typography>
                      <TextField
                        fullWidth
                        value={formData.phone}
                        name="phone"
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#f8fafc',
                            border: 'none',
                            '& fieldset': {
                              border: 'none',
                            },
                            '&:hover fieldset': {
                              border: 'none',
                            },
                            '&.Mui-focused fieldset': {
                              border: '2px solid #3b82f6',
                            },
                          }
                        }}
                      />
                    </Grid>

                    {/* Premium Access Section */}
                    {!user?.hasUnlimitedAccess && (
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                          Premium Access Key
                        </Typography>
                        <Alert 
                          severity="warning"
                          sx={{ mb: 2, borderRadius: 2 }}
                        >
                          You have used {user?.generationCount || 0}/3 free generations. Enter your access key to unlock unlimited access.
                        </Alert>
                        <TextField
                          fullWidth
                          value={formData.accessKey}
                          name="accessKey"
                          onChange={handleInputChange}
                          placeholder="Enter your premium access key"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#f8fafc',
                              border: 'none',
                              '& fieldset': {
                                border: 'none',
                              },
                              '&:hover fieldset': {
                                border: 'none',
                              },
                              '&.Mui-focused fieldset': {
                                border: '2px solid #3b82f6',
                              },
                            }
                          }}
                        />
                      </Grid>
                    )}

                    {user?.hasUnlimitedAccess && (
                      <Grid item xs={12}>
                        <Alert 
                          severity="success"
                          sx={{ borderRadius: 2 }}
                        >
                          🎉 You have unlimited CV generation access!
                        </Alert>
                      </Grid>
                    )}
                  </Grid>

                  {message.text && (
                    <Alert severity={message.type} sx={{ mt: 3, borderRadius: 2 }}>
                      {message.text}
                    </Alert>
                  )}
                </form>
              )}

              {activeTab === 'resume' && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                    Resume Management
                  </Typography>
                  
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  
                  <Box 
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      border: '2px dashed #d1d5db',
                      borderRadius: 3,
                      p: 6,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#f8fafc',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: '#3b82f6',
                        backgroundColor: '#eff6ff',
                      }
                    }}
                  >
                    {resumeLoading ? (
                      <Box>
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                          Uploading...
                        </Typography>
                      </Box>
                    ) : user?.resumeData ? (
                      <Box>
                        <Typography sx={{ fontSize: '48px', mb: 2 }}>📄</Typography>
                        <Typography variant="h6" sx={{ color: '#22c55e', fontWeight: 600, mb: 1 }}>
                          Resume Uploaded Successfully
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Click to replace your current resume
                        </Typography>
                        <Button variant="outlined" size="small">
                          Replace Resume
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography sx={{ fontSize: '48px', mb: 2 }}>📄</Typography>
                        <Typography variant="h6" sx={{ color: '#374151', fontWeight: 600, mb: 1 }}>
                          Upload Your Resume
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Click here or drag and drop your resume file
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Supported formats: PDF, DOC, DOCX (Max 10MB)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {user?.resumeData && (
                    <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                      ✅ Your resume is ready for cover letter generation
                    </Alert>
                  )}
                </Box>
              )}

              {activeTab === 'settings' && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                    Account Settings
                  </Typography>
                  
                  {/* Change Password Section */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                      Change Password
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="password"
                          placeholder="Current Password"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#f8fafc',
                              border: 'none',
                              '& fieldset': {
                                border: 'none',
                              },
                              '&:hover fieldset': {
                                border: 'none',
                              },
                              '&.Mui-focused fieldset': {
                                border: '2px solid #3b82f6',
                              },
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="password"
                          placeholder="New Password"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#f8fafc',
                              border: 'none',
                              '& fieldset': {
                                border: 'none',
                              },
                              '&:hover fieldset': {
                                border: 'none',
                              },
                              '&.Mui-focused fieldset': {
                                border: '2px solid #3b82f6',
                              },
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="password"
                          placeholder="Confirm New Password"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: '#f8fafc',
                              border: 'none',
                              '& fieldset': {
                                border: 'none',
                              },
                              '&:hover fieldset': {
                                border: 'none',
                              },
                              '&.Mui-focused fieldset': {
                                border: '2px solid #3b82f6',
                              },
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          sx={{
                            backgroundColor: '#ef4444',
                            '&:hover': {
                              backgroundColor: '#dc2626',
                            },
                            borderRadius: 2,
                            px: 3,
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none'
                          }}
                        >
                          Update Password
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Account Actions */}
                  <Box sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#dc2626' }}>
                      Danger Zone
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Once you delete your account, there is no going back. Please be certain.
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: '#ef4444',
                        color: '#ef4444',
                        '&:hover': {
                          borderColor: '#dc2626',
                          backgroundColor: '#fef2f2',
                        },
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: 'none'
                      }}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ 
              px: 4, 
              py: 3, 
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Button
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    backgroundColor: '#f1f5f9',
                  }
                }}
              >
                Discard
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  backgroundColor: '#1e293b',
                  '&:hover': {
                    backgroundColor: '#0f172a',
                  }
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff', // Pure white background
      }}>
        {/* Show content based on user login status */}
        {!user ? (
          /* Show landing page without any header for non-logged-in users */
          <Box sx={{ flex: 1 }}>
            {renderCurrentPage()}
          </Box>
        ) : (
          /* Show sidebar layout for all logged-in users */
          <Box sx={{ height: '100vh', display: 'flex' }}>
            <SidebarDemo 
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              user={user}
              onLogout={handleLogout}
            />
            <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
              {/* Welcome Banner inside sidebar layout */}
              {showWelcomeBanner && user && (
                <Box sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  border: '1px solid',
                  borderColor: 'success.main',
                  borderRadius: '12px',
                  p: 3,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', mb: 0.5 }}>
                        Welcome, {user.fullName}! 🎉
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Complete your profile to automatically fill cover letters with your information.
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => {
                        setCurrentPage('profile');
                        setShowWelcomeBanner(false);
                      }}
                      startIcon={<SettingsIcon />}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      Complete Profile
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setShowWelcomeBanner(false)}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        borderWidth: '2px',
                        '&:hover': {
                          borderWidth: '2px',
                          transform: 'translateY(-1px)',
                        }
                      }}
                    >
                      Maybe Later
                    </Button>
                  </Box>
                </Box>
              )}
              
              {renderCurrentPage()}
            </Box>
          </Box>
        )}

        {/* Authentication Dialog */}
        <Dialog open={showAuth} onClose={() => setShowAuth(false)} maxWidth="md" fullWidth>
          <DialogContent sx={{ p: 0 }}>
            {authMode === 'login' ? (
              <Login 
                onLogin={handleLogin} 
                onSwitchToRegister={() => setAuthMode('register')} 
              />
            ) : (
              <Register 
                onRegister={handleRegister} 
                onSwitchToLogin={() => setAuthMode('login')} 
              />
            )}
          </DialogContent>
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
    </ThemeProvider>
  );
}

export default App;
