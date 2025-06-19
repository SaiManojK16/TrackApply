import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();

    const {
      jobTitle,
      companyName,
      jobDescription,
      hiringManagerName,
      hiringManagerEmail
    } = await request.json();

    if (!jobTitle || !companyName) {
      return NextResponse.json({ 
        error: 'Job title and company name are required' 
      }, { status: 400 });
    }

    // Get user data for personalization
    const user = authResult.user;
    const userInfo = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      resumeData: user.resumeData
    };

    // Create prompt for email generation
    const prompt = `Generate a professional follow-up email for a job application. 

Job Details:
- Position: ${jobTitle}
- Company: ${companyName}
- Job Description: ${jobDescription || 'Not provided'}

Applicant Information:
- Name: ${userInfo.fullName}
- Email: ${userInfo.email}
- Phone: ${userInfo.phone || 'Not provided'}
- LinkedIn: ${userInfo.linkedin || 'Not provided'}
- GitHub: ${userInfo.github || 'Not provided'}
- Portfolio: ${userInfo.portfolio || 'Not provided'}

Hiring Manager Information:
- Name: ${hiringManagerName || 'Hiring Manager'}
- Email: ${hiringManagerEmail || 'hiring@company.com'}

Resume Summary: ${userInfo.resumeData?.extractedText ? userInfo.resumeData.extractedText.substring(0, 500) + '...' : 'Not provided'}

Please generate a professional, concise follow-up email that:
1. Expresses continued interest in the position
2. References specific aspects of the job description
3. Highlights relevant experience from the resume
4. Maintains a professional tone
5. Includes a clear call to action
6. Is personalized to the specific role and company

Return the email in this JSON format:
{
  "subject": "Email subject line",
  "body": "Email body content",
  "greeting": "Dear [Name]",
  "closing": "Best regards, [Name]"
}`;

    // Generate email using Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let emailContent;
    
    const rawText = result.response.text();
    console.log('Raw AI response:', rawText);
    
    // Attempt to parse the AI's response as JSON
    try {
      // Remove all code block markers and trim whitespace
      let jsonText = rawText.replace(/```json|```/g, '').trim();
      emailContent = JSON.parse(jsonText);
    } catch (e) {
      console.error('JSON parse error:', e);
      // If parsing fails, create a simple email structure
      emailContent = {
        subject: `Follow-up: ${jobTitle} Position at ${companyName}`,
        body: rawText,
        greeting: `Dear ${hiringManagerName || 'Hiring Manager'}`,
        closing: `Best regards,\n${userInfo.fullName}`
      };
    }

    return NextResponse.json({
      success: true,
      email: emailContent,
      message: 'Email generated successfully'
    });

  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 