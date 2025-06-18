import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { accessKey } = await request.json();

    // Validate access key
    if (!accessKey) {
      return NextResponse.json({ error: 'Access key is required' }, { status: 400 });
    }

    // Check if the access key is valid
    const validAccessKey = '16092001';
    
    if (accessKey !== validAccessKey) {
      return NextResponse.json({ 
        error: 'Invalid access key',
        success: false 
      }, { status: 400 });
    }

    await dbConnect();

    // Update user to have unlimited access
    authResult.user.hasUnlimitedAccess = true;
    authResult.user.generationCount = 0; // Reset generation count
    await authResult.user.save();

    return NextResponse.json({
      message: 'Premium access unlocked successfully!',
      success: true,
      user: authResult.user.getProfile()
    });
  } catch (error) {
    console.error('Unlock access error:', error);
    return NextResponse.json({ 
      error: 'Failed to unlock premium access',
      success: false 
    }, { status: 500 });
  }
} 