import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { latexContent, filename } = await request.json();

    if (!latexContent) {
      return NextResponse.json({ error: 'LaTeX content is required' }, { status: 400 });
    }

    // Try to get user data for generation count tracking
    let user = null;
    const authResult = await authenticateToken(request);
    if (!('error' in authResult)) {
      user = authResult.user;
      await dbConnect();
      
      // Check generation limits
      if (!user.hasUnlimitedAccess && user.generationCount >= 3) {
        return NextResponse.json({
          error: 'Generation limit reached. Please upgrade to premium for unlimited access.',
          limitReached: true
        }, { status: 403 });
      }
    }

    // Extract structured content from LaTeX for better PDF generation
    const structuredContent = extractStructuredContentFromLatex(latexContent);

    // Update generation count if user is authenticated
    if (user && !user.hasUnlimitedAccess) {
      user.generationCount += 1;
      await user.save();
    }

    // Return structured content for client-side PDF generation
    return NextResponse.json({
      success: true,
      structuredContent: structuredContent,
      filename: filename || 'cover-letter.pdf',
      message: 'Content extracted successfully. Use client-side PDF generation.'
    });

  } catch (error) {
    console.error('Error in PDF generation:', error);
    return NextResponse.json({
      error: 'Failed to process content for PDF generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Function to extract structured content from LaTeX
function extractStructuredContentFromLatex(latexContent: string) {
  try {
    const content = {
      personalInfo: {
        name: '',
        email: '',
        phone: '',
        linkedin: '',
        github: '',
        portfolio: ''
      },
      date: '',
      hiringManager: '',
      company: '',
      position: '',
      subject: '',
      greeting: '',
      body: '',
      closing: ''
    };

    // Extract personal information
    const nameMatch = latexContent.match(/\\textbf\{([^}]+)\}/);
    if (nameMatch) {
      content.personalInfo.name = nameMatch[1];
    }

    // Extract email
    const emailMatch = latexContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      content.personalInfo.email = emailMatch[1];
    }

    // Extract phone
    const phoneMatch = latexContent.match(/(\d{10,})/);
    if (phoneMatch) {
      content.personalInfo.phone = phoneMatch[1];
    }

    // Extract LinkedIn
    const linkedinMatch = latexContent.match(/(https?:\/\/[^\s]+linkedin[^\s]*)/i);
    if (linkedinMatch) {
      content.personalInfo.linkedin = linkedinMatch[1];
    }

    // Extract GitHub
    const githubMatch = latexContent.match(/(https?:\/\/[^\s]+github[^\s]*)/i);
    if (githubMatch) {
      content.personalInfo.github = githubMatch[1];
    }

    // Extract Portfolio
    const portfolioMatch = latexContent.match(/(https?:\/\/[^\s]+)/);
    if (portfolioMatch) {
      content.personalInfo.portfolio = portfolioMatch[1];
    }

    // Extract date
    const dateMatch = latexContent.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
    if (dateMatch) {
      content.date = dateMatch[1];
    }

    // Extract company
    const companyMatch = latexContent.match(/Position at ([^}]+)/);
    if (companyMatch) {
      content.company = companyMatch[1];
    }

    // Extract position
    const positionMatch = latexContent.match(/Application for ([^}]+) Position/);
    if (positionMatch) {
      content.position = positionMatch[1];
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

    // Extract body content
    const bodyMatch = latexContent.match(/Dear[^}]*\},\s*\n\s*\n([\s\S]*?)\s*\n\s*Sincerely/);
    if (bodyMatch) {
      content.body = bodyMatch[1]
        .replace(/\\\\(?!\\)/g, '\n')
        .replace(/\\\\/g, '\n')
        .replace(/\\textbf\{([^}]*)\}/g, '$1')
        .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
        .replace(/\\href\{([^}]*)\}/g, '$1')
        .replace(/[{}]/g, '')
        .trim();
    }

    // Extract closing
    const closingMatch = latexContent.match(/Sincerely,\\\\\\([^}]+)/);
    if (closingMatch) {
      content.closing = `Sincerely,\n${closingMatch[1]}`;
    }

    // Set default values for missing fields
    content.hiringManager = 'Hiring Manager';

    return content;
  } catch (error) {
    console.error('Error extracting structured content:', error);
    return null;
  }
} 