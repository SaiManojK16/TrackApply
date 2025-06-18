import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Helper function to check if content is a full LaTeX document
function isFullLatexDocument(content: string): boolean {
  return content.includes('\\documentclass') && content.includes('\\begin{document}');
}

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

    // Use /tmp for temp directory in serverless
    const tempDir = '/tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const baseFilename = `preview-${timestamp}-${uniqueId}`;
    const texFilePath = path.join(tempDir, `${baseFilename}.tex`);
    const pdfFilePath = path.join(tempDir, `${baseFilename}.pdf`);

    // Wrap the LaTeX content with a minimal document structure if it's not a full LaTeX document
    const latexToWrite = isFullLatexDocument(decodedLatex)
      ? decodedLatex
      : `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\begin{document}
${decodedLatex}
\\end{document}`;

    // Write LaTeX content to file
    fs.writeFileSync(texFilePath, latexToWrite);

    // Compile LaTeX to PDF
    try {
      const { stdout, stderr } = await execAsync(`pdflatex -interaction=nonstopmode -output-directory=${tempDir} ${texFilePath}`);
      
      if (stderr) {
        console.error('LaTeX compilation stderr:', stderr);
      }
      if (stdout) {
        console.log('LaTeX compilation stdout:', stdout);
      }
      
      // Check if PDF was created
      if (!fs.existsSync(pdfFilePath)) {
        throw new Error('PDF generation failed - file not created');
      }

      // Read PDF file
      const pdfBuffer = fs.readFileSync(pdfFilePath);

      // Clean up temporary files
      try {
        fs.unlinkSync(texFilePath);
        fs.unlinkSync(pdfFilePath);
        // Also clean up auxiliary files
        const auxFiles = ['.aux', '.log', '.out'];
        auxFiles.forEach(ext => {
          const auxFile = path.join(tempDir, `${baseFilename}${ext}`);
          if (fs.existsSync(auxFile)) {
            fs.unlinkSync(auxFile);
          }
        });
      } catch (cleanupError) {
        console.error('Error cleaning up temporary files:', cleanupError);
      }

      // Return PDF for inline display
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename=cover-letter-preview.pdf',
          'Content-Length': pdfBuffer.length.toString(),
        },
      });

    } catch (pdfError) {
      console.error('PDF preview error:', pdfError);
      
      // Clean up tex file on error
      try {
        if (fs.existsSync(texFilePath)) {
          fs.unlinkSync(texFilePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up tex file:', cleanupError);
      }

      return NextResponse.json({
        error: 'Failed to generate PDF preview. Please check your LaTeX content.',
        details: pdfError instanceof Error ? pdfError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in PDF preview:', error);
    return NextResponse.json({
      error: 'Failed to generate PDF preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 