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
}, {
  timestamps: true,
});

// Index to ensure one vote per voter (single vote per voter, not per position)
voteSchema.index({ voterId: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);

