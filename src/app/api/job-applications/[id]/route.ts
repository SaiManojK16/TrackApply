import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import JobApplication from '@/models/JobApplication';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const application = await JobApplication.findOne({
      _id: id,
      userId: authResult.user._id
    });

    if (!application) {
      return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Get job application error:', error);
    return NextResponse.json({ error: 'Failed to fetch job application' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const updateData = await request.json();

    await dbConnect();
    const { id } = await params;

    const application = await JobApplication.findOneAndUpdate(
      {
        _id: id,
        userId: authResult.user._id
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!application) {
      return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Job application updated successfully',
      application
    });
  } catch (error) {
    console.error('Update job application error:', error);
    return NextResponse.json({ error: 'Failed to update job application' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const application = await JobApplication.findOneAndDelete({
      _id: id,
      userId: authResult.user._id
    });

    if (!application) {
      return NextResponse.json({ error: 'Job application not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Job application deleted successfully'
    });
  } catch (error) {
    console.error('Delete job application error:', error);
    return NextResponse.json({ error: 'Failed to delete job application' }, { status: 500 });
  }
} 