import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
  Stack,
  Chip,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  AutoAwesome as AutoAwesomeIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import Footer from './Footer';

const LandingPage = ({ onGetStarted }) => {
  const theme = useTheme();

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'AI-Powered Generation',
      description: 'Advanced AI analyzes your resume and job requirements to create personalized, compelling cover letters.',
      color: theme.palette.primary.main,
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Lightning Fast',
      description: 'Generate professional cover letters in seconds, not hours. Save time and apply to more jobs.',
      color: theme.palette.success.main,
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Professional Quality',
      description: 'LaTeX-powered formatting ensures your cover letters look polished and professional.',
      color: theme.palette.warning.main,
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Job Tracking',
      description: 'Keep track of your applications, interviews, and follow-ups all in one place.',
      color: theme.palette.secondary.main,
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '20px',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            mb: 4,
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          
          <Typography 
            variant="h1" 
            sx={{ 
              fontWeight: 800, 
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            TrackApply
          </Typography>
          
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600, 
              mb: 3,
              color: 'text.primary',
              letterSpacing: '-0.02em',
            }}
          >
            AI-Powered Cover Letters & Job Tracking
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              mb: 4, 
              maxWidth: 600, 
              mx: 'auto',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Create professional, personalized cover letters in seconds and manage your entire job search in one place. 
            Stand out from the competition and land your dream job.
          </Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={onGetStarted}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(59, 130, 246, 0.35)',
                },
              }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={onGetStarted}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '16px',
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              View Demo
            </Button>
          </Stack>
          
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Free to start" 
              color="success" 
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            <Chip 
              icon={<CheckCircleIcon />} 
              label="No credit card required" 
              color="success" 
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Instant results" 
              color="success" 
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          </Stack>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography 
            variant="h2" 
            sx={{ 
              textAlign: 'center', 
              mb: 2,
              fontWeight: 700,
              color: 'text.primary'
            }}
          >
            Why Choose TrackApply?
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              textAlign: 'center', 
              mb: 6,
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 400,
            }}
          >
            Powerful features designed to help you create outstanding cover letters and manage your job search effectively.
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ 
                  height: '100%',
                  p: 3,
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
                  }
                }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: 64,
                      height: 64,
                      borderRadius: '16px',
                      backgroundColor: alpha(feature.color, 0.1),
                      mb: 3
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box sx={{ 
          textAlign: 'center',
          p: 6,
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.2),
        }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Join thousands of job seekers who have already transformed their application process with TrackApply.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={onGetStarted}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 600,
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(59, 130, 246, 0.35)',
              },
            }}
          >
            Start Creating Now
          </Button>
        </Box>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default LandingPage; 