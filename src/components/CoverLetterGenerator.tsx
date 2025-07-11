'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  Alert,
  useTheme,
  alpha,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material';
import { 
  Description as DescriptionIcon,
  Upload as UploadFileIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  PictureAsPdf as PdfIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Snackbar as MuiSnackbar, Alert as MuiAlert } from '@mui/material';
import axios from 'axios';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Document, Page, pdfjs } from 'react-pdf';
import { LetterTemplate } from './LetterTemplate';

// Set up PDF.js worker - disable worker for now to avoid CDN issues
pdfjs.GlobalWorkerOptions.workerSrc = '';

interface FormData {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumeFile: File | null;
  resumeText: string;
  userInstructions: string;
}

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  resumeData?: any;
  generationCount?: number;
  hasUnlimitedAccess?: boolean;
}

interface CoverLetterGeneratorProps {
  user?: User | null;
  onUserUpdate?: (user: User) => void;
}

const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({ user, onUserUpdate }) => {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resumeFile: null,
    resumeText: '',
    userInstructions: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState<string>('');
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfError, setPdfError] = useState<string>('');
  const [showLatex, setShowLatex] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, resumeFile: file, resumeText: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        
        // Automatically generate PDF preview
        try {
          const pdfResponse = await axios.post('https://latex-pdf-api-production.up.railway.app/compile', {
            latex: response.data.coverLetterLatex,
            filename: 'cover-letter'
          }, {
            responseType: 'blob'
          });
          
          const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
          setPdfBlob(blob);
        } catch (error) {
          console.error('PDF preview generation failed:', error);
          // Don't show error for preview generation
        }
        
        // Increment generation count for users without unlimited access
        if (user && !user.hasUnlimitedAccess) {
          const updatedUser = { 
            ...user, 
            generationCount: (user.generationCount || 0) + 1 
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          if (onUserUpdate) onUserUpdate(updatedUser);
        }
        
        setSnackbar({ open: true, message: 'Cover letter generated successfully!', severity: 'success' });
      } else {
        setError(response.data.error || 'Failed to generate cover letter');
      }
    } catch (error: any) {
      console.error('Error generating cover letter:', error);
      setError(error.response?.data?.error || 'Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (coverLetter) {
      try {
        setPdfLoading(true);
        
        // Send LaTeX to Railway PDF API
        const response = await axios.post('https://latex-pdf-api-production.up.railway.app/compile', {
          latex: coverLetter,
          filename: `cover-letter-${formData.companyName || 'document'}`
        }, {
          responseType: 'blob' // Important: get the PDF as a blob
        });
        
        // Create download link
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cover-letter-${formData.companyName || 'document'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSnackbar({
          open: true,
          message: 'Cover letter downloaded successfully!',
          severity: 'success'
        });
      } catch (error: any) {
        console.error('Download failed:', error);
        setSnackbar({
          open: true,
          message: 'Failed to download cover letter',
          severity: 'error'
        });
      } finally {
        setPdfLoading(false);
      }
    }
  };

  const handleReset = () => {
    setFormData({
      companyName: '',
      jobTitle: '',
      jobDescription: '',
      resumeFile: null,
      resumeText: '',
      userInstructions: '',
    });
    setCoverLetter('');
    setPreviewUrl('');
    setError('');
    setShowLatex(false);
  };

  // Function to create a simple HTML preview from LaTeX (for display only)
  const createSimplePreview = (latexContent: string) => {
    if (!latexContent) return '';
    
    // Extract content from LaTeX template
    let text = latexContent;
    
    // Remove LaTeX document structure and packages
    text = text.replace(/\\documentclass[^}]*}/g, '');
    text = text.replace(/\\usepackage[^}]*}/g, '');
    text = text.replace(/\\begin\{document\}/g, '');
    text = text.replace(/\\end\{document\}/g, '');
    
    // Replace LaTeX placeholders with actual content
    text = text.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
    text = text.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, '<a href="$1" target="_blank" style="color: #3b82f6; text-decoration: underline;">$2</a>');
    text = text.replace(/\\href\{([^}]*)\}/g, '<a href="$1" target="_blank" style="color: #3b82f6; text-decoration: underline;">$1</a>');
    
    // Handle line breaks and spacing
    text = text.replace(/\\vspace\{[^}]*\}/g, '<br><br>');
    text = text.replace(/\\\\/g, '<br>');
    text = text.replace(/\\\\(?!\\)/g, '<br>');
    
    // Remove other LaTeX commands
    text = text.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '');
    text = text.replace(/\\[a-zA-Z]+/g, '');
    
    // Clean up braces and extra spaces
    text = text.replace(/[{}]/g, '');
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/<br>\s*<br>/g, '<br><br>');
    text = text.trim();
    
    // Split into lines and format
    const lines = text.split('\n');
    const formattedLines = lines.map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine === '') return '<br>';
      if (trimmedLine.startsWith('%')) return ''; // Remove LaTeX comments
      return `<div style="margin-bottom: 8px;">${trimmedLine}</div>`;
    });
    
    return formattedLines.join('');
  };

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
                color={user.generationCount && user.generationCount >= 2 ? 'warning' : 'info'}
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
                    
                    {coverLetter && (
                      <Button
                        variant="outlined"
                        onClick={handleReset}
                        size="large"
                        sx={{
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          fontWeight: 600,
                          borderWidth: 2,
                          '&:hover': {
                            borderWidth: 2,
                          }
                        }}
                      >
                        Start Over
                      </Button>
                    )}
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
                  
                  {coverLetter && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowLatex(!showLatex)}
                        startIcon={showLatex ? <VisibilityIcon /> : <CodeIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        {showLatex ? 'View PDF' : 'View Code'}
                      </Button>
                      {coverLetter && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleDownload}
                          startIcon={<DownloadIcon />}
                          sx={{ borderRadius: 2 }}
                        >
                          Download
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>

                {coverLetter ? (
                  <Box>
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
                    ) : (
                      <Box sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 2,
                        overflow: 'hidden',
                        backgroundColor: '#f8fafc'
                      }}>
                        {pdfLoading ? (
                          <Box sx={{ p: 4, textAlign: 'center' }}>
                            <CircularProgress size={40} sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                              Generating PDF preview...
                            </Typography>
                          </Box>
                        ) : pdfBlob ? (
                          <Box sx={{
                            p: 2,
                            minHeight: '400px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <Document
                              file={pdfBlob}
                              onLoadError={(error) => {
                                console.error('PDF load error:', error);
                                setPdfError('Failed to load PDF preview. Showing text preview instead.');
                                setPdfBlob(null); // Fallback to text preview
                              }}
                              onLoadSuccess={() => {
                                setPdfError(''); // Clear any previous errors
                              }}
                              loading={
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                  <CircularProgress />
                                </Box>
                              }
                            >
                              <Page
                                pageNumber={1}
                                width={400}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />
                            </Document>
                          </Box>
                        ) : (
                          <Box sx={{
                            p: 3,
                            minHeight: '400px',
                            fontFamily: 'Times New Roman, serif',
                            fontSize: '14px',
                            lineHeight: 1.6
                          }}
                          dangerouslySetInnerHTML={{ __html: createSimplePreview(coverLetter) }}
                          />
                        )}
                        
                        {pdfError && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            {pdfError}
                          </Alert>
                        )}
                      </Box>
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
      <MuiSnackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </MuiSnackbar>
    </Box>
  );
};

export default CoverLetterGenerator; 