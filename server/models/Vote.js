const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  position: {
    type: String,
    required: false, // Position is optional - will be auto-assigned after election
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
  voteId: {
    type: String,
    required: true,
    index: true, // Index for efficient querying by Vote ID
  },
}, {
  timestamps: true,
});

// Index to ensure one vote per voter (single vote per voter, not per position)
voteSchema.index({ voterId: 1 }, { unique: true });

// 🚀 Performance Optimization: Additional indexes for vote queries
voteSchema.index({ candidateId: 1 }); // Index for candidate vote counts
voteSchema.index({ position: 1 }); // Index for position-based queries
voteSchema.index({ createdAt: -1 }); // Index for chronological queries

module.exports = mongoose.model("Vote", voteSchema);

