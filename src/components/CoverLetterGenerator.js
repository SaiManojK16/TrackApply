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
          
          // Call the API to get structured content for preview
          const previewResponse = await axios.post('/api/generate-pdf', {
            latexContent: response.data.coverLetterLatex,
            filename: 'preview'
          });
          
          if (previewResponse.data.success && previewResponse.data.structuredContent) {
            const content = previewResponse.data.structuredContent;
            
            // Generate formatted preview HTML from structured content
            const previewHTML = generatePreviewFromStructuredContent(content);
            setFormattedPreview(previewHTML);
            
            console.log('Preview generated successfully from structured content');
          } else {
            // Fallback to old method
            const previewHTML = generatePreviewFromLatex(response.data.coverLetterLatex);
            setFormattedPreview(previewHTML);
            console.warn('Using fallback preview generation');
          }
        } catch (pdfError) {
          console.error('Preview generation failed:', pdfError);
          // Fallback to old method
          try {
            const previewHTML = generatePreviewFromLatex(response.data.coverLetterLatex);
            setFormattedPreview(previewHTML);
          } catch (fallbackError) {
            console.error('Fallback preview also failed:', fallbackError);
            setError('Failed to generate preview');
          }
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
        setPdfLoading(true);
        
        // Call the API to get structured content
        const response = await axios.post('/api/generate-pdf', {
          latexContent: coverLetter,
          filename: `cover-letter-${formData.companyName || 'document'}`
        });
        
        if (response.data.success && response.data.structuredContent) {
          const content = response.data.structuredContent;
          
          // Generate PDF with structured content
          const pdf = new jsPDF();
          const pageWidth = pdf.internal.pageSize.getWidth();
          const margin = 20;
          const maxWidth = pageWidth - (2 * margin);
          
          let yPosition = 30;
          const lineHeight = 7;
          
          // Add personal information
          if (content.personalInfo.name) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            const nameLines = pdf.splitTextToSize(content.personalInfo.name, maxWidth);
            for (let line of nameLines) {
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight;
            }
            yPosition += lineHeight;
          }
          
          // Add contact information
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const contactInfo = [
            content.personalInfo.email,
            content.personalInfo.phone,
            content.personalInfo.linkedin ? `LinkedIn: ${content.personalInfo.linkedin}` : '',
            content.personalInfo.github ? `GitHub: ${content.personalInfo.github}` : '',
            content.personalInfo.portfolio ? `Portfolio: ${content.personalInfo.portfolio}` : ''
          ].filter(Boolean);
          
          for (let info of contactInfo) {
            pdf.text(info, margin, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 2;
          
          // Add date
          if (content.date) {
            pdf.text(content.date, margin, yPosition);
            yPosition += lineHeight * 2;
          }
          
          // Add hiring manager and company
          if (content.hiringManager || content.company) {
            if (content.hiringManager) {
              pdf.text(content.hiringManager, margin, yPosition);
              yPosition += lineHeight;
            }
            if (content.company) {
              pdf.text(content.company, margin, yPosition);
              yPosition += lineHeight;
            }
            yPosition += lineHeight;
          }
          
          // Add subject
          if (content.subject) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            const subjectLines = pdf.splitTextToSize(content.subject, maxWidth);
            for (let line of subjectLines) {
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight;
            }
            yPosition += lineHeight * 2;
          }
          
          // Add greeting
          if (content.greeting) {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            pdf.text(content.greeting, margin, yPosition);
            yPosition += lineHeight * 2;
          }
          
          // Add body
          if (content.body) {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            const bodyLines = pdf.splitTextToSize(content.body, maxWidth);
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
          if (content.closing) {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            const closingLines = pdf.splitTextToSize(content.closing, maxWidth);
            for (let line of closingLines) {
              if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, margin, yPosition);
              yPosition += lineHeight;
            }
          }
          
          // Download the PDF
          const filename = `cover-letter-${formData.companyName || 'document'}.pdf`;
          pdf.save(filename);
          
          setSnackbar({
            open: true,
            message: 'Cover letter downloaded successfully!',
            severity: 'success'
          });
        } else {
          throw new Error('Failed to get structured content from API');
        }
      } catch (error) {
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
    setFormattedPreview('');
    setError('');
    setShowLatex(false);
  };

  // Function to convert LaTeX content to PDF
  const generatePDFFromLatex = (latexContent) => {
    try {
      console.log('=== PDF GENERATION START ===');
      console.log('Original LaTeX content length:', latexContent.length);
      
      // Extract content directly from LaTeX template structure
      const extractedContent = extractContentFromLatex(latexContent);
      console.log('Extracted content:', extractedContent);
      
      if (!extractedContent) {
        console.error('Failed to extract content from LaTeX');
        return null;
      }
      
      // Create PDF with extracted content
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (2 * margin);
      
      let yPosition = 30;
      const lineHeight = 7;
      
      // Add personal information
      if (extractedContent.name) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const nameLines = pdf.splitTextToSize(extractedContent.name, maxWidth);
        for (let line of nameLines) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight;
      }
      
      // Add contact information
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const contactInfo = [
        extractedContent.email,
        extractedContent.phone,
        extractedContent.linkedin ? `LinkedIn: ${extractedContent.linkedin}` : '',
        extractedContent.github ? `GitHub: ${extractedContent.github}` : '',
        extractedContent.portfolio ? `Portfolio: ${extractedContent.portfolio}` : ''
      ].filter(Boolean);
      
      for (let info of contactInfo) {
        pdf.text(info, margin, yPosition);
        yPosition += lineHeight;
      }
      
      yPosition += lineHeight * 2;
      
      // Add date
      if (extractedContent.date) {
        pdf.text(extractedContent.date, margin, yPosition);
        yPosition += lineHeight * 2;
      }
      
      // Add hiring manager and company
      if (extractedContent.hiringManager || extractedContent.company) {
        if (extractedContent.hiringManager) {
          pdf.text(extractedContent.hiringManager, margin, yPosition);
          yPosition += lineHeight;
        }
        if (extractedContent.company) {
          pdf.text(extractedContent.company, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight;
      }
      
      // Add subject
      if (extractedContent.subject) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const subjectLines = pdf.splitTextToSize(extractedContent.subject, maxWidth);
        for (let line of subjectLines) {
          pdf.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight * 2;
      }
      
      // Add greeting
      if (extractedContent.greeting) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(extractedContent.greeting, margin, yPosition);
        yPosition += lineHeight * 2;
      }
      
      // Add body
      if (extractedContent.body) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const bodyLines = pdf.splitTextToSize(extractedContent.body, maxWidth);
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
      if (extractedContent.closing) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const closingLines = pdf.splitTextToSize(extractedContent.closing, maxWidth);
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

  // Function to extract content directly from LaTeX template
  const extractContentFromLatex = (latexContent) => {
    try {
      console.log('=== CONTENT EXTRACTION START ===');
      console.log('LaTeX content to extract from:', latexContent.substring(0, 500));
      
      // Extract content using regex patterns based on our LaTeX template structure
      const content = {};
      
      // Extract name from \textbf{{Name}}
      const nameMatch = latexContent.match(/\\textbf\{\{\{Name\}\}\}/);
      if (nameMatch) {
        // Find the actual name value in the template
        const nameValueMatch = latexContent.match(/\\textbf\{([^}]+)\}/);
        content.name = nameValueMatch ? nameValueMatch[1] : '';
      }
      
      // Extract email from {{Email}}
      const emailMatch = latexContent.match(/\{\{\{Email\}\}\}/);
      if (emailMatch) {
        // Find the actual email value
        const emailValueMatch = latexContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        content.email = emailValueMatch ? emailValueMatch[1] : '';
      }
      
      // Extract phone from {{Phone}}
      const phoneMatch = latexContent.match(/\{\{\{Phone\}\}\}/);
      if (phoneMatch) {
        // Find the actual phone value
        const phoneValueMatch = latexContent.match(/(\d{10,})/);
        content.phone = phoneValueMatch ? phoneValueMatch[1] : '';
      }
      
      // Extract LinkedIn from {{LinkedIn}}
      const linkedinMatch = latexContent.match(/\{\{\{LinkedIn\}\}\}/);
      if (linkedinMatch) {
        // Find the actual LinkedIn value
        const linkedinValueMatch = latexContent.match(/(https?:\/\/[^\s]+linkedin[^\s]*)/i);
        content.linkedin = linkedinValueMatch ? linkedinValueMatch[1] : '';
      }
      
      // Extract GitHub from {{GitHub}}
      const githubMatch = latexContent.match(/\{\{\{GitHub\}\}\}/);
      if (githubMatch) {
        // Find the actual GitHub value
        const githubValueMatch = latexContent.match(/(https?:\/\/[^\s]+github[^\s]*)/i);
        content.github = githubValueMatch ? githubValueMatch[1] : '';
      }
      
      // Extract Portfolio from {{Portfolio}}
      const portfolioMatch = latexContent.match(/\{\{\{Portfolio\}\}\}/);
      if (portfolioMatch) {
        // Find the actual portfolio value
        const portfolioValueMatch = latexContent.match(/(https?:\/\/[^\s]+)/);
        content.portfolio = portfolioValueMatch ? portfolioValueMatch[1] : '';
      }
      
      // Extract date from {{Date}}
      const dateMatch = latexContent.match(/\{\{\{Date\}\}\}/);
      if (dateMatch) {
        // Find the actual date value
        const dateValueMatch = latexContent.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
        content.date = dateValueMatch ? dateValueMatch[1] : '';
      }
      
      // Extract hiring manager from {{HiringManager}}
      const hiringManagerMatch = latexContent.match(/\{\{\{HiringManager\}\}\}/);
      if (hiringManagerMatch) {
        content.hiringManager = 'Hiring Manager';
      }
      
      // Extract company from {{Company}}
      const companyMatch = latexContent.match(/\{\{\{Company\}\}\}/);
      if (companyMatch) {
        // Find the actual company value
        const companyValueMatch = latexContent.match(/Position at ([^}]+)/);
        content.company = companyValueMatch ? companyValueMatch[1] : '';
      }
      
      // Extract position from {{Position}}
      const positionMatch = latexContent.match(/\{\{\{Position\}\}\}/);
      if (positionMatch) {
        // Find the actual position value
        const positionValueMatch = latexContent.match(/Application for ([^}]+) Position/);
        content.position = positionValueMatch ? positionValueMatch[1] : '';
      }
      
      // Extract subject
      const subjectMatch = latexContent.match(/Application for ([^}]+) Position at ([^}]+)/);
      if (subjectMatch) {
        content.subject = `Application for ${subjectMatch[1]} Position at ${subjectMatch[2]}`;
      }
      
      // Extract greeting
      const greetingMatch = latexContent.match(/Dear ([^,]+),/);
      if (greetingMatch) {
        content.greeting = `Dear ${greetingMatch[1]},`;
      }
      
      // Extract body from {{BodyParagraphs}}
      const bodyMatch = latexContent.match(/\{\{\{BodyParagraphs\}\}\}/);
      if (bodyMatch) {
        // Find the actual body content
        const bodyContentMatch = latexContent.match(/Dear[^}]*\},\s*\n\s*\n([\s\S]*?)\s*\n\s*Sincerely/);
        if (bodyContentMatch) {
          content.body = bodyContentMatch[1].replace(/\\\\(?!\\)/g, '\n').replace(/\\\\/g, '\n').trim();
        }
      }
      
      // Extract closing
      const closingMatch = latexContent.match(/Sincerely,\\\\\\([^}]+)/);
      if (closingMatch) {
        content.closing = `Sincerely,\n${closingMatch[1]}`;
      }
      
      console.log('Extracted content:', content);
      console.log('=== CONTENT EXTRACTION END ===');
      return content;
    } catch (error) {
      console.error('Error extracting content from LaTeX:', error);
      return null;
    }
  };

  // Function to generate preview from LaTeX content
  const generatePreviewFromLatex = (latexContent) => {
    try {
      console.log('=== PREVIEW GENERATION START ===');
      
      // Extract content using the same function
      const extractedContent = extractContentFromLatex(latexContent);
      console.log('Preview extracted content:', extractedContent);
      
      if (!extractedContent) {
        return '<div style="color: red;">Error extracting content from LaTeX</div>';
      }
      
      // Generate formatted preview HTML
      let previewHTML = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; background: white;">';
      
      // Add personal information
      if (extractedContent.name) {
        previewHTML += `<div style="margin-bottom: 20px;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${extractedContent.name}</div>
          <div style="font-size: 12px; color: #666;">`;
        
        if (extractedContent.email) previewHTML += `<div>${extractedContent.email}</div>`;
        if (extractedContent.phone) previewHTML += `<div>${extractedContent.phone}</div>`;
        if (extractedContent.linkedin) previewHTML += `<div>LinkedIn: ${extractedContent.linkedin}</div>`;
        if (extractedContent.github) previewHTML += `<div>GitHub: ${extractedContent.github}</div>`;
        if (extractedContent.portfolio) previewHTML += `<div>Portfolio: ${extractedContent.portfolio}</div>`;
        
        previewHTML += `</div></div>`;
      }
      
      // Add date
      if (extractedContent.date) {
        previewHTML += `<div style="margin-bottom: 20px; font-size: 12px;">${extractedContent.date}</div>`;
      }
      
      // Add hiring manager and company
      if (extractedContent.hiringManager || extractedContent.company) {
        previewHTML += `<div style="margin-bottom: 20px; font-size: 12px;">`;
        if (extractedContent.hiringManager) previewHTML += `<div>${extractedContent.hiringManager}</div>`;
        if (extractedContent.company) previewHTML += `<div>${extractedContent.company}</div>`;
        previewHTML += `</div>`;
      }
      
      // Add subject
      if (extractedContent.subject) {
        previewHTML += `<div style="margin-bottom: 20px; font-weight: bold; font-size: 14px;">${extractedContent.subject}</div>`;
      }
      
      // Add greeting
      if (extractedContent.greeting) {
        previewHTML += `<div style="margin-bottom: 20px;">${extractedContent.greeting}</div>`;
      }
      
      // Add body
      if (extractedContent.body) {
        previewHTML += `<div style="margin-bottom: 20px; text-align: justify;">${extractedContent.body.replace(/\n/g, '<br>')}</div>`;
      }
      
      // Add closing
      if (extractedContent.closing) {
        previewHTML += `<div style="margin-top: 20px;">${extractedContent.closing.replace(/\n/g, '<br>')}</div>`;
      }
      
      previewHTML += '</div>';
      
      console.log('Preview HTML generated successfully');
      console.log('=== PREVIEW GENERATION END ===');
      return previewHTML;
    } catch (error) {
      console.error('Error generating preview from LaTeX:', error);
      return '<div style="color: red;">Error generating preview</div>';
    }
  };

  // Function to generate preview from structured content
  const generatePreviewFromStructuredContent = (content) => {
    let previewHTML = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; background: white;">';
    
    // Add personal information
    if (content.personalInfo.name) {
      previewHTML += `<div style="margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${content.personalInfo.name}</div>
        <div style="font-size: 12px; color: #666;">`;
      
      if (content.personalInfo.email) previewHTML += `<div>${content.personalInfo.email}</div>`;
      if (content.personalInfo.phone) previewHTML += `<div>${content.personalInfo.phone}</div>`;
      if (content.personalInfo.linkedin) previewHTML += `<div>LinkedIn: ${content.personalInfo.linkedin}</div>`;
      if (content.personalInfo.github) previewHTML += `<div>GitHub: ${content.personalInfo.github}</div>`;
      if (content.personalInfo.portfolio) previewHTML += `<div>Portfolio: ${content.personalInfo.portfolio}</div>`;
      
      previewHTML += `</div></div>`;
    }
    
    // Add date
    if (content.date) {
      previewHTML += `<div style="margin-bottom: 20px; font-size: 12px;">${content.date}</div>`;
    }
    
    // Add hiring manager and company
    if (content.hiringManager || content.company) {
      previewHTML += `<div style="margin-bottom: 20px; font-size: 12px;">`;
      if (content.hiringManager) previewHTML += `<div>${content.hiringManager}</div>`;
      if (content.company) previewHTML += `<div>${content.company}</div>`;
      previewHTML += `</div>`;
    }
    
    // Add subject
    if (content.subject) {
      previewHTML += `<div style="margin-bottom: 20px; font-weight: bold; font-size: 14px;">${content.subject}</div>`;
    }
    
    // Add greeting
    if (content.greeting) {
      previewHTML += `<div style="margin-bottom: 20px;">${content.greeting}</div>`;
    }
    
    // Add body
    if (content.body) {
      previewHTML += `<div style="margin-bottom: 20px; text-align: justify;">${content.body.replace(/\n/g, '<br>')}</div>`;
    }
    
    // Add closing
    if (content.closing) {
      previewHTML += `<div style="margin-top: 20px;">${content.closing.replace(/\n/g, '<br>')}</div>`;
    }
    
    previewHTML += '</div>';
    
    return previewHTML;
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