import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/middleware/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateToken(request);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    if (!authResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { fullName, phone, linkedin, github, portfolio } = await request.json();

    await dbConnect();

    // Fetch fresh user data from database
    const user = await User.findById(authResult.user._id);
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Update user fields
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;
    if (portfolio !== undefined) user.portfolio = portfolio;

    await user.save();

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: user.getProfile()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 