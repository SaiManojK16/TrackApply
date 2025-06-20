import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import CloudConvert from 'cloudconvert';

// Initialize CloudConvert with API key
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { latexContent, filename } = await request.json();

    if (!latexContent) {
      return NextResponse.json({ error: 'LaTeX content is required' }, { status: 400 });
    }

    if (!process.env.CLOUDCONVERT_API_KEY) {
      return NextResponse.json({ error: 'CloudConvert API key not configured' }, { status: 500 });
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

    console.log('Creating CloudConvert job for LaTeX to PDF conversion...');

    // Create a job to convert LaTeX to PDF using CloudConvert
    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-latex': {
          operation: 'import/raw',
          file: latexContent,
          filename: 'cover-letter.tex'
        },
        'convert-latex-to-pdf': {
          operation: 'convert',
          input: 'import-latex',
          input_format: 'tex',
          output_format: 'pdf',
          engine: 'pdflatex'
        },
        'export-pdf': {
          operation: 'export/url',
          input: 'convert-latex-to-pdf'
        }
      }
    });

    console.log('CloudConvert job created:', job.id);

    // Wait for the job to complete
    const completedJob = await cloudConvert.jobs.wait(job.id);

    console.log('CloudConvert job completed:', completedJob.status);

    // Check if job was successful
    if (completedJob.status !== 'finished') {
      console.error('CloudConvert job failed:', completedJob);
      throw new Error(`CloudConvert job failed with status: ${completedJob.status}`);
    }

    // Get the export task result
    const exportTask = completedJob.tasks.find(task => task.operation === 'export/url');
    
    if (!exportTask || !exportTask.result?.files?.[0]?.url) {
      console.error('No export task found or no files in result:', exportTask);
      throw new Error('PDF generation failed - no export URL available');
    }

    console.log('PDF generated successfully:', exportTask.result.files[0].url);

    // Update generation count if user is authenticated
    if (user && !user.hasUnlimitedAccess) {
      user.generationCount += 1;
      await user.save();
    }

    // Return the PDF URL
    return NextResponse.json({
      success: true,
      pdfUrl: exportTask.result.files[0].url,
      filename: filename || 'cover-letter.pdf',
      message: 'PDF generated successfully using CloudConvert'
    });

  } catch (error) {
    console.error('Error in PDF generation:', error);
    
    // Log more details about CloudConvert errors
    if (error && typeof error === 'object' && 'cause' in error && error.cause && typeof error.cause === 'object' && 'status' in error.cause) {
      console.error('CloudConvert API Error Details:', {
        status: (error.cause as any).status,
        statusText: (error.cause as any).statusText,
        url: (error.cause as any).url
      });
    }
    
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Function to extract structured content from LaTeX
function extractStructuredContentFromLatex(latexContent: string) {
  try {
    // Remove LaTeX comments (lines starting with %)
    latexContent = latexContent
      .split('\n')
      .filter(line => !line.trim().startsWith('%'))
      .join('\n');

    // Helper to unescape LaTeX special characters
    function unescapeLatex(str: string) {
      return str
        .replace(/\\&/g, '&')
        .replace(/\\%/g, '%')
        .replace(/\\_/g, '_')
        .replace(/\\#/g, '#')
        .replace(/\\\$/g, '$')
        .replace(/\\textbackslash\{\}/g, '\\')
        .replace(/\\textasciitilde\{\}/g, '~')
        .replace(/\\textasciicircum\{\}/g, '^');
    }

    const content: {
      personalInfo: {
        name: string;
        email: string;
        phone: string;
        linkedin: string;
        github: string;
        portfolio: string;
      };
      date: string;
      hiringManager: string;
      company: string;
      position: string;
      subject: string;
      greeting: string;
      body: string[];
      closing: string;
    } = {
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
      body: [], // Array of paragraphs
      closing: ''
    };

    // Extract personal information - name (first \textbf{} command)
    const nameMatch = latexContent.match(/\\textbf\{([^}]+)\}/);
    if (nameMatch) {
      content.personalInfo.name = unescapeLatex(nameMatch[1]);
    }

    // Extract email
    const emailMatch = latexContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      content.personalInfo.email = unescapeLatex(emailMatch[1]);
    }

    // Extract phone number (10+ digits)
    const phoneMatch = latexContent.match(/(\d{10,})/);
    if (phoneMatch) {
      content.personalInfo.phone = phoneMatch[1];
    }

    // Extract LinkedIn URL from \href command
    const linkedinMatch = latexContent.match(/LinkedIn: \\href\{([^}]+)\}\{([^}]+)\}/);
    if (linkedinMatch) {
      content.personalInfo.linkedin = linkedinMatch[1];
    }

    // Extract GitHub URL from \href command
    const githubMatch = latexContent.match(/GitHub: \\href\{([^}]+)\}\{([^}]+)\}/);
    if (githubMatch) {
      content.personalInfo.github = githubMatch[1];
    }

    // Extract Portfolio URL from \href command
    const portfolioMatch = latexContent.match(/Portfolio: \\href\{([^}]+)\}\{([^}]+)\}/);
    if (portfolioMatch) {
      content.personalInfo.portfolio = portfolioMatch[1];
    }

    // Extract date
    const dateMatch = latexContent.match(/([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
    if (dateMatch) {
      content.date = dateMatch[1];
    }

    // Extract company (look for the company name after "Hiring Manager")
    const companyMatch = latexContent.match(/Hiring Manager \\\\\s*([^\\\n]+)/);
    if (companyMatch) {
      content.company = companyMatch[1].trim();
    }

    // Extract position from subject line
    const positionMatch = latexContent.match(/Application for ([^}]+) Position at/);
    if (positionMatch) {
      content.position = unescapeLatex(positionMatch[1].trim());
    }

    // Extract subject line
    const subjectMatch = latexContent.match(/\\textbf\{Application for ([^}]+) Position at ([^}]+)\}/);
    if (subjectMatch) {
      content.subject = `Application for ${unescapeLatex(subjectMatch[1])} Position at ${unescapeLatex(subjectMatch[2])}`;
    }

    // Extract greeting
    const greetingMatch = latexContent.match(/Dear ([^,]+),/);
    if (greetingMatch) {
      content.greeting = `Dear ${greetingMatch[1]},`;
    }

    // Extract body content - look for content between greeting and closing
    const bodyStart = latexContent.indexOf('Dear Hiring Manager,');
    const bodyEnd = latexContent.indexOf('Sincerely,');
    
    if (bodyStart !== -1 && bodyEnd !== -1) {
      let bodyContent = latexContent.substring(bodyStart + 'Dear Hiring Manager,'.length, bodyEnd);
      
      // Clean up the body content and split into paragraphs
      bodyContent = bodyContent
        .replace(/\\vspace\{[^}]*\}/g, '\n') // Replace vspace with newlines
        .replace(/\\\\/g, '\n') // Replace \\ with newlines
        .replace(/\\textbf\{([^}]*)\}/g, '$1') // Remove bold formatting
        .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1') // Extract text from href
        .replace(/\\href\{([^}]*)\}/g, '$1') // Handle href without text
        .replace(/[{}]/g, '') // Remove remaining braces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Split into paragraphs and clean up
      let paragraphs = bodyContent
        .split(/\n/)
        .map(p => unescapeLatex(p.trim()))
        .filter(p => p.length > 0 && !p.startsWith('%'));
      
      content.body = paragraphs;
    }

    // Extract closing
    const closingMatch = latexContent.match(/Sincerely, \\\\\s*([^\\\n]+)/);
    if (closingMatch) {
      content.closing = `Sincerely,\n${unescapeLatex(closingMatch[1].trim())}`;
    }

    // Set default values for missing fields
    content.hiringManager = 'Hiring Manager';

    return content;
  } catch (error) {
    console.error('Error extracting structured content:', error);
    return null;
  }
} 