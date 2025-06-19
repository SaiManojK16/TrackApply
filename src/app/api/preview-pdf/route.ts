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
    console.log('Extracting text from LaTeX, length:', latexContent.length);
    
    // Remove LaTeX document structure
    let text = latexContent
      .replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, '')
      .replace(/\\end\{document\}/g, '')
      // Remove package imports
      .replace(/\\usepackage[^}]*/g, '')
      // Remove LaTeX commands with braces
      .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
      // Remove LaTeX commands without braces
      .replace(/\\[a-zA-Z]+/g, '')
      // Remove special LaTeX characters
      .replace(/[{}]/g, '')
      .replace(/\\\\(?!\\)/g, '\n') // Convert \\ to newlines (but not \\\)
      .replace(/\\\\/g, '\n') // Convert \\\ to newlines
      .replace(/\\vspace\{[^}]*\}/g, '\n\n') // Convert vspace to double newlines
      .replace(/\\textbf\{([^}]*)\}/g, '$1') // Remove bold formatting
      .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1') // Extract text from href
      .replace(/\\href\{([^}]*)\}/g, '$1') // Handle href without text
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
      .trim();

    console.log('Initial text extraction result:', text.substring(0, 200) + '...');

    // If the text is still mostly LaTeX commands, try a more aggressive approach
    if (text.length < 50 || text.includes('\\')) {
      console.log('Text too short or contains LaTeX commands, trying aggressive extraction');
      
      // Extract only the content between \begin{document} and \end{document}
      const documentMatch = latexContent.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
      if (documentMatch) {
        text = documentMatch[1]
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
        
        console.log('Aggressive extraction result:', text.substring(0, 200) + '...');
      }
    }

    // If still no good text, try to extract just the body paragraphs
    if (text.length < 100) {
      console.log('Still no good text, trying to extract body paragraphs');
      
      // Look for the body content specifically
      const bodyMatch = latexContent.match(/Dear[^}]*?,\s*([\s\S]*?)\\vspace\{1\.5em\}/);
      if (bodyMatch) {
        text = bodyMatch[1]
          .replace(/\\\\(?!\\)/g, '\n')
          .replace(/\\\\/g, '\n')
          .replace(/\\textbf\{([^}]*)\}/g, '$1')
          .replace(/[{}]/g, '')
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n\n')
          .trim();
        
        console.log('Body extraction result:', text.substring(0, 200) + '...');
      }
    }

    // Final cleanup
    text = text
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\s+/g, ' '); // Normalize spaces

    console.log('Final text result:', text.substring(0, 200) + '...');
    
    return text || 'No text content could be extracted';
  } catch (error) {
    console.error('Error extracting text from LaTeX:', error);
    return 'Error extracting text content';
  }
} 