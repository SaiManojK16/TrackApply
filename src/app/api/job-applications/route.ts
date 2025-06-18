import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';

function hasUser(result: any): result is { user: any } {
  return result && typeof result === 'object' && 'user' in result;
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/job-applications - Starting request');
    
    const authResult = await authenticateToken(request);
    console.log('Authentication result:', authResult);
    
    if (authResult instanceof NextResponse) {
      console.log('Authentication returned NextResponse');
      return authResult;
    }
    
    if (!hasUser(authResult)) {
      console.log('Authentication failed - no user found');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');
    
    console.log('Fetching applications for user:', authResult.user._id);
    const applications = await JobApplication.find({ userId: authResult.user._id })
      .sort({ createdAt: -1 });
    
    console.log('Found applications:', applications.length);
    return NextResponse.json({ applications });
    
  } catch (error) {
    console.error('Get job applications error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to fetch job applications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/job-applications - Starting request');
    
    const authResult = await authenticateToken(request);
    console.log('Authentication result:', authResult);
    
    if (authResult instanceof NextResponse) {
      console.log('Authentication returned NextResponse');
      return authResult;
    }
    
    if (!hasUser(authResult)) {
      console.log('Authentication failed - no user found');
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    
    const {
      companyName,
      jobTitle,
      jobDescription,
      applicationDate,
      applicationStatus,
      notes,
      jobUrl,
      salary,
      location,
      contactPerson,
      contactEmail
    } = requestBody;
    
    // Validate required fields
    if (!companyName || !jobTitle) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json({ 
        error: 'Company name and job title are required' 
      }, { status: 400 });
    }
    
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');
    
    const newApplication = new JobApplication({
      userId: authResult.user._id,
      companyName,
      jobTitle,
      jobDescription,
      applicationDate: applicationDate || new Date(),
      applicationStatus: applicationStatus || 'Applied',
      notes,
      jobUrl,
      salary,
      location,
      contactPerson,
      contactEmail
    });
    
    console.log('Saving new application...');
    await newApplication.save();
    console.log('Application saved successfully');
    
    return NextResponse.json({
      message: 'Job application created successfully',
      application: newApplication
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create job application error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to create job application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 