import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const Header = ({ 
  user, 
  currentPage, 
  setCurrentPage, 
  anchorEl, 
  handleMenuOpen, 
  handleMenuClose, 
  handleProfileClick, 
  handleLogout, 
  setShowAuth 
}) => {
  const theme = useTheme();

  const navigationItems = [
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'generator', label: 'CV Generator', icon: <DescriptionIcon /> },
    { id: 'tracking', label: 'Job Tracker', icon: <WorkIcon /> },
  ];

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        position: 'relative',
        zIndex: 1,
        minHeight: '64px'
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 }, py: 0.5, minHeight: '64px' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            mr: 4
          }}
          onClick={() => setCurrentPage('home')}
        >
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '10px',
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            mr: 2
          }}>
            <DescriptionIcon sx={{ fontSize: 20, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px' }}>
            Cover Letter Generator
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              color="inherit"
              onClick={() => setCurrentPage(item.id)}
              startIcon={item.icon}
              sx={{
                backgroundColor: currentPage === item.id ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                borderRadius: '10px',
                textTransform: 'none',
                px: 2,
                py: 0.5,
                color: currentPage === item.id ? 'primary.main' : 'text.primary',
                fontWeight: currentPage === item.id ? 600 : 500,
                transition: 'all 0.2s ease-in-out',
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
        
        {user ? (
          <>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
              sx={{ 
                borderRadius: '10px',
                color: 'text.primary',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }
              }}
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: '16px',
                  mt: 1,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden'
                }
              }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ py: 2, px: 3 }}>
                <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography fontWeight={500}>Profile</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 2, px: 3 }}>
                <LogoutIcon sx={{ mr: 2, color: 'error.main' }} />
                <Typography fontWeight={500}>Logout</Typography>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            color="inherit"
            onClick={() => setShowAuth(true)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
              py: 1,
              color: 'text.primary',
              border: '1px solid',
              borderColor: 'divider',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: 'primary.main',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }
            }}
          >
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 