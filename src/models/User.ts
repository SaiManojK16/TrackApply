import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  resumeData?: {
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    summary: string;
    extractedText: string;
  };
  resumeFileName?: string;
  resumeUploadDate?: Date;
  hasUnlimitedAccess: boolean;
  generationCount: number;
  createdAt: Date;
  lastLogin: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getProfile(): any;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  portfolio: {
    type: String,
    trim: true
  },
  // Resume data fields
  resumeData: {
    skills: [String],
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String
    }],
    education: [{
      degree: String,
      institution: String,
      year: String
    }],
    summary: String,
    extractedText: String
  },
  resumeFileName: {
    type: String,
    trim: true
  },
  resumeUploadDate: {
    type: Date
  },
  // Premium access fields
  hasUnlimitedAccess: {
    type: Boolean,
    default: false
  },
  generationCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile (without password)
userSchema.methods.getProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema); 