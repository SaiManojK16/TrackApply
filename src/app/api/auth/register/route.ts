import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email, password, fullName, phone, linkedin, github, portfolio } = await request.json();

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Create new user
    const user = new User({
      email,
      password,
      fullName,
      phone: phone || '',
      linkedin: linkedin || '',
      github: github || '',
      portfolio: portfolio || ''
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: user.getProfile()
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
} 