const mongoose = require('mongoose');

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
    enum: ['Applied', 'Rejected', 'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Offer Accepted', 'Offer Declined', 'Withdrawn'],
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
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
jobApplicationSchema.index({ userId: 1, applicationDate: -1 });

// Method to get public profile (without sensitive data)
jobApplicationSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    jobTitle: this.jobTitle,
    companyName: this.companyName,
    jobDescription: this.jobDescription,
    applicationStatus: this.applicationStatus,
    applicationDate: this.applicationDate,
    interviewDate: this.interviewDate,
    notes: this.notes,
    location: this.location,
    contactEmail: this.contactEmail,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema); 