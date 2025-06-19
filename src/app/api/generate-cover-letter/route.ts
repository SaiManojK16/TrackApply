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
    str = str.replace(/\\\\/g, '<<BACKSLASH>>');
    str = str.replace(/\\begin\{itemize\}/g, '<<BEGINITEMIZE>>');
    str = str.replace(/\\end\{itemize\}/g, '<<ENDITEMIZE>>');
    str = str.replace(/\\item/g, '<<ITEM>>');
    str = str.replace(/([%$#_{}~^&])/g, '\\$1');
    str = str.replace(/<<BACKSLASH>>/g, '\\\\');
    str = str.replace(/<<BEGINITEMIZE>>/g, '\\begin{itemize}');
    str = str.replace(/<<ENDITEMIZE>>/g, '\\end{itemize}');
    str = str.replace(/<<ITEM>>/g, '\\item');
    return str;
}

// Define the base LaTeX template for the cover letter
const latexTemplate = `
% Cover Letter Template
\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{times}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}

\\begin{document}

% Personal Information
\\textbf{{{Name}}} \\\\
{{Email}} \\\\
{{Phone}} \\\\
LinkedIn: \\href{{{LinkedIn}}}{{{LinkedIn}}} \\\\
GitHub: \\href{{{GitHub}}}{{{GitHub}}} \\\\
Portfolio: \\href{{{Portfolio}}}{{{Portfolio}}}

\\vspace{0.5in}

% Date
{{Date}}

\\vspace{0.3in}

% Hiring Manager
{{HiringManager}} \\\\
{{Company}}

\\vspace{0.3in}

% Subject
\\textbf{Application for {{Position}} Position at {{Company}}}

\\vspace{0.3in}

% Greeting
Dear {{HiringManager}},

\\vspace{0.2in}

% Body
{{BodyParagraphs}}

\\vspace{0.3in}

% Closing
Sincerely, \\\\
{{Name}}

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

    // Construct the prompt for the Gemini AI model
    const prompt = `You are a cover letter generator. Based on the provided information, generate a JSON response with exactly this field:

{
  "BodyParagraphs": "Write 2-3 paragraphs for the cover letter body ONLY. Each paragraph should be 80-100 words maximum. The content should be highly customized based on the user's additional instructions, the JOB ROLE, and the RESUME CONTENT. Include: 1) Introduction and strong interest in the position, 2) Specific relevant experience and projects *directly from the RESUME CONTENT* that align with the JOB ROLE, 3) Why you are interested in *this specific company* and a compelling closing. Use the user's instructions to guide the tone, style, and specific content."
}

CRITICAL RULES:
- Respond ONLY with valid JSON in the exact format shown above
- DO NOT use markdown formatting, code blocks, or any other formatting
- Return ONLY the raw JSON object, nothing else
- User instructions ONLY apply to the body paragraphs of the cover letter
- Do NOT modify the header, contact information, company details, subject line, date, or signature
- **ABSOLUTELY CRITICAL:** If user instructions are provided, they are MANDATORY and take precedence for shaping the body content. Follow them precisely regarding paragraph count, bullet points, highlighting specific skills, or any other formatting/content directives within the 80-100 word limit per paragraph.
- If no user instructions are provided, use the default professional format for the body, but still integrate resume and job details.
- Each paragraph in the body should be 80-100 words maximum. If content exceeds this limit, split it into multiple paragraphs.
- Format the BodyParagraphs with proper LaTeX line breaks (\\\\\\\\) between paragraphs. If bullet points are requested in user instructions, format them using standard LaTeX itemize environment (e.g., \\\\begin{itemize}\\\\item Item 1\\\\item Item 2\\\\end{itemize}).
- **IMPORTANT:** Integrate specific keywords, skills, and experiences *directly from the provided RESUME CONTENT* that are relevant to the JOB ROLE.
- **IMPORTANT:** Avoid generic statements; ensure the letter highlights *how your resume directly addresses the job description*.
- **IMPORTANT:** DO NOT include any placeholders (e.g., [Platform where you saw the advertisement], [Specific company interest]). If information is not provided, either omit it or make a general, professional statement (e.g., "as advertised online," "your esteemed institution").

User Instructions (MANDATORY for body content only):
${userInstructions || 'No specific instructions provided - use default professional format for body'}

JOB ROLE:
Title: ${jobTitle}
Description: ${jobDescription}
Company: ${companyName}

PERSONAL DETAILS:
Name: ${finalFullName}
Email: ${finalEmail}
Phone: ${finalPhone}
LinkedIn: ${finalLinkedin}
GitHub: ${finalGithub}
Portfolio: ${finalPortfolio}

RESUME CONTENT:
${resumeContent}`;

    // Generate content using the Gemini AI model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let aiContent;
    
    const rawText = result.response.text();
    console.log('Raw AI response:', rawText);
    // Attempt to parse the AI's response as JSON
    try {
      // Remove all code block markers and trim whitespace
      let jsonText = rawText.replace(/```json|```/g, '').trim();
      aiContent = JSON.parse(jsonText);
    } catch (e) {
      console.error('JSON parse error:', e);
      // If parsing fails, try to extract JSON from the response text
      let jsonText = rawText.replace(/```json|```/g, '').trim();
      // Try to find JSON object in the cleaned text
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          aiContent = JSON.parse(match[0]);
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', parseError);
          console.error('Full AI response:', rawText);
          // Fallback to default cover letter body
          aiContent = {
            BodyParagraphs: "I am reaching out to express interest in the position at your company. With a foundation in software engineering and product-focused thinking, I aim to contribute both technical depth and collaborative energy to your organization.\\\\\\\\\\n\\nIn my recent projects, I have worked on relevant projects and technical skills and actively participated in areas such as teamwork, problem-solving, and technical expertise. I am particularly impressed by the company's innovative approach and growth opportunities, and I'm eager to be part of its growth.\\\\\\\\\\n\\nPlease find my resume attached. I would be glad to discuss further how I can support your company's goals."
          };
        }
      } else {
        console.error('No JSON found in AI response');
        console.error('Full AI response:', rawText);
        aiContent = {
          BodyParagraphs: "I am reaching out to express interest in the position at your company. With a foundation in software engineering and product-focused thinking, I aim to contribute both technical depth and collaborative energy to your organization.\\\\\\\\\\n\\nIn my recent projects, I have worked on relevant projects and technical skills and actively participated in areas such as teamwork, problem-solving, and technical expertise. I am particularly impressed by the company's innovative approach and growth opportunities, and I'm eager to be part of its growth.\\\\\\\\\\n\\nPlease find my resume attached. I would be glad to discuss further how I can support your company's goals."
        };
      }
    }

    // Fill the LaTeX template with dynamic content
    const filledLatex = latexTemplate
      .replace(/{{Name}}/g, escapeLatex(finalFullName))
      .replace(/{{Email}}/g, escapeLatex(finalEmail))
      .replace(/{{Phone}}/g, finalPhone ? escapeLatex(finalPhone) : '')
      .replace(/{{LinkedIn}}/g, finalLinkedin ? escapeLatex(finalLinkedin) : '')
      .replace(/{{GitHub}}/g, finalGithub ? escapeLatex(finalGithub) : '')
      .replace(/{{Portfolio}}/g, finalPortfolio ? escapeLatex(finalPortfolio) : '')
      .replace(/{{Date}}/g, escapeLatex(currentDate))
      .replace(/{{HiringManager}}/g, escapeLatex('Hiring Manager'))
      .replace(/{{Company}}/g, escapeLatex(companyName))
      .replace(/{{Position}}/g, escapeLatex(jobTitle))
      .replace(/{{BodyParagraphs}}/g, escapeLatexBody(aiContent.BodyParagraphs) || "");

    return NextResponse.json({ coverLetterLatex: filledLatex });
  } catch (error) {
    console.error('Error in cover letter generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate cover letter',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 