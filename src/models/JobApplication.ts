import mongoose from 'mongoose';

export interface IJobApplication extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  applicationStatus: string;
  applicationDate: Date;
  interviewDate?: Date;
  notes?: string;
  location?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  getPublicProfile(): any;
}

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  applicationStatus: {
    type: String,
    enum: [
      'Applied',
      'Under Review',
      'Interview Scheduled',
      'Interview Completed',
      'Technical Assessment',
      'Final Round',
      'Offer Received',
      'Offer Accepted',
      'Offer Declined',
      'Rejected',
      'Withdrawn',
      'On Hold'
    ],
    default: 'Applied'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  interviewDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// Method to get public profile (excluding sensitive data)
jobApplicationSchema.methods.getPublicProfile = function() {
  return this.toObject();
};

// Create indexes for better query performance
jobApplicationSchema.index({ userId: 1, applicationDate: -1 });
jobApplicationSchema.index({ userId: 1, applicationStatus: 1 });

export default mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema); 