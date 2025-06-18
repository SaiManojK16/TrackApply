import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latexContent = searchParams.get('latex');

    if (!latexContent) {
      return NextResponse.json({ error: 'LaTeX content is required' }, { status: 400 });
    }

    // Safely decode the URI component
    let decodedLatex: string;
    try {
      decodedLatex = decodeURIComponent(latexContent);
    } catch (decodeError) {
      console.error('URI decode error:', decodeError);
      return NextResponse.json({ 
        error: 'Invalid LaTeX content encoding',
        details: 'The LaTeX content contains invalid characters'
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