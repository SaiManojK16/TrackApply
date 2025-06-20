import { NextRequest, NextResponse } from 'next/server';
import CloudConvert from 'cloudconvert';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.CLOUDCONVERT_API_KEY) {
      return NextResponse.json({ error: 'CloudConvert API key not configured' }, { status: 500 });
    }

    console.log('Testing CloudConvert API key...');
    console.log('API Key (first 20 chars):', process.env.CLOUDCONVERT_API_KEY.substring(0, 20) + '...');

    const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

    // Test with a simple LaTeX document
    const testLatex = `\\documentclass{article}
\\begin{document}
Hello World!
\\end{document}`;

    console.log('Creating test job...');

    const job = await cloudConvert.jobs.create({
      tasks: {
        'import-test': {
          operation: 'import/raw',
          file: testLatex,
          filename: 'test.tex'
        },
        'convert-test': {
          operation: 'convert',
          input: 'import-test',
          input_format: 'tex',
          output_format: 'pdf',
          engine: 'pdflatex'
        },
        'export-test': {
          operation: 'export/url',
          input: 'convert-test'
        }
      }
    });

    console.log('Test job created:', job.id);

    // Wait for completion
    const completedJob = await cloudConvert.jobs.wait(job.id);
    
    console.log('Test job completed:', completedJob.status);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: completedJob.status,
      message: 'CloudConvert API test successful'
    });

  } catch (error) {
    console.error('CloudConvert test failed:', error);
    
    // Log more details about the error
    if (error && typeof error === 'object' && 'cause' in error && error.cause && typeof error.cause === 'object' && 'status' in error.cause) {
      console.error('CloudConvert API Error Details:', {
        status: (error.cause as any).status,
        statusText: (error.cause as any).statusText,
        url: (error.cause as any).url
      });
    }
    
    return NextResponse.json({
      error: 'CloudConvert test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 