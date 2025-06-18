import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not Set',
      JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not Set',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not Set',
      NODE_ENV: process.env.NODE_ENV || 'Not Set'
    };

    return NextResponse.json({
      message: 'Environment variables check',
      env: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check environment variables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 