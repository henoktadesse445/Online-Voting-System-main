const mongoose = require("mongoose");

const studentListSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // Allows multiple null values but ensures uniqueness when present
    index: true, // Add index for faster lookups
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  college: {
    type: String,
  },
  department: {
    type: String,
  },
  year: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Indexes for faster queries
studentListSchema.index({ name: 1 });
studentListSchema.index({ email: 1 });
studentListSchema.index({ status: 1 });
studentListSchema.index({ createdAt: -1 });
module.exports = mongoose.model("StudentList", studentListSchema);
