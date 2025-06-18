import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';

function hasUser(result: any): result is { user: any } {
  return result && typeof result === 'object' && 'user' in result;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    if (!hasUser(authResult)) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    await dbConnect();
    const applications = await JobApplication.find({ userId: authResult.user._id })
      .sort({ createdAt: -1 });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch job applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    if (!hasUser(authResult)) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
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
    } = await request.json();
    // Validate required fields
    if (!companyName || !jobTitle) {
      return NextResponse.json({ 
        error: 'Company name and job title are required' 
      }, { status: 400 });
    }
    await dbConnect();
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
    await newApplication.save();
    return NextResponse.json({
      message: 'Job application created successfully',
      application: newApplication
    }, { status: 201 });
  } catch (error) {
    console.error('Create job application error:', error);
    return NextResponse.json({ error: 'Failed to create job application' }, { status: 500 });
  }
} 