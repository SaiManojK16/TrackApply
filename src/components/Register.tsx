import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Paper,
  Grid,
  useTheme,
  alpha,
  IconButton,
  InputAdornment
} from '@mui/material';
import { PersonAdd as PersonAddIcon, CheckCircle as CheckCircleIcon, Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import axios from 'axios';

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const theme = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', formData);
      onRegister(response.data.user, response.data.token);
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(circle at 25% 25%, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)`,
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Left Side - Welcome */}
      <Box sx={{ 
        flex: 1, 
        display: { xs: 'none', md: 'flex' }, 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <Box sx={{ 
          textAlign: 'center', 
          maxWidth: 500,
          p: 6
        }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '20px',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            mb: 4
          }}>
            <PersonAddIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          <Typography variant="h3" sx={{ 
            fontWeight: 700, 
            color: 'text.primary',
            mb: 3,
            letterSpacing: '-1px'
          }}>
            Join Us Today
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ 
            fontWeight: 400,
            lineHeight: 1.6,
            mb: 4
          }}>
            Create your account in seconds and start building professional cover letters. You can complete your profile with additional details later.
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Free to Start
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Secure & Private
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Instant Access
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Side - Register Form */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: { xs: 3, md: 6 },
        position: 'relative',
        zIndex: 1
      }}>
        <Paper elevation={0} sx={{ 
          width: '100%', 
          maxWidth: 500,
          borderRadius: '24px',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ 
            p: 5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: 1,
                letterSpacing: '-0.5px'
              }}>
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                Fill in your details to get started
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  mt: 4,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    boxShadow: 'none',
                    transform: 'none'
                  }
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Already have an account?{' '}
                <Button
                  onClick={onSwitchToLogin}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'primary.main',
                    p: 0,
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Sign in here
                </Button>
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ 
                mt: 3, 
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'error.main'
              }}>
                {error}
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register; 