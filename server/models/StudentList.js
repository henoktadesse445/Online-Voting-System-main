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
  // All other fields are dynamic
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  strict: false, // 🔓 Allow saving any other fields present in the imported file
});

// Indexes for faster queries
studentListSchema.index({ name: 1 });
studentListSchema.index({ email: 1 });
// studentListSchema.index({ status: 1 }); // Status might not exist in dynamic imports
studentListSchema.index({ createdAt: -1 });
module.exports = mongoose.model("StudentList", studentListSchema);
