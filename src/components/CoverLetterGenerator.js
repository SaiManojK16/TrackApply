/**
 * Cover Letter Generator Component
 * 
 * This component follows standardized formatting rules:
 * 
 * 📄 STRUCTURE:
 * - Header: Name (12px, bold), Contact Info (12px, normal), Date (12px)
 * - Company Info: Company Name (12px, normal)
 * - Subject: "Application for [Position]" (12px, bold)
 * - Greeting: "Dear Hiring Manager," (12px, normal)
 * - Body: 2-3 paragraphs (12px, normal, 80-100 words each)
 * - Closing: "Sincerely," (12px, normal) + Signature (12px, normal)
 * 
 * ✒️ CONTENT RULES:
 * - Max 3 paragraphs
 * - No custom headers
 * - Simple • bullet points only (max 3 total)
 * - Professional tone, first person
 * - Portfolio shown as domain only (e.g., "saimanojkartala.space")
 * - No LinkedIn/GitHub labels
 * 
 * 🎨 STYLING RULES:
 * - Font: Times New Roman (HTML), Helvetica (PDF)
 * - Size: 12px throughout (except name and subject are bold)
 * - Layout: Single-column, left-aligned
 * - Colors: Black/dark gray only
 * - No images, logos, or visual elements
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Snackbar,
  alpha,
  useTheme
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Work as WorkIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import axios from 'axios';

const placeholderAvatar = 'https://www.w3schools.com/howto/img_avatar.png';

const CoverLetterGenerator = ({ user, onUserUpdate }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resumeFile: null,
    resumeText: '',
    userInstructions: '',
  });
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [showLatex, setShowLatex] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const fileInputRef = useRef(null);

  const theme = useTheme();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, resumeFile: file, resumeText: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const requestData = {
        ...formData,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          resumeData: user.resumeData
        } : null
      };

      const response = await axios.post('/api/generate-cover-letter', requestData);
      
      if (response.data.coverLetterLatex) {
        setCoverLetter(response.data.coverLetterLatex);
        
        // Generate PDF preview
        await generatePdfPreview(response.data.coverLetterLatex);
        
        setSnackbar({ open: true, message: 'Cover letter generated successfully!', severity: 'success' });
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

  const generatePdfPreview = async (latexContent) => {
    try {
      const response = await axios.post('https://latex-pdf-api-production.up.railway.app/compile', {
        latex: latexContent,
        filename: 'cover-letter'
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (error) {
      console.error('PDF preview generation failed:', error);
      // Don't show error for preview generation
    }
  };

  const handleDownload = async () => {
    if (!coverLetter) {
      setSnackbar({ open: true, message: 'No cover letter to download', severity: 'error' });
      return;
    }

    try {
      // Send LaTeX to Railway API for PDF generation
      const response = await axios.post('https://latex-pdf-api-production.up.railway.app/compile', {
        latex: coverLetter,
        filename: 'cover-letter'
      }, {
        responseType: 'blob'
      });

      // Trigger download
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cover-letter-${formData.companyName || 'company'}-${formData.jobTitle || 'position'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: 'PDF generated and downloaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('PDF generation error:', error);
      setSnackbar({ open: true, message: 'Failed to generate PDF', severity: 'error' });
    }
  };

  const handleDownloadMenuOpen = (event) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const handleDownloadFormat = async (format) => {
    setDownloadMenuAnchor(null);
    
    if (format === 'pdf') {
      await handleDownload();
    }
  };

  // Function to extract and format text from LaTeX for preview
  const extractTextFromLatex = (latexContent) => {
    if (!latexContent) return '';
    
    let text = latexContent;
    
    // Remove LaTeX document structure and packages
    text = text.replace(/\\documentclass[^}]*}/g, '');
    text = text.replace(/\\usepackage[^}]*}/g, '');
    text = text.replace(/\\begin\{document\}/g, '');
    text = text.replace(/\\end\{document\}/g, '');
    text = text.replace(/\\[a-zA-Z]+\[[^\]]*\]/g, '');
    
    // Extract name (first \textbf{} after % Personal Information)
    const nameMatch = text.match(/\\textbf\{([^}]*)\}/);
    const name = nameMatch ? nameMatch[1] : '';
    
    // Extract email (look for email pattern)
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : '';
    
    // Extract phone (look for phone pattern)
    const phoneMatch = text.match(/(\d{10,})/);
    const phone = phoneMatch ? phoneMatch[1] : '';
    
    // Extract LinkedIn, GitHub, Portfolio links - only show link text, not URLs
    const linkedinMatch = text.match(/LinkedIn:\s*\\href\{([^}]*)\}\{([^}]*)\}/);
    const linkedin = linkedinMatch ? linkedinMatch[2] : '';
    
    const githubMatch = text.match(/GitHub:\s*\\href\{([^}]*)\}\{([^}]*)\}/);
    const github = githubMatch ? githubMatch[2] : '';
    
    const portfolioMatch = text.match(/Portfolio:\s*\\href\{([^}]*)\}\{([^}]*)\}/);
    const portfolio = portfolioMatch ? portfolioMatch[2] : '';
    
    // Extract date
    const dateMatch = text.match(/([A-Za-z]+ \d{1,2}, \d{4})/);
    const date = dateMatch ? dateMatch[1] : '';
    
    // Extract company (look for company after date)
    const companyMatch = text.match(/\\textbf\{([^}]*)\}\s*\\textbf\{([^}]*)\}/);
    const company = companyMatch ? companyMatch[2] : '';
    
    // Extract subject
    const subjectMatch = text.match(/\\textbf\{Subject: ([^}]*)\}/);
    const subject = subjectMatch ? subjectMatch[1] : '';
    
    // Extract greeting
    const greetingMatch = text.match(/Dear ([^,]+),/);
    const greeting = greetingMatch ? `Dear ${greetingMatch[1]},` : 'Dear Hiring Manager,';
    
    // Extract body content (everything between greeting and closing)
    const bodyStart = text.indexOf(greeting) + greeting.length;
    const closingStart = text.indexOf('Sincerely,');
    let body = '';
    
    if (bodyStart > 0 && closingStart > bodyStart) {
      body = text.substring(bodyStart, closingStart);
    } else {
      // Fallback: extract everything after greeting
      body = text.substring(bodyStart);
    }
    
    // Clean up body text
    body = body
      .replace(/\\textbf\{([^}]*)\}/g, '$1')
      .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
      .replace(/\\\\/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim();
    
    // Build formatted preview with proper line breaks and no tab spaces
    let formattedPreview = '';
    
    // Header with name in bold
    if (name) {
      formattedPreview += `**${name}**\n`;
    }
    
    // Contact information - each on separate line, no tab spaces
    if (email) formattedPreview += `${email}\n`;
    if (phone) formattedPreview += `${phone}\n`;
    if (linkedin) formattedPreview += `LinkedIn: [LinkedIn](${linkedin})\n`;
    if (github) formattedPreview += `GitHub: [GitHub](${github})\n`;
    if (portfolio) formattedPreview += `Portfolio: [Portfolio](${portfolio})\n`;
    
    // Add spacing after contact info
    formattedPreview += '\n';
    
    // Date
    if (date) {
      formattedPreview += `${date}\n\n`;
    }
    
    // Company info - each on separate line, no tab spaces
    if (company) {
      formattedPreview += `Hiring Manager\n${company}\n\n`;
    }
    
    // Subject in bold
    if (subject) {
      formattedPreview += `**Subject: ${subject}**\n\n`;
    }
    
    // Greeting
    formattedPreview += `${greeting}\n\n`;
    
    // Body
    formattedPreview += `${body}\n\n`;
    
    // Closing with name on separate line, no tab spaces
    formattedPreview += `Sincerely,\n${name}`;
    
    return formattedPreview;
  };

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            mb: 3,
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.25)',
          }}>
            <DescriptionIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
            AI Cover Letter Generator
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Create professional, personalized cover letters in seconds with our advanced AI technology
          </Typography>
          
          {/* Generation Counter for non-premium users */}
          {user && !user.hasUnlimitedAccess && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Chip 
                label={`${user.generationCount || 0}/3 Free Generations Used`}
                color={user.generationCount >= 2 ? 'warning' : 'info'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* Form Section */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <CardContent sx={{ p: 4 }}>
                <form onSubmit={handleSubmit}>
                  {/* Job Information Section */}
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        backgroundColor: '#fef3c7',
                        mr: 2
                      }}>
                        <WorkIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
                      </Box>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                          Job Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tell us about the position you're applying for
                        </Typography>
                      </Box>
                    </Box>
                    
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
                          placeholder="e.g. Senior Software Engineer"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              backgroundColor: '#f8fafc',
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
                              backgroundColor: '#f8fafc',
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                          Job Description *
                        </Typography>
                        <TextField
                          fullWidth
                          name="jobDescription"
                          value={formData.jobDescription}
                          onChange={handleInputChange}
                          required
                          multiline
                          rows={4}
                          placeholder="Paste the complete job description here..."
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 3,
                              backgroundColor: '#f8fafc',
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Resume Section - Only show if user doesn't have resume data */}
                  {!user?.resumeData && (
                    <>
                      <Divider sx={{ my: 4 }}>
                        <Chip label="Resume Information" sx={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontWeight: 600 }} />
                      </Divider>
                      
                      <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            backgroundColor: '#f0fdf4',
                            mr: 2
                          }}>
                            <CloudUploadIcon sx={{ fontSize: 24, color: '#22c55e' }} />
                          </Box>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                              Upload Resume
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Upload your resume or paste the content below
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3 }}>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                          />
                          <Box 
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              border: '2px dashed #d1d5db',
                              borderRadius: 3,
                              p: 3,
                              textAlign: 'center',
                              cursor: 'pointer',
                              backgroundColor: '#f9fafb',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: '#3b82f6',
                                backgroundColor: '#eff6ff',
                              }
                            }}
                          >
                            {formData.resumeFile ? (
                              <Box>
                                <CheckCircleIcon sx={{ fontSize: 32, color: '#22c55e', mb: 1 }} />
                                <Typography variant="body1" sx={{ color: '#22c55e', fontWeight: 600 }}>
                                  {formData.resumeFile.name}
                                </Typography>
                              </Box>
                            ) : (
                              <Box>
                                <CloudUploadIcon sx={{ fontSize: 32, color: '#9ca3af', mb: 1 }} />
                                <Typography variant="body1" sx={{ color: '#374151', fontWeight: 600, mb: 1 }}>
                                  Click to upload resume
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  PDF, DOC, DOCX supported
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }}>
                          <Chip label="OR" size="small" sx={{ backgroundColor: '#f3f4f6', color: '#6b7280' }} />
                        </Divider>
                        
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                            Paste Resume Text
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={6}
                            placeholder="Paste your resume content here..."
                            name="resumeText"
                            value={formData.resumeText}
                            onChange={handleInputChange}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: '#f8fafc',
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    </>
                  )}

                  {/* Additional Instructions */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                      Additional Instructions (Optional)
                    </Typography>
                    <TextField
                      fullWidth
                      name="userInstructions"
                      value={formData.userInstructions}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                      placeholder="Any specific requirements or points to highlight..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          backgroundColor: '#f8fafc',
                        }
                      }}
                    />
                  </Box>

                  {/* Error Display */}
                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      size="large"
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.25)',
                        }
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
                          Generating...
                        </>
                      ) : (
                        'Generate Cover Letter'
                      )}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview Section */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ borderRadius: 4, border: '1px solid #e5e7eb', boxShadow: 'none', height: 'fit-content' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                      Preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your generated cover letter will appear here
                    </Typography>
                  </Box>
                </Box>

                {coverLetter ? (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setShowLatex(false);
                          setShowPdfPreview(false);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        Text Preview
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setShowLatex(false);
                          setShowPdfPreview(true);
                        }}
                        startIcon={<VisibilityIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        PDF Preview
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setShowLatex(true);
                          setShowPdfPreview(false);
                        }}
                        startIcon={<CodeIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        View LaTeX
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleDownload}
                        sx={{ borderRadius: 2 }}
                      >
                        Download PDF
                      </Button>
                    </Box>
                    
                    {showLatex ? (
                      <Box sx={{
                        backgroundColor: '#1e293b',
                        borderRadius: 2,
                        p: 3,
                        maxHeight: '600px',
                        overflow: 'auto',
                      }}>
                        <pre style={{
                          color: '#e2e8f0',
                          fontSize: '12px',
                          lineHeight: 1.5,
                          margin: 0,
                          fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                        }}>
                          {coverLetter}
                        </pre>
                      </Box>
                    ) : showPdfPreview && pdfPreviewUrl ? (
                      <Box sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        height: '600px',
                        overflow: 'hidden'
                      }}>
                        <iframe
                          src={pdfPreviewUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 'none' }}
                          title="PDF Preview"
                        />
                      </Box>
                    ) : (
                      <Box sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        '& a': {
                          color: '#3b82f6',
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        },
                        '& strong': {
                          fontWeight: 'bold'
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: extractTextFromLatex(coverLetter)
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                      }}
                      />
                    )}
                  </Box>
                ) : (
                  <Box sx={{
                    border: '2px dashed #d1d5db',
                    borderRadius: 2,
                    p: 6,
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    <DescriptionIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#6b7280', fontWeight: 600, mb: 1 }}>
                      No cover letter generated yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fill out the form and click "Generate Cover Letter" to see your personalized cover letter here
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
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

export default CoverLetterGenerator; 