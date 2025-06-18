'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import axios from 'axios';
import { Description as DescriptionIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', formData);
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
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
          p: 4
        }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 70,
            height: 70,
            borderRadius: '18px',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            mb: 3
          }}>
            <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: 'text.primary',
            mb: 2,
            letterSpacing: '-0.5px'
          }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ 
            fontWeight: 400,
            lineHeight: 1.5,
            mb: 3
          }}>
            Sign in to your account to continue creating professional cover letters and tracking your job applications.
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                AI-Powered Cover Letters
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Job Application Tracker
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Professional Templates
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
        position: 'relative',
        zIndex: 1
      }}>
        <Paper elevation={0} sx={{ 
          width: '100%', 
          maxWidth: 400,
          borderRadius: '20px',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ 
            p: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
          }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: 1,
                letterSpacing: '-0.5px'
              }}>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Enter your credentials to access your account
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
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
                  mb: 2,
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
              <TextField
                fullWidth
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                size="small"
                sx={{ 
                  mb: 3,
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
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  borderRadius: '10px',
                  py: 1.2,
                  textTransform: 'none',
                  fontSize: '0.9rem',
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
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Don't have an account?{' '}
                <Button
                  onClick={onSwitchToRegister}
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
                  Sign up here
                </Button>
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ 
                mt: 2, 
                borderRadius: '10px',
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

export default Login; 