import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

// Force dynamic rendering to prevent static analysis issues with pdf-parse
export const dynamic = 'force-dynamic';

// Initialize GoogleGenerativeAI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Escapes special LaTeX characters in a string to prevent compilation errors.
 */
function escapeLatex(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Escapes LaTeX special characters in the AI-generated body, but preserves LaTeX commands.
 */
function escapeLatexBody(str: string): string {
    if (!str) return '';
    
    // First, protect LaTeX commands
    str = str.replace(/\\\\/g, '<<DOUBLEBACKSLASH>>');
    str = str.replace(/\\begin\{itemize\}/g, '<<BEGINITEMIZE>>');
    str = str.replace(/\\end\{itemize\}/g, '<<ENDITEMIZE>>');
    str = str.replace(/\\item/g, '<<ITEM>>');
    str = str.replace(/\\vspace\{([^}]+)\}/g, '<<VSPACE:$1>>');
    str = str.replace(/\\textbf\{([^}]+)\}/g, '<<BOLD:$1>>');
    
    // Escape special LaTeX characters
    str = str.replace(/([%$#_{}~^&])/g, '\\$1');
    
    // Restore LaTeX commands
    str = str.replace(/<<DOUBLEBACKSLASH>>/g, '\\\\');
    str = str.replace(/<<BEGINITEMIZE>>/g, '\\begin{itemize}');
    str = str.replace(/<<ENDITEMIZE>>/g, '\\end{itemize}');
    str = str.replace(/<<ITEM>>/g, '\\item');
    str = str.replace(/<<VSPACE:([^>]+)>>/g, '\\vspace{$1}');
    str = str.replace(/<<BOLD:([^>]+)>>/g, '\\textbf{$1}');
    
    return str;
}

// Define the base LaTeX template for the cover letter
const latexTemplate = `% Cover Letter Template
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{times}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}

\\begin{document}

% Personal Information
\\noindent \\textbf{{{Name}}} \\\\
\\noindent {{Email}} \\\\
\\noindent {{Phone}} \\\\
\\noindent LinkedIn: \\href{{{LinkedIn}}}{LinkedIn} \\\\
\\noindent GitHub: \\href{{{GitHub}}}{GitHub} \\\\
\\noindent Portfolio: \\href{{{Portfolio}}}{Portfolio}

\\vspace{0.5in}

% Date
\\noindent {{Date}}

\\vspace{0.3in}

% Hiring Manager
\\noindent {{HiringManager}} \\\\
\\noindent {{Company}}

\\vspace{0.3in}

% Subject
\\noindent \\textbf{Subject: Application for {{Position}} Position at {{Company}}}

\\vspace{0.3in}

% Greeting
\\noindent Dear {{HiringManager}},

\\vspace{0.2in}

% Body
{{BodyParagraphs}}

\\vspace{0.3in}

% Closing
\\noindent Sincerely, \\\\
\\noindent {{Name}}

\\end{document}`;

/**
 * Helper function to extract text content from a PDF buffer.
 */
async function extractTextFromPDF(dataBuffer: Buffer): Promise<string> {
  // Dynamic import to prevent build issues
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(dataBuffer);
  return data.text;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    
    let fullName, email, phone, linkedin, github, portfolio, companyName, jobTitle, jobDescription, userInstructions, resumeText, resumeFile;
    
    if (contentType.includes('multipart/form-data')) {
      // Parse form data for file uploads
      const formData = await request.formData();
      
      // Extract data from form
      fullName = formData.get('fullName') as string;
      email = formData.get('email') as string;
      phone = formData.get('phone') as string;
      linkedin = formData.get('linkedin') as string;
      github = formData.get('github') as string;
      portfolio = formData.get('portfolio') as string;
      companyName = formData.get('companyName') as string;
      jobTitle = formData.get('jobTitle') as string;
      jobDescription = formData.get('jobDescription') as string;
      userInstructions = formData.get('userInstructions') as string;
      resumeText = formData.get('resumeText') as string;
      resumeFile = formData.get('resume') as File | null;
    } else {
      // Parse JSON data
      const jsonData = await request.json();
      
      fullName = jsonData.fullName || jsonData.user?.fullName || '';
      email = jsonData.email || jsonData.user?.email || '';
      phone = jsonData.phone || jsonData.user?.phone || '';
      linkedin = jsonData.linkedin || jsonData.user?.linkedin || '';
      github = jsonData.github || jsonData.user?.github || '';
      portfolio = jsonData.portfolio || jsonData.user?.portfolio || '';
      companyName = jsonData.companyName || '';
      jobTitle = jsonData.jobTitle || '';
      jobDescription = jsonData.jobDescription || '';
      userInstructions = jsonData.userInstructions || '';
      resumeText = jsonData.resumeText || '';
      resumeFile = null; // No file in JSON requests
    }

    // Check for authentication (optional)
    let user = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        user = await User.findById(decoded.userId);
      } catch (error) {
        // Continue without authentication if token is invalid
      }
    }

    // Use user data if available
    const finalFullName = fullName || user?.fullName || '';
    const finalEmail = email || user?.email || '';
    const finalPhone = phone || user?.phone || '';
    const finalLinkedin = linkedin || user?.linkedin || '';
    const finalGithub = github || user?.github || '';
    const finalPortfolio = portfolio || user?.portfolio || '';

    // Ensure portfolio has proper URL format
    const formattedPortfolio = finalPortfolio && !finalPortfolio.startsWith('http') 
      ? `https://${finalPortfolio}` 
      : finalPortfolio;

    // Get current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Extract resume content
    let resumeContent = '';
    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      resumeContent = await extractTextFromPDF(buffer);
    } else if (user?.resumeData?.extractedText) {
      resumeContent = user.resumeData.extractedText;
    } else {
      resumeContent = resumeText || '';
    }

    // Validate resume content
    if (!resumeContent || resumeContent.trim() === '') {
      return NextResponse.json({
        error: 'Resume content is required. Please upload a resume, paste your resume text, or upload a resume to your profile first.'
      }, { status: 400 });
    }

    // Construct the standardized prompt for the Gemini AI model
    const prompt = `You are generating a job-specific cover letter-style CV with the following strict rules:

---

📄 STRUCTURE

1. Header Section:
   - Full Name (bold, 18px)
   - Contact Info: Email, Phone, LinkedIn, GitHub, Portfolio (regular, 12px)
   - Date (auto-generated, long format like "June 15, 2025")

2. Company Info Section:
   - Hiring Company Name
   - Position Title
   - Company Address (if provided)

3. Greeting:
   - Fixed as: "Dear Hiring Manager,"

4. Body (Content Paragraphs):
   - 2 to 3 paragraphs ONLY
   - Each paragraph must be 80–100 words
   - Write in first person and professional tone
   - Tailor content using the uploaded resume and job description
   - Must demonstrate alignment between user's experience and the job requirements

5. Closing Section:
   - Fixed closing line: "Sincerely,"
   - Signature: Applicant's Full Name

---

✒️ CONTENT RULES

- Do not exceed 3 paragraphs
- No custom headers (e.g., no "Experience", "Skills" titles)
- Use bullet points only with simple • format (if applicable, max 3 bullets in total)
- No greetings other than "Dear Hiring Manager,"
- Do not include personal pronouns in the header or contact section

---

🎨 STYLING RULES

- Font: Times New Roman in HTML preview, Helvetica for PDF rendering
- Font Sizes: 18px for Name, 12px for all other text
- Layout: Single-column, fully left-aligned
- Colors: Only black or dark gray text (no custom color styling)
- No images, logos, or icons
- No tables, columns, or visual elements — plain text only

---

✍️ OUTPUT FORMAT

Return ONLY a JSON object with this exact structure:
{
  "bodyParagraphs": "Write 2-3 paragraphs here, each 80-100 words, separated by \\n\\n. Use bullet points with • if needed. Focus on aligning the candidate's experience with the job requirements."
}

CRITICAL RULES:
- Return ONLY valid JSON in the exact format shown above
- Do not use markdown, code blocks, or any other formatting
- Ensure all quotes in the text are properly escaped for JSON
- Use \\n\\n for paragraph breaks
- Use • for bullet points
- Each paragraph should be 80-100 words maximum

---

USER INFORMATION:
Name: ${finalFullName}
Email: ${finalEmail}
Phone: ${finalPhone}
LinkedIn: ${finalLinkedin}
GitHub: ${finalGithub}
Portfolio: ${formattedPortfolio}

JOB INFORMATION:
Company: ${companyName}
Position: ${jobTitle}
Description: ${jobDescription}

RESUME CONTENT:
${resumeContent}

USER INSTRUCTIONS:
${userInstructions || 'No specific instructions provided - use default professional format'}

Generate the body paragraphs that align the candidate's experience with this specific job opportunity.`;

    // Generate content using the Gemini AI model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let aiContent;
    
    const rawText = result.response.text();
    console.log('Raw AI response:', rawText);
    
    // Improved JSON parsing with better error handling
    try {
      // Remove all code block markers and trim whitespace
      let jsonText = rawText.replace(/```json|```/g, '').trim();
      
      // First, try to parse the JSON as-is
      try {
        aiContent = JSON.parse(jsonText);
      } catch (initialError) {
        console.log('Initial JSON parse failed, attempting to fix escaping...');
        
        // Fix common JSON escaping issues
        jsonText = jsonText
          .replace(/\\/g, '\\\\') // Escape backslashes first
          .replace(/"/g, '\\"') // Escape quotes
          .replace(/\\\\n/g, '\\n') // Fix newline escaping
          .replace(/\\\\t/g, '\\t'); // Fix tab escaping
        
        // Try parsing again
        try {
          aiContent = JSON.parse(jsonText);
        } catch (secondError) {
          console.log('Second parse attempt failed, trying manual extraction...');
          
          // Manual extraction as last resort
          const bodyMatch = jsonText.match(/"bodyParagraphs"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
          if (bodyMatch) {
            aiContent = {
              bodyParagraphs: bodyMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\')
            };
          } else {
            throw new Error('Could not extract bodyParagraphs from AI response');
          }
        }
      }
    } catch (e) {
      console.error('JSON parse error:', e);
      // If parsing fails, try to extract JSON from the response text
      let jsonText = rawText.replace(/```json|```/g, '').trim();
      
      // Try to find JSON object in the cleaned text
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          // Clean up the matched JSON
          let cleanJson = match[0]
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\\\\n/g, '\\n')
            .replace(/\\\\t/g, '\\t');
          
          aiContent = JSON.parse(cleanJson);
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', parseError);
          console.error('Full AI response:', rawText);
          // Fallback to default cover letter body
          aiContent = {
            bodyParagraphs: "I am reaching out to express interest in the position at your company. With a foundation in software engineering and product-focused thinking, I aim to contribute both technical depth and collaborative energy to your organization.\n\nIn my recent projects, I have worked on relevant projects and technical skills and actively participated in areas such as teamwork, problem-solving, and technical expertise. I am particularly impressed by the company's innovative approach and growth opportunities, and I'm eager to be part of its growth.\n\nPlease find my resume attached. I would be glad to discuss further how I can support your company's goals."
          };
        }
      } else {
        console.error('No JSON found in AI response');
        console.error('Full AI response:', rawText);
        aiContent = {
          bodyParagraphs: "I am reaching out to express interest in the position at your company. With a foundation in software engineering and product-focused thinking, I aim to contribute both technical depth and collaborative energy to your organization.\n\nIn my recent projects, I have worked on relevant projects and technical skills and actively participated in areas such as teamwork, problem-solving, and technical expertise. I am particularly impressed by the company's innovative approach and growth opportunities, and I'm eager to be part of its growth.\n\nPlease find my resume attached. I would be glad to discuss further how I can support your company's goals."
        };
      }
    }

    // Build the LaTeX code using the template and AI-generated body
    const filledLatex = latexTemplate
      .replace(/\{\{Name\}\}/g, escapeLatex(finalFullName))
      .replace(/\{\{Email\}\}/g, finalEmail ? escapeLatex(finalEmail) + ' \\\\' : '')
      .replace(/\{\{Phone\}\}/g, finalPhone ? escapeLatex(finalPhone) + ' \\\\' : '')
      .replace(/\{\{LinkedIn\}\}/g, escapeLatex(finalLinkedin))
      .replace(/\{\{GitHub\}\}/g, escapeLatex(finalGithub))
      .replace(/\{\{Portfolio\}\}/g, escapeLatex(formattedPortfolio))
      .replace(/\{\{Date\}\}/g, currentDate)
      .replace(/\{\{HiringManager\}\}/g, 'Hiring Manager')
      .replace(/\{\{Company\}\}/g, escapeLatex(companyName))
      .replace(/\{\{Position\}\}/g, escapeLatex(jobTitle))
      .replace(/\{\{BodyParagraphs\}\}/g, escapeLatexBody(aiContent.bodyParagraphs))
      .replace(/\\\\\s*\\\\/g, '\\\\') // Clean up double line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean up multiple empty lines

    return NextResponse.json({ coverLetterLatex: filledLatex });
  } catch (error) {
    console.error('Error in cover letter generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate cover letter',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 