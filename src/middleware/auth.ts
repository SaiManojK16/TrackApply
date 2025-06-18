import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
}

export async function authenticateToken(request: NextRequest): Promise<{ user: IUser } | { error: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return { error: 'Access token required' };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    await dbConnect();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return { error: 'User not found' };
    }

    return { user };
  } catch (error) {
    return { error: 'Invalid token' };
  }
}

export function createAuthResponse(message: string, status: number = 401) {
  return NextResponse.json({ error: message }, { status });
} 