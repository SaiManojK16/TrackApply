import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';

const execAsync = promisify(exec);

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

    // Use /tmp for temp directory in serverless
    const tempDir = '/tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const baseFilename = filename || `cover-letter-${timestamp}-${uniqueId}`;
    const texFilePath = path.join(tempDir, `${baseFilename}.tex`);
    const pdfFilePath = path.join(tempDir, `${baseFilename}.pdf`);

    // Write LaTeX content to file
    fs.writeFileSync(texFilePath, latexContent);

    // Compile LaTeX to PDF
    try {
      await execAsync(`pdflatex -interaction=nonstopmode -output-directory="${tempDir}" "${texFilePath}"`);
      
      // Check if PDF was created
      if (!fs.existsSync(pdfFilePath)) {
        throw new Error('PDF generation failed');
      }

      // Update generation count if user is authenticated
      if (user && !user.hasUnlimitedAccess) {
        user.generationCount += 1;
        await user.save();
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

      // Return PDF as download
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${baseFilename}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      
      // Clean up tex file on error
      try {
        if (fs.existsSync(texFilePath)) {
          fs.unlinkSync(texFilePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up tex file:', cleanupError);
      }

      return NextResponse.json({
        error: 'Failed to generate PDF. Please check your LaTeX content.',
        details: pdfError instanceof Error ? pdfError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in PDF generation:', error);
    return NextResponse.json({
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 