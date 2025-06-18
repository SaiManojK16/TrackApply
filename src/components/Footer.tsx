import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  IconButton,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1e293b',
        color: 'white',
        py: 6,
        mt: 8,
        borderTop: '1px solid #334155',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                mr: 2
              }}>
                <DescriptionIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                TrackApply
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.6 }}>
              AI-powered cover letter generation and job application tracking. 
              Streamline your job search and land your dream position faster.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                component="a"
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#94a3b8',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    color: 'white',
                    backgroundColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#94a3b8',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    color: 'white',
                    backgroundColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#94a3b8',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    color: 'white',
                    backgroundColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <GitHubIcon />
              </IconButton>
              <IconButton
                component="a"
                href="mailto:support@trackapply.com"
                sx={{
                  color: '#94a3b8',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    color: 'white',
                    backgroundColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <EmailIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Product Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Product
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Cover Letter Generator
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Job Tracker
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Resume Builder
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Interview Prep
              </Link>
            </Box>
          </Grid>

          {/* Resources Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Resources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Blog
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Career Tips
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Templates
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Help Center
              </Link>
            </Box>
          </Grid>

          {/* Company Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                About Us
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Careers
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Contact
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Press
              </Link>
            </Box>
          </Grid>

          {/* Legal Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                Cookie Policy
              </Link>
              <Link
                href="#"
                sx={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: 'white',
                    textDecoration: 'underline',
                  },
                }}
              >
                GDPR
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: '#334155' }} />

        {/* Copyright */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            © {new Date().getFullYear()} TrackApply. All rights reserved.
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Made with ❤️ for job seekers worldwide
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 