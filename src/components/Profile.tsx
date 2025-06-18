import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  IconButton,
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  Alert,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { 
  Close as CloseIcon, 
  UploadFile as UploadFileIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Language as LanguageIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import axios from 'axios';

function stringAvatar(name) {
  if (!name) return '';
  const [first, last] = name.split(' ');
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

const ProfileDialog = ({ open, onClose, user, onProfileUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const fileInputRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      portfolio: user?.portfolio || '',
      accessKey: ''
    });
  }, [user, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Check if access key is provided and validate it
      if (formData.accessKey) {
        if (formData.accessKey === '16092001') {
          // Valid key - unlock unlimited access
          const unlockResponse = await axios.post('http://localhost:5001/api/auth/unlock-access', 
            { accessKey: formData.accessKey }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (unlockResponse.data.success) {
            const updatedUser = { ...user, hasUnlimitedAccess: true, generationCount: 0 };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setSnackbar({ open: true, message: 'Access key verified! You now have unlimited CV generation.', severity: 'success' });
            if (onProfileUpdate) onProfileUpdate(updatedUser);
            setFormData(prev => ({ ...prev, accessKey: '' })); // Clear the key field
          }
        } else {
          setSnackbar({ open: true, message: 'Invalid access key. Please check and try again.', severity: 'error' });
          setLoading(false);
          return;
        }
      }
      
      // Update profile with other data (excluding accessKey)
      const { accessKey, ...profileData } = formData;
      const response = await axios.put('http://localhost:5001/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Preserve hasUnlimitedAccess status if it exists
      const updatedUser = { 
        ...response.data.user, 
        hasUnlimitedAccess: user?.hasUnlimitedAccess || false,
        generationCount: user?.generationCount || 0
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSnackbar({ open: true, message: 'Profile updated!', severity: 'success' });
      if (onProfileUpdate) onProfileUpdate(updatedUser);
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to update profile', severity: 'error' });
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
      const response = await axios.post('http://localhost:5001/api/auth/upload-resume', formDataData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setSnackbar({ open: true, message: 'Resume uploaded!', severity: 'success' });
      if (onProfileUpdate) onProfileUpdate(response.data.user);
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to upload resume', severity: 'error' });
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          overflow: 'visible'
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        position: 'relative',
        pt: 4,
        pb: 6,
        px: 4
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 700,
                border: '3px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              {stringAvatar(`${formData.firstName} ${formData.lastName}`)}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {formData.firstName || 'Your'} {formData.lastName || 'Profile'}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {formData.email || 'Update your TrackApply profile'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4, mt: -2 }}>
        <form onSubmit={handleSubmit}>
          {/* Personal Information Section */}
          <Card sx={{ mb: 4, border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PersonIcon sx={{ color: 'primary.main', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Personal Information
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="LinkedIn"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <LinkedInIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GitHub"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <GitHubIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Portfolio"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <LanguageIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Premium Access Section */}
          <Card sx={{ mb: 4, border: `2px solid ${user?.hasUnlimitedAccess ? theme.palette.success.main : theme.palette.warning.main}` }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <VpnKeyIcon sx={{ color: user?.hasUnlimitedAccess ? 'success.main' : 'warning.main', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: user?.hasUnlimitedAccess ? 'success.main' : 'warning.main' }}>
                  {user?.hasUnlimitedAccess ? '🎉 Premium Access Active' : '🔑 Premium Access Key'}
                </Typography>
              </Box>
              
              <Alert 
                severity={user?.hasUnlimitedAccess ? 'success' : 'warning'}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {user?.hasUnlimitedAccess 
                  ? 'You have unlimited CV generation access! Create as many cover letters as you need.' 
                  : `You have used ${user?.generationCount || 0}/3 free generations. Enter your access key to unlock unlimited CV generation.`
                }
              </Alert>
              
              {!user?.hasUnlimitedAccess && (
                <TextField
                  fullWidth
                  label="Access Key"
                  name="accessKey"
                  value={formData.accessKey}
                  onChange={handleInputChange}
                  placeholder="Enter your premium access key"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              )}
            </CardContent>
          </Card>

          {/* Resume Section */}
          <Card sx={{ border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <UploadFileIcon sx={{ color: 'primary.main', mr: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Resume Upload
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<UploadFileIcon />}
                  disabled={resumeLoading}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    borderWidth: '2px',
                    '&:hover': {
                      borderWidth: '2px',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  {resumeLoading ? 'Uploading...' : (user?.resumeData ? 'Replace Resume' : 'Upload Resume')}
                </Button>
                {user?.resumeData && !resumeLoading && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Resume uploaded successfully
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>

          {snackbar.open && (
            <Alert severity={snackbar.severity} sx={{ mt: 3, borderRadius: 2 }}>
              {snackbar.message}
            </Alert>
          )}
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 2, background: 'rgba(248, 250, 252, 0.5)' }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            borderRadius: 2, 
            px: 4, 
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          Cancel
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
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.25)',
            }
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog; 