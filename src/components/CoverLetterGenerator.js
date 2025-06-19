'use client';

import React, { useState, useRef } from 'react';
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
  Business as BusinessIcon
} from '@mui/icons-material';
import { Snackbar, Alert as MuiAlert } from '@mui/material';
import axios from 'axios';
import jsPDF from 'jspdf';

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
  const [previewUrl, setPreviewUrl] = useState('');
  const [formattedPreview, setFormattedPreview] = useState('');
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showLatex, setShowLatex] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const theme = useTheme();
  const fileInputRef = useRef(null);

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
    
    // Check generation limit for users without unlimited access
    if (user && !user.hasUnlimitedAccess) {
      const generationCount = user.generationCount || 0;
      if (generationCount >= 3) {
        setError('You have reached the free generation limit (3/3). Please enter your access key in the Profile section to continue generating cover letters.');
        return;
      }
    }

    // Validate required fields
    if (!formData.jobTitle || !formData.companyName || !formData.jobDescription) {
      setError('Please fill in all required job information fields.');
      return;
    }

    // Check if user has resume data or provided resume
    if (!user?.resumeData && !formData.resumeFile && !formData.resumeText) {
      setError('Please upload a resume or paste resume text, or complete your profile with resume information.');
      return;
    }

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
      
      console.log('Cover letter response:', response.data);
      
      if (response.data.coverLetterLatex) {
        setCoverLetter(response.data.coverLetterLatex);
        console.log('Cover letter set:', response.data.coverLetterLatex.substring(0, 200) + '...');
        
        // Increment generation count for users without unlimited access
        if (user && !user.hasUnlimitedAccess) {
          const updatedUser = { 
            ...user, 
            generationCount: (user.generationCount || 0) + 1 
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          if (onUserUpdate) onUserUpdate(updatedUser);
        }
        
        // Generate PDF preview
        try {
          setPdfLoading(true);
          
          // Generate formatted preview from LaTeX content
          const previewHTML = generatePreviewFromLatex(response.data.coverLetterLatex);
          setFormattedPreview(previewHTML);
          
          // Also generate PDF for download
          const pdfUrl = generatePDFFromLatex(response.data.coverLetterLatex);
          
          if (pdfUrl) {
            setPreviewUrl(pdfUrl);
            console.log('PDF preview generated successfully');
          } else {
            console.warn('PDF generation failed, but preview is available');
          }
        } catch (pdfError) {
          console.error('Preview generation failed:', pdfError);
          setError('Failed to generate preview');
        } finally {
          setPdfLoading(false);
        }
      } else {
        console.error('No coverLetterLatex in response:', response.data);
        setError(response.data.error || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setError(error.response?.data?.error || 'Failed to generate cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (coverLetter) {
      try {
        // Generate PDF from LaTeX content
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - (2 * margin);
        
        // Extract text content from LaTeX
        let text = coverLetter
          .replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '')
          .replace(/\\end\{document\}/g, '')
          .replace(/\\usepackage[^}]*/g, '')
          .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
          .replace(/\\[a-zA-Z]+/g, '')
          .replace(/[{}]/g, '')
          .replace(/\\\\(?!\\)/g, '\n')
          .replace(/\\\\/g, '\n')
          .replace(/\\vspace\{[^}]*\}/g, '\n\n')
          .replace(/\\textbf\{([^}]*)\}/g, '$1')
          .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
          .replace(/\\href\{([^}]*)\}/g, '$1')
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n\n')
          .trim();
        
        // Set font
        pdf.setFont('helvetica');
        pdf.setFontSize(12);
        
        // Split text into lines
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        let yPosition = 30;
        const lineHeight = 7;
        
        // Add content to PDF
        for (let i = 0; i < lines.length; i++) {
          if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(lines[i], margin, yPosition);
          yPosition += lineHeight;
        }
        
        // Download the PDF
        const filename = `cover-letter-${formData.companyName || 'document'}.pdf`;
        pdf.save(filename);
        
        setSnackbar({
          open: true,
          message: 'Cover letter downloaded successfully!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Download failed:', error);
        setSnackbar({
          open: true,
          message: 'Failed to download cover letter',
          severity: 'error'
        });
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
    setFormattedPreview('');
    setError('');
    setShowLatex(false);
  };

  // Function to convert LaTeX content to PDF
  const generatePDFFromLatex = (latexContent) => {
    try {
      console.log('=== PDF GENERATION START ===');
      console.log('Original LaTeX content length:', latexContent.length);
      console.log('Original LaTeX content (first 500 chars):', latexContent.substring(0, 500));
      
      // Extract and clean text content from LaTeX with better parsing
      let text = latexContent
        // Remove LaTeX document structure
        .replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        // Remove package imports
        .replace(/\\usepackage[^}]*/g, '')
        // Remove LaTeX commands with braces but keep content
        .replace(/\\textbf\{([^}]*)\}/g, '$1')
        .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
        .replace(/\\href\{([^}]*)\}/g, '$1')
        // Remove other LaTeX commands
        .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
        .replace(/\\[a-zA-Z]+/g, '')
        // Remove special LaTeX characters
        .replace(/[{}]/g, '')
        .replace(/\\\\(?!\\)/g, '\n')
        .replace(/\\\\/g, '\n')
        .replace(/\\vspace\{[^}]*\}/g, '\n\n')
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      console.log('Cleaned text length:', text.length);
      console.log('Cleaned text (first 500 chars):', text.substring(0, 500));

      // Check if text is empty after cleaning
      if (!text || text.trim() === '') {
        console.error('No text content found after LaTeX cleaning');
        return null;
      }

      // Parse the content into structured sections
      const sections = parseCoverLetterSections(text);
      console.log('Parsed sections:', sections);
      
      // Create PDF with proper formatting
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (2 * margin);
      
      let yPosition = 30;
      const lineHeight = 7;
      
      // Add personal information
      if (sections.personalInfo) {
        console.log('Adding personal info:', sections.personalInfo);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const nameLines = pdf.splitTextToSize(sections.personalInfo.name || '', maxWidth);
        for (let line of nameLines) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const contactLines = [
          sections.personalInfo.email,
          sections.personalInfo.phone,
          sections.personalInfo.linkedin,
          sections.personalInfo.github,
          sections.personalInfo.portfolio
        ].filter(Boolean);
        
        for (let line of contactLines) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        
        yPosition += lineHeight * 2;
      }
      
      // Add date
      if (sections.date) {
        console.log('Adding date:', sections.date);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(sections.date, margin, yPosition);
        yPosition += lineHeight * 2;
      }
      
      // Add hiring manager and company
      if (sections.hiringManager || sections.company) {
        console.log('Adding hiring manager/company:', { hiringManager: sections.hiringManager, company: sections.company });
        const managerCompany = [sections.hiringManager, sections.company].filter(Boolean).join('\n');
        const lines = pdf.splitTextToSize(managerCompany, maxWidth);
        for (let line of lines) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight * 2;
      }
      
      // Add subject
      if (sections.subject) {
        console.log('Adding subject:', sections.subject);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const subjectLines = pdf.splitTextToSize(sections.subject, maxWidth);
        for (let line of subjectLines) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight * 2;
      }
      
      // Add greeting
      if (sections.greeting) {
        console.log('Adding greeting:', sections.greeting);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(sections.greeting, margin, yPosition);
        yPosition += lineHeight * 2;
      }
      
      // Add body
      if (sections.body) {
        console.log('Adding body (first 100 chars):', sections.body.substring(0, 100));
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const bodyLines = pdf.splitTextToSize(sections.body, maxWidth);
        for (let line of bodyLines) {
          if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight * 2;
      }
      
      // Add closing
      if (sections.closing) {
        console.log('Adding closing:', sections.closing);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const closingLines = pdf.splitTextToSize(sections.closing, maxWidth);
        for (let line of closingLines) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
      }
      
      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      console.log('PDF generated successfully, URL:', pdfUrl);
      console.log('=== PDF GENERATION END ===');
      return pdfUrl;
    } catch (error) {
      console.error('Error generating PDF from LaTeX:', error);
      return null;
    }
  };

  // Helper function to parse cover letter sections
  const parseCoverLetterSections = (text) => {
    console.log('=== PARSING START ===');
    console.log('Input text length:', text.length);
    console.log('Input text (first 300 chars):', text.substring(0, 300));
    
    const sections = {};
    
    // Split text into lines
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    console.log('Total lines after filtering:', lines.length);
    console.log('First 10 lines:', lines.slice(0, 10));
    
    let currentSection = '';
    let currentContent = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip LaTeX comments
      if (line.startsWith('%')) {
        console.log(`Skipping comment line ${i}:`, line);
        continue;
      }
      
      // Detect sections
      if (line.includes('Personal Information') || line.includes('Name:')) {
        console.log(`Found Personal Information section at line ${i}:`, line);
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join(' ');
          console.log(`Saved section ${currentSection}:`, sections[currentSection]);
        }
        currentSection = 'personalInfo';
        currentContent = [];
        continue;
      }
      
      if (line.includes('Date')) {
        console.log(`Found Date section at line ${i}:`, line);
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join(' ');
          console.log(`Saved section ${currentSection}:`, sections[currentSection]);
        }
        currentSection = 'date';
        currentContent = [];
        continue;
      }
      
      if (line.includes('Hiring Manager')) {
        console.log(`Found Hiring Manager section at line ${i}:`, line);
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join(' ');
          console.log(`Saved section ${currentSection}:`, sections[currentSection]);
        }
        currentSection = 'hiringManager';
        currentContent = [];
        continue;
      }
      
      if (line.includes('Subject')) {
        console.log(`Found Subject section at line ${i}:`, line);
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join(' ');
          console.log(`Saved section ${currentSection}:`, sections[currentSection]);
        }
        currentSection = 'subject';
        currentContent = [];
        continue;
      }
      
      if (line.includes('Greeting') || line.includes('Dear')) {
        console.log(`Found Greeting section at line ${i}:`, line);
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join(' ');
          console.log(`Saved section ${currentSection}:`, sections[currentSection]);
        }
        currentSection = 'greeting';
        currentContent = [];
        continue;
      }
      
      if (line.includes('Body')) {
        console.log(`Found Body section at line ${i}:`, line);
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join(' ');
          console.log(`Saved section ${currentSection}:`, sections[currentSection]);
        }
        currentSection = 'body';
        currentContent = [];
        continue;
      }
      
      if (line.includes('Closing') || line.includes('Sincerely')) {
        console.log(`Found Closing section at line ${i}:`, line);
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join(' ');
          console.log(`Saved section ${currentSection}:`, sections[currentSection]);
        }
        currentSection = 'closing';
        currentContent = [];
        continue;
      }
      
      // Add content to current section
      if (currentSection) {
        currentContent.push(line);
      }
    }
    
    // Add the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join(' ');
      console.log(`Saved final section ${currentSection}:`, sections[currentSection]);
    }
    
    // Parse personal info into structured format
    if (sections.personalInfo) {
      console.log('Parsing personal info from:', sections.personalInfo);
      const personalInfoText = sections.personalInfo;
      sections.personalInfo = {
        name: personalInfoText.match(/([A-Za-z\s]+)/)?.[1]?.trim() || '',
        email: personalInfoText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || '',
        phone: personalInfoText.match(/\d{10,}/)?.[0] || '',
        linkedin: personalInfoText.match(/LinkedIn:\s*(https?:\/\/[^\s]+)/)?.[1] || '',
        github: personalInfoText.match(/GitHub:\s*(https?:\/\/[^\s]+)/)?.[1] || '',
        portfolio: personalInfoText.match(/Portfolio:\s*(https?:\/\/[^\s]+)/)?.[1] || ''
      };
      console.log('Parsed personal info:', sections.personalInfo);
    }
    
    console.log('Final parsed sections:', sections);
    console.log('=== PARSING END ===');
    return sections;
  };

  // Function to generate preview from LaTeX content
  const generatePreviewFromLatex = (latexContent) => {
    try {
      console.log('=== PREVIEW GENERATION START ===');
      console.log('Preview LaTeX content length:', latexContent.length);
      console.log('Preview LaTeX content (first 500 chars):', latexContent.substring(0, 500));
      
      // Extract and clean text content from LaTeX with better parsing
      let text = latexContent
        // Remove LaTeX document structure
        .replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '')
        .replace(/\\end\{document\}/g, '')
        // Remove package imports
        .replace(/\\usepackage[^}]*/g, '')
        // Remove LaTeX commands with braces but keep content
        .replace(/\\textbf\{([^}]*)\}/g, '$1')
        .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
        .replace(/\\href\{([^}]*)\}/g, '$1')
        // Remove other LaTeX commands
        .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
        .replace(/\\[a-zA-Z]+/g, '')
        // Remove special LaTeX characters
        .replace(/[{}]/g, '')
        .replace(/\\\\(?!\\)/g, '\n')
        .replace(/\\\\/g, '\n')
        .replace(/\\vspace\{[^}]*\}/g, '\n\n')
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      console.log('Preview cleaned text length:', text.length);
      console.log('Preview cleaned text (first 500 chars):', text.substring(0, 500));

      // Parse the content into structured sections
      const sections = parseCoverLetterSections(text);
      console.log('Preview parsed sections:', sections);
      
      // Generate formatted preview HTML
      let previewHTML = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6;">';
      
      // Add personal information
      if (sections.personalInfo) {
        console.log('Preview: Adding personal info:', sections.personalInfo);
        previewHTML += `<div style="margin-bottom: 20px;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${sections.personalInfo.name || ''}</div>
          <div style="font-size: 12px; color: #666;">`;
        
        if (sections.personalInfo.email) previewHTML += `<div>${sections.personalInfo.email}</div>`;
        if (sections.personalInfo.phone) previewHTML += `<div>${sections.personalInfo.phone}</div>`;
        if (sections.personalInfo.linkedin) previewHTML += `<div>LinkedIn: ${sections.personalInfo.linkedin}</div>`;
        if (sections.personalInfo.github) previewHTML += `<div>GitHub: ${sections.personalInfo.github}</div>`;
        if (sections.personalInfo.portfolio) previewHTML += `<div>Portfolio: ${sections.personalInfo.portfolio}</div>`;
        
        previewHTML += `</div></div>`;
      }
      
      // Add date
      if (sections.date) {
        console.log('Preview: Adding date:', sections.date);
        previewHTML += `<div style="margin-bottom: 20px; font-size: 12px;">${sections.date}</div>`;
      }
      
      // Add hiring manager and company
      if (sections.hiringManager || sections.company) {
        console.log('Preview: Adding hiring manager/company:', { hiringManager: sections.hiringManager, company: sections.company });
        previewHTML += `<div style="margin-bottom: 20px; font-size: 12px;">`;
        if (sections.hiringManager) previewHTML += `<div>${sections.hiringManager}</div>`;
        if (sections.company) previewHTML += `<div>${sections.company}</div>`;
        previewHTML += `</div>`;
      }
      
      // Add subject
      if (sections.subject) {
        console.log('Preview: Adding subject:', sections.subject);
        previewHTML += `<div style="margin-bottom: 20px; font-weight: bold; font-size: 14px;">${sections.subject}</div>`;
      }
      
      // Add greeting
      if (sections.greeting) {
        console.log('Preview: Adding greeting:', sections.greeting);
        previewHTML += `<div style="margin-bottom: 20px;">${sections.greeting}</div>`;
      }
      
      // Add body
      if (sections.body) {
        console.log('Preview: Adding body (first 100 chars):', sections.body.substring(0, 100));
        previewHTML += `<div style="margin-bottom: 20px; text-align: justify;">${sections.body.replace(/\n/g, '<br>')}</div>`;
      }
      
      // Add closing
      if (sections.closing) {
        console.log('Preview: Adding closing:', sections.closing);
        previewHTML += `<div style="margin-top: 20px;">${sections.closing}</div>`;
      }
      
      previewHTML += '</div>';
      
      console.log('Preview HTML generated successfully');
      console.log('Preview HTML (first 500 chars):', previewHTML.substring(0, 500));
      console.log('=== PREVIEW GENERATION END ===');
      return previewHTML;
    } catch (error) {
      console.error('Error generating preview from LaTeX:', error);
      return '<div style="color: red;">Error generating preview</div>';
    }
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
                              Generating preview...
                            </Typography>
                          </Box>
                        ) : formattedPreview ? (
                          <Box sx={{
                            backgroundColor: 'white',
                            minHeight: '600px',
                            overflow: 'auto'
                          }}>
                            <div 
                              dangerouslySetInnerHTML={{ __html: formattedPreview }}
                              style={{
                                padding: '20px',
                                fontFamily: 'Arial, sans-serif'
                              }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ p: 4, textAlign: 'center' }}>
                            <PdfIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                              Preview will appear here
                            </Typography>
                          </Box>
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default CoverLetterGenerator; 