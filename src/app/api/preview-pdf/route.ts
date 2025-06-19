import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latexContent = searchParams.get('latex');

    if (!latexContent) {
      return NextResponse.json({ error: 'LaTeX content is required' }, { status: 400 });
    }

    // Safely decode the URI component with multiple attempts
    let decodedLatex: string;
    try {
      // First, try to decode normally
      decodedLatex = decodeURIComponent(latexContent);
    } catch (decodeError) {
      console.error('First decode attempt failed:', decodeError);
      try {
        // Try with unescape first
        const unescaped = unescape(latexContent);
        decodedLatex = decodeURIComponent(unescaped);
      } catch (secondError) {
        console.error('Second decode attempt failed:', secondError);
        try {
          // Try with a more lenient approach - replace problematic characters
          let cleanedContent = latexContent
            .replace(/\+/g, ' ')
            .replace(/%20/g, ' ')
            .replace(/%0A/g, '\n')
            .replace(/%0D/g, '\r')
            .replace(/%09/g, '\t');
          
          // Try to decode the cleaned content
          decodedLatex = decodeURIComponent(cleanedContent);
        } catch (finalError) {
          console.error('All decode attempts failed:', finalError);
          // As a last resort, return the raw content
          decodedLatex = latexContent
            .replace(/\+/g, ' ')
            .replace(/%20/g, ' ')
            .replace(/%0A/g, '\n')
            .replace(/%0D/g, '\r')
            .replace(/%09/g, '\t');
        }
      }
    }

    // Validate that we have some content
    if (!decodedLatex || decodedLatex.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Empty LaTeX content',
        details: 'The decoded LaTeX content is empty'
      }, { status: 400 });
    }

    // Extract text content from LaTeX for client-side rendering
    const textContent = extractTextFromLatex(decodedLatex);

    // Return the text content for client-side PDF generation
    return NextResponse.json({
      success: true,
      textContent: textContent,
      message: 'Text content extracted successfully. Use client-side PDF generation.'
    });

  } catch (error) {
    console.error('Error in PDF preview:', error);
    return NextResponse.json({
      error: 'Failed to process content for PDF preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to extract text content from LaTeX
function extractTextFromLatex(latexContent: string): string {
  try {
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

    return text || 'No text content could be extracted';
  } catch (error) {
    console.error('Error extracting text from LaTeX:', error);
    return 'Error extracting text content';
  }
} 