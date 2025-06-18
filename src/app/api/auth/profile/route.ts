import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    return NextResponse.json({ user: authResult.user.getProfile() });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { fullName, phone, linkedin, github, portfolio } = await request.json();

    await dbConnect();

    // Update user fields
    if (fullName) authResult.user.fullName = fullName;
    if (phone !== undefined) authResult.user.phone = phone;
    if (linkedin !== undefined) authResult.user.linkedin = linkedin;
    if (github !== undefined) authResult.user.github = github;
    if (portfolio !== undefined) authResult.user.portfolio = portfolio;

    await authResult.user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: authResult.user.getProfile()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 