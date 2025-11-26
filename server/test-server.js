const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // frontend
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// 📝 Register new voter (detailed registration) - Mock version
app.post("/createVoter", async (req, res) => {
  try {
    const { firstName, lastName, email, pass, studentId, voterid, college, department, dob, age } = req.body;
    const studentIdValue = studentId || voterid; // Handle both field names

    // Validate WCU student ID format
    const wcuPattern = /^WCU\d{7}$/;
    if (!wcuPattern.test(studentIdValue)) {
      return res.json({ success: false, message: "Invalid WCU Student ID format. Use format: WCU1411395 (exactly 7 digits)" });
    }

    // Mock successful registration
    console.log("Registration attempt:", { firstName, lastName, email, studentIdValue, college, department });
    
    res.json({ success: true, message: "Student registered successfully for Wachemo University elections" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error registering student" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
