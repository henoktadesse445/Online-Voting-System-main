const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  // Additional fields for voters
  voterId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
  },
  voteId: {
    type: String,
    unique: true,
    sparse: true, // Unique Vote ID generated during OTP verification
  },
  firstLoginCompleted: {
    type: Boolean,
    default: false, // Tracks if user has completed first-time login with pre-sent OTP
  },
  college: {
    type: String,
  },
  department: {
    type: String,
  },
  dob: {
    type: Date,
  },
  age: {
    type: Number,
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 4.0,
  },
  // Additional fields for candidates
  role: {
    type: String,
    default: "voter",
    enum: ["voter", "candidate", "admin"],
  },
  party: {
    type: String,
  },
  bio: {
    type: String,
  },
  // Candidate vote count
  votes: {
    type: Number,
    default: 0,
  },
  // Candidate photo URL
  img: {
    type: String,
  },
  // Additional fields for candidates
  symbol: {
    type: String,
  },
  // Whether this user (as a voter) has voted
  voteStatus: {
    type: Boolean,
    default: false,
  },
  // Candidate approval status (for self-registration flow)
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: null,
  },
  // Authenticated document from head office (for class representatives)
  authenticatedDocument: {
    type: String,
  },
  // Candidate position (required for candidates)
  position: {
    type: String,
    enum: [
      "President",
      "Vice President",
      "Secretary",
      "Finance Officer",
      "Public Relations Officer",
      "Sports & Recreation Officer",
      "Gender and Equality Officer"
    ],
  },
  // Password reset fields
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpiry: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// 🚀 Performance Optimization: Add indexes for frequently queried fields
userSchema.index({ role: 1, approvalStatus: 1 }); // Compound index for role-based queries
userSchema.index({ voteStatus: 1 }); // Index for vote status checks

module.exports = mongoose.model("User", userSchema);
