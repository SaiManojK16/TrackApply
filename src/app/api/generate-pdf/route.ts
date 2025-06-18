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

    // Extract text content from LaTeX for PDF generation
    const textContent = extractTextFromLatex(latexContent);

    // Update generation count if user is authenticated
    if (user && !user.hasUnlimitedAccess) {
      user.generationCount += 1;
      await user.save();
    }

    // Return the text content for client-side PDF generation
    return NextResponse.json({
      success: true,
      textContent: textContent,
      filename: filename || 'cover-letter.pdf',
      message: 'Text content extracted successfully. Use client-side PDF generation.'
    });

  } catch (error) {
    console.error('Error in PDF generation:', error);
    return NextResponse.json({
      error: 'Failed to process content for PDF generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to extract text content from LaTeX
function extractTextFromLatex(latexContent: string): string {
  // Remove LaTeX commands and extract plain text
  let text = latexContent
    // Remove LaTeX document structure
    .replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '')
    .replace(/\\end\{document\}/g, '')
    // Remove common LaTeX commands
    .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    // Remove special characters
    .replace(/[{}]/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return text;
} 