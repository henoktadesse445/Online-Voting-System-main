const mongoose = require("mongoose");

const votingSettingsSchema = new mongoose.Schema({
  // Voting period settings
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  // Whether voting is currently enabled (can override date range)
  isActive: {
    type: Boolean,
    default: true,
  },
  // Election title/description
  electionTitle: {
    type: String,
    default: "Wachemo University Election",
  },
  // Last updated timestamp
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create a method to check if voting is currently active
votingSettingsSchema.methods.isVotingActive = function() {
  if (!this.isActive) {
    return false;
  }
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// Ensure only one settings document exists
votingSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings if none exist
    const defaultStartDate = new Date();
    defaultStartDate.setHours(0, 0, 0, 0);
    const defaultEndDate = new Date(defaultStartDate);
    defaultEndDate.setDate(defaultEndDate.getDate() + 7); // 7 days from start
    
    settings = await this.create({
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      isActive: true,
      electionTitle: "Wachemo University Election",
    });
  }
  return settings;
};

module.exports = mongoose.model("VotingSettings", votingSettingsSchema);

