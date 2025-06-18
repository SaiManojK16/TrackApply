const { NextResponse } = require('next/server');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token for Next.js API routes
const authenticateToken = async (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // Return user object wrapped in an object with 'user' property
    return { user };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
};

// Optional authentication middleware (doesn't require token but adds user if present)
const optionalAuth = async (request) => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        return { user };
      }
    }
    return null;
  } catch (error) {
    // Continue without authentication if token is invalid
    return null;
  }
};

module.exports = { authenticateToken, optionalAuth }; 