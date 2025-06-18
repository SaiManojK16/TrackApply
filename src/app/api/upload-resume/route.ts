import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    await dbConnect();

    // Use /tmp for temp directory in serverless
    const tempDir = '/tmp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const filePath = path.join(tempDir, `resume-${timestamp}-${uniqueId}.pdf`);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    try {
      // Extract text from PDF using pdftotext
      const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
      const extractedText = stdout.trim();

      if (!extractedText) {
        return NextResponse.json({ 
          error: 'Could not extract text from PDF. Please ensure the PDF contains selectable text.' 
        }, { status: 400 });
      }

      // Store resume data in user document
      authResult.user.resumeData = {
        skills: [],
        experience: [],
        education: [],
        summary: '',
        extractedText: extractedText
      };
      authResult.user.resumeFileName = file.name;
      authResult.user.resumeUploadDate = new Date();

      await authResult.user.save();

      // Clean up temporary file
      fs.unlinkSync(filePath);

      return NextResponse.json({
        message: 'Resume uploaded and processed successfully',
        extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        user: authResult.user.getProfile()
      });

    } catch (extractError) {
      // Clean up temporary file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.error('Text extraction error:', extractError);
      return NextResponse.json({
        error: 'Failed to extract text from PDF. Please ensure the PDF is not password-protected and contains selectable text.',
        details: extractError instanceof Error ? extractError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 