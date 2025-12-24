const startTime = Date.now(); // ⏱️ Start performance timer
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const compression = require("compression");
require("dotenv").config();

const User = require("./models/User"); // import the model
const Contact = require("./models/Contact"); // import the contact model
const VotingSettings = require("./models/VotingSettings"); // import voting settings model
const OTP = require("./models/OTP"); // import the OTP model
const Vote = require("./models/Vote"); // import the Vote model
const StudentList = require("./models/StudentList"); // import the StudentList model
const { Types } = require("mongoose");

const app = express();

// Compression middleware - reduces response size by 60-80%
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression ratio
  threshold: 1024 // Only compress responses larger than 1KB
}));

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // frontend
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static serving for uploaded files with caching
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use("/uploads", express.static(uploadsDir, {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true,
  immutable: false
}));

// Configure multer for handling multipart/form-data (disk storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });

function normalizeStudentId(id) {
  if (!id) return null;
  id = String(id).trim().toUpperCase().replace(/^WCUR/, 'WCU');
  const match = id.match(/^WCU(\d+)/);
  if (!match) return null;
  const num = match[1].slice(0, 7).padStart(7, '0');
  return `WCU${num}`;
}

function generateEmail(firstName, lastName, studentId) {
  const cleanFirstName = String(firstName || '').toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = String(lastName || '').toLowerCase().replace(/[^a-z]/g, '');
  const idPart = studentId ? studentId.toLowerCase().replace('wcu', '') : '';
  return `${cleanFirstName}.${cleanLastName}.${idPart}@gmail.com`;
}

// Connect to MongoDB with connection pooling for better performance
mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 10,        // Maximum number of connections in the pool
    minPoolSize: 2,         // Minimum number of connections to maintain
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
    family: 4               // Use IPv4, skip trying IPv6
  })
  .then(() => console.log("✅ MongoDB Connected with connection pooling"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ⚡ In-Memory Cache for Performance Optimization
const cache = new Map();
const CACHE_TTL = {
  VOTING_SETTINGS: 5 * 60 * 1000,  // 5 minutes
  USER_STATS: 2 * 60 * 1000,        // 2 minutes
  ELECTION_RESULTS: 10 * 60 * 1000, // 10 minutes
  DEFAULT: 3 * 60 * 1000            // 3 minutes
};

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data, ttl = CACHE_TTL.DEFAULT) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

function clearCache(pattern) {
  if (pattern) {
    // Clear specific cache entries matching pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
}

// ROUTES ------------------------------------

// Test route
app.get("/", (req, res) => {
  res.send("Backend server is running 🚀");
});

// 🔍 Database connection status check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMessages = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };

  res.json({
    server: "running",
    database: {
      status: statusMessages[dbStatus] || "unknown",
      readyState: dbStatus,
      connected: dbStatus === 1,
      name: mongoose.connection.name || "not connected",
      host: mongoose.connection.host || "not connected",
      dbName: mongoose.connection.db?.databaseName || "not connected"
    },
    message: dbStatus === 1
      ? "✅ Server and database are connected"
      : "❌ Database is not connected. Check MONGO_URI in .env file"
  });
});

// 📥 Upload Student List (CSV)
app.post("/api/studentList/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Use xlsx to parse both CSV and Excel files
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Parse to JSON (array of objects with header keys)
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({ success: false, message: "File has no data rows" });
    }

    const results = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];

      // --- 🧠 Smart Column Detection ---
      // Normalize keys to find standard fields regardless of casing/spacing
      const keys = Object.keys(row);
      let studentIdKey = keys.find(k => /^(student|voter).?id|id$/i.test(k));
      let emailKey = keys.find(k => /^e.?mail$/i.test(k));
      let nameKey = keys.find(k => /^name|full.?name$/i.test(k));
      // Fallback for Name: Try to combine First + Last if "Name" not found
      let firstNameKey = keys.find(k => /^first.?name$/i.test(k));
      let lastNameKey = keys.find(k => /^last.?name$/i.test(k));

      // Required fields check
      if (!studentIdKey || (!nameKey && (!firstNameKey || !lastNameKey))) {
        // Skip if essential auth strings are missing.
        // We can't auth without ID, and we can't display without Name.
        results.errors.push({ row: i + 2, error: "Missing Student ID or Name column" });
        continue;
      }

      const rawId = row[studentIdKey];
      const studentId = normalizeStudentId(rawId);

      if (!studentId) {
        results.errors.push({ row: i + 2, error: `Invalid Student ID format: ${rawId}` });
        continue;
      }

      // Construct Name
      let name = "Unknown";
      if (nameKey) {
        name = row[nameKey];
      } else if (firstNameKey && lastNameKey) {
        name = `${row[firstNameKey]} ${row[lastNameKey]}`;
      }

      // Construct Email (or generate fake one if missing, though typically required)
      let email = emailKey ? row[emailKey] : "";
      if (!email) {
        // Optional: Generate one or skip. For now, let's skip if critical.
        // Or allow empty email? The system uses email for OTP.
        // Let's fallback to generated pattern if missing
        const fName = firstNameKey ? row[firstNameKey] : name.split(' ')[0];
        const lName = lastNameKey ? row[lastNameKey] : name.split(' ').slice(1).join(' ');
        email = generateEmail(fName, lName, studentId);
      }

      // --- 🏗️ Construct Dynamic Payload ---
      // 1. Start with standard fields
      const payload = {
        studentId,
        name,
        email,
        status: 'active'
      };

      // 2. Add ALL other columns dynamically
      // We exclude the keys we already mapped to standard fields to avoid duplication (optional, but cleaner)
      // actually, keeping them might be good for reference, but let's exclude the mapped raw ID to avoid confusion

      keys.forEach(key => {
        // Skip the raw ID column since we store normalized studentId
        if (key === studentIdKey) return;

        // Add other fields with specific handling if needed, or just as strings
        // Special handling for CGPA to ensure it's a number
        if (/cgpa|gpa/i.test(key)) {
          const val = parseFloat(row[key]);
          payload['cgpa'] = !isNaN(val) ? val : row[key];
        }
        else if (/department|dept/i.test(key)) {
          payload['department'] = row[key];
        }
        else {
          // Determine key name (sanitize if needed, or keep original)
          // We'll keep original to match what user uploaded
          payload[key] = row[key];
        }
      });

      try {
        // Use findOneAndUpdate with upsert for atomic operation
        // payload includes everything, so it will overwrite existing dynamic fields too
        await StudentList.findOneAndUpdate(
          { studentId },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        results.imported++;
      } catch (e) {
        results.errors.push({ row: i + 2, studentId, error: e.message });
      }
    }

    return res.json({ success: true, ...results });
  } catch (err) {
    console.error("Upload student list error:", err);
    return res.status(500).json({ success: false, message: "Failed to process file", error: err.message });
  }
});

// 📊 Diagnostic endpoint to check database contents
app.get("/api/diagnostics", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const voters = await User.countDocuments({ role: { $in: ["voter", undefined, null] } });
    const candidates = await User.countDocuments({ role: "candidate" });
    const admins = await User.countDocuments({ role: "admin" });

    const recentVoters = await User.find({ role: { $in: ["voter", undefined, null] } })
      .select("name email voterId college department createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    const recentCandidates = await User.find({ role: "candidate" })
      .select("name email role votes createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      database: mongoose.connection.db?.databaseName || "unknown",
      statistics: {
        totalUsers,
        voters,
        candidates,
        admins
      },
      recentVoters,
      recentCandidates,
      connection: {
        status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        dbName: mongoose.connection.db?.databaseName
      }
    });
  } catch (err) {
    console.error("Diagnostic error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔎 Get all voters
app.get("/getVoter", async (req, res) => {
  try {
    // Get all users who are NOT candidates and NOT admins
    // This includes: role="voter", role=null, role=undefined, or role field doesn't exist
    // Since we now explicitly set role="voter" on registration, most will have role="voter"
    // But this query handles edge cases where role might be null/undefined
    const allVoters = await User.find({
      role: { $nin: ["candidate", "admin"] }
    })
      .select("name email voterId voteStatus college department img _id role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Fetched ${allVoters.length} voters`);
    }

    res.json({ success: true, voter: allVoters });
  } catch (err) {
    console.error("Error fetching voters:", err);
    res.status(500).json({ success: false, message: "Error fetching voters" });
  }
});

// 🔍 Debug endpoint to check all voters in database
app.get("/api/debugVoters", async (req, res) => {
  try {
    // Get ALL users
    const allUsers = await User.find({}).select('name email role voterId voteStatus createdAt').lean();

    // Get voters with current query (same as /getVoter endpoint)
    const voters = await User.find({
      role: { $nin: ["candidate", "admin"] }
    }).select('name email role voterId voteStatus createdAt').lean();

    // Search for specific names
    const haba = await User.find({ name: { $regex: /haba/i } }).select('name email role voterId').lean();
    const aman = await User.find({ name: { $regex: /aman/i } }).select('name email role voterId').lean();

    res.json({
      success: true,
      totalUsers: allUsers.length,
      votersFound: voters.length,
      allUsers: allUsers.map(u => ({
        name: u.name,
        email: u.email,
        role: u.role || 'null',
        voterId: u.voterId,
        voteStatus: u.voteStatus,
        createdAt: u.createdAt
      })),
      voters: voters.map(v => ({
        name: v.name,
        email: v.email,
        role: v.role || 'null',
        voterId: v.voterId,
        voteStatus: v.voteStatus
      })),
      habaMatches: haba.map(u => ({ name: u.name, email: u.email, role: u.role, voterId: u.voterId })),
      amanMatches: aman.map(u => ({ name: u.name, email: u.email, role: u.role, voterId: u.voterId }))
    });
  } catch (err) {
    console.error("Error in debug endpoint:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔎 Get voter by ID (also works for candidates)
app.get("/getVoterbyID/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid voter id" });
    }
    const voter = await User.findById(id).select("name email voterId voteStatus college department img role party bio age cgpa position").lean();
    if (!voter) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, voter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching user" });
  }
});

// 📝 Register new user (simple signup)
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error registering user" });
  }
});

// 📝 Register new voter (DISABLED - User registration has been disabled)
app.post("/createVoter", upload.none(), async (req, res) => {
  console.log("⚠️ Registration attempt blocked - endpoint is disabled");

  return res.status(403).json({
    success: false,
    message: "User registration has been disabled. All users must be pre-registered by administrators. Please contact your administrator if you need access to the system."
  });

  /* ORIGINAL CODE DISABLED - Registration functionality removed
  console.log("📥 Registration request received");
  console.log("Request body:", req.body);
  
  try {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB not connected. ReadyState:", mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: "Database connection error. Please check if MongoDB is running and MONGO_URI is configured correctly."
      });
    }
    console.log("✅ MongoDB connection verified");
  
    const { firstName, lastName, email, pass, studentId, voterid, college, department, dob, age } = req.body;
    const studentIdValue = studentId || voterid; // Handle both field names
  
    console.log("📋 Extracted data:", {
      firstName,
      lastName,
      email,
      studentIdValue,
      college,
      department,
      hasPassword: !!pass,
      dob,
      age
    });
  
    // Validate required fields
    if (!firstName || !lastName || !email || !pass || !studentIdValue) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, email, password, and studentId are required"
      });
    }
  
    // Validate WCU student ID format
    const wcuPattern = /^WCU\d{7}$/;
    if (!wcuPattern.test(studentIdValue)) {
      console.error("❌ Invalid student ID format:", studentIdValue);
      return res.status(400).json({
        success: false,
        message: "Invalid WCU Student ID format. Use format: WCU1411395 (exactly 7 digits)"
      });
    }
    console.log("✅ Student ID format valid");
  
    // Validate general email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      console.error("❌ Invalid email format:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }
    console.log("✅ Email format valid");
  
    // Check if student exists in StudentList database
    console.log("🔍 Checking student in StudentList database:", studentIdValue);
    const studentInList = await StudentList.findOne({
      studentId: studentIdValue,
      status: "active"
    });
  
    if (!studentInList) {
      console.error("❌ Student not found in StudentList:", studentIdValue);
      return res.status(403).json({
        success: false,
        message: "Student ID not found in the authorized student list. Please contact administrator."
      });
    }
    console.log("✅ Student found in StudentList database");
  
    // Email mismatch no longer blocks registration; log warning only
    if (studentInList.email && studentInList.email.toLowerCase() !== email.toLowerCase()) {
      console.warn("⚠️ Email does not match StudentList record:", email, "vs", studentInList.email);
    } else {
      console.log("✅ Email matches StudentList record");
    }
  
    // Verify name matches the student list (case-insensitive, flexible matching)
    const registeredName = studentInList.name.toLowerCase().trim();
    const providedName = `${firstName} ${lastName}`.toLowerCase().trim();
    // Split names and compare (handles different name order or spacing)
    const registeredNameParts = registeredName.split(/\s+/).sort().join(' ');
    const providedNameParts = providedName.split(/\s+/).sort().join(' ');
  
    if (registeredNameParts !== providedNameParts) {
      console.error("❌ Name mismatch with StudentList:", providedName, "vs", registeredName);
      return res.status(400).json({
        success: false,
        message: `Name does not match the registered name for this Student ID. Registered name: ${studentInList.name}`
      });
    }
    console.log("✅ Name matches StudentList record");
  
    // Verify department matches if provided (optional but recommended)
    if (department && studentInList.department &&
      department.toLowerCase().trim() !== studentInList.department.toLowerCase().trim()) {
      console.warn("⚠️  Department mismatch with StudentList:", department, "vs", studentInList.department);
      // Warning only, not blocking - but can be made strict if needed
      // return res.status(400).json({ 
      //   success: false, 
      //   message: `Department does not match. Registered department: ${studentInList.department}` 
      // });
    }
    if (studentInList.department) {
      console.log("✅ Department verification passed");
    }
  
    // Check if user already exists
    console.log("🔍 Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("❌ User already exists:", email);
      return res.status(400).json({
        success: false,
        message: "User already exists with this email address"
      });
    }
    console.log("✅ Email is unique");
  
    // Check if student ID already exists
    console.log("🔍 Checking for existing student ID:", studentIdValue);
    const existingStudent = await User.findOne({ voterId: studentIdValue });
    if (existingStudent) {
      console.error("❌ Student ID already exists:", studentIdValue);
      return res.status(400).json({
        success: false,
        message: "Student ID already registered to another user"
      });
    }
    console.log("✅ Student ID is unique");
  
    // Hash password
    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(pass, 10);
    console.log("✅ Password hashed");
  
    // Create new user with additional voter information
    const userData = {
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      voterId: studentIdValue,
      role: "voter", // Explicitly set role as voter
      college: college || undefined,
      department: department || undefined,
      dob: dob ? new Date(dob) : undefined,
      age: age ? parseInt(age) : undefined
    };
  
    console.log("📝 Creating user with data:", {
      ...userData,
      password: "[HIDDEN]"
    });
  
    const newUser = new User(userData);
    console.log("✅ User object created");
  
    // Validate the user object before saving
    try {
      await newUser.validate();
      console.log("✅ User object validation passed");
    } catch (validationErr) {
      console.error("❌ Validation error before save:", validationErr);
      const errors = Object.values(validationErr.errors).map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${errors}`
      });
    }
  
    // Save to database
    console.log("💾 Attempting to save user to database...");
    const savedUser = await newUser.save();
    console.log("✅ Student saved successfully!");
    console.log("Saved user details:", {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      voterId: savedUser.voterId,
      college: savedUser.college,
      department: savedUser.department
    });
  
    // Verify the user was actually saved by querying it back
    const verifyUser = await User.findById(savedUser._id);
    if (!verifyUser) {
      console.error("❌ CRITICAL: User was not found after save!");
      return res.status(500).json({
        success: false,
        message: "User creation failed - data not persisted"
      });
    }
    console.log("✅ Verified: User exists in database with ID:", verifyUser._id);
  
    res.json({
      success: true,
      message: "Student registered successfully for Wachemo University elections",
      userId: savedUser._id.toString()
    });
  } catch (err) {
    console.error("❌ Error registering student:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Full error:", err);
  
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      console.error("Validation errors:", errors);
      return res.status(400).json({
        success: false,
        message: `Validation error: ${errors}`
      });
    }
  
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      console.error("Duplicate key error on field:", field);
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different ${field}.`
      });
    }
  
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerSelectionError') {
      console.error("MongoDB network error");
      return res.status(500).json({
        success: false,
        message: "Database connection failed. Please check if MongoDB is running."
      });
    }
  
    // Generic error
    res.status(500).json({
      success: false,
      message: `Error registering student: ${err.message}`
    });
  }
  */ // END OF DISABLED REGISTRATION CODE
});

// 📝 Register new candidate
// Accept multipart/form-data with optional files (image, symbol)
// Supports two modes:
// 1. Self-registration: requires userId - creates pending candidate that needs admin approval
// 2. Admin creation: no userId - creates approved candidate immediately (backward compatibility)
app.post("/createCandidate", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "symbol", maxCount: 1 },
  { name: "authenticatedDocument", maxCount: 1 },
]), async (req, res) => {
  try {
    const { fullName, party, bio, age, cgpa, position, userId } = req.body;

    // Position is no longer set during registration - it will be auto-assigned after election
    // based on vote totals (highest votes = President, 2nd = Vice President, etc.)

    // Build file URLs if uploaded
    const imageFile = req.files && req.files.image ? req.files.image[0] : null;
    const symbolFile = req.files && req.files.symbol ? req.files.symbol[0] : null;
    const documentFile = req.files && req.files.authenticatedDocument ? req.files.authenticatedDocument[0] : null;
    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : undefined;
    const symbolUrl = symbolFile ? `/uploads/${symbolFile.filename}` : undefined;
    const documentUrl = documentFile ? `/uploads/${documentFile.filename}` : undefined;

    // Self-registration mode: Update existing user to candidate with pending approval
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Check if student exists in StudentList database (for self-registration)
      if (user.voterId) {
        console.log("🔍 Checking candidate student in StudentList database:", user.voterId);
        const studentInList = await StudentList.findOne({
          studentId: user.voterId,
          status: "active"
        });

        if (!studentInList) {
          console.error("❌ Student not found in StudentList:", user.voterId);
          return res.status(403).json({
            success: false,
            message: "Your Student ID is not found in the authorized student list. Please contact administrator."
          });
        }
        console.log("✅ Candidate student found in StudentList database");
      }

      // Check if user is already a candidate
      if (user.role === "candidate") {
        return res.status(400).json({
          success: false,
          message: "You are already registered as a candidate"
        });
      }

      // Check if user already has a pending application
      if (user.approvalStatus === "pending") {
        return res.status(400).json({
          success: false,
          message: "You already have a pending candidate application"
        });
      }

      // Validate authenticated document is required for self-registration
      if (!documentUrl) {
        return res.status(400).json({
          success: false,
          message: "Authenticated document is required. Please upload a verified document proving you are a class representative."
        });
      }

      // Update user with candidate information (pending approval)
      // Position will be auto-assigned after election based on vote totals
      const updateData = {
        role: "candidate",
        party,
        bio,
        age: age ? parseInt(age) : undefined,
        cgpa: cgpa ? parseFloat(cgpa) : undefined,
        // position: position || undefined, // Removed - will be auto-assigned after election
        approvalStatus: "pending",
      };

      // Allow updating name if provided (e.g., for display name as candidate)
      if (fullName && fullName.trim()) {
        updateData.name = fullName.trim();
      }

      if (imageUrl) updateData.img = imageUrl;
      if (symbolUrl) updateData.symbol = symbolUrl;
      // Store authenticated document URL (required for self-registration)
      updateData.authenticatedDocument = documentUrl;

      await User.findByIdAndUpdate(userId, updateData);

      return res.json({
        success: true,
        message: "Candidate registration submitted successfully. Waiting for admin approval."
      });
    }

    // Admin creation mode: Create new candidate immediately approved (backward compatibility)
    // Position will be auto-assigned after election based on vote totals

    // Allow admin to provide email and student ID
    const candidateEmail = req.body.email || `candidate_${Date.now()}@temp.com`;
    const candidateVoterId = req.body.voterId || undefined;

    // Check if email already exists
    if (req.body.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already exists" });
      }
    }

    // Check if student ID already exists
    if (candidateVoterId) {
      const existingStudent = await User.findOne({ voterId: candidateVoterId });
      if (existingStudent) {
        return res.status(400).json({ success: false, message: "Student ID already exists" });
      }
    }

    const candidateData = {
      name: fullName,
      email: candidateEmail,
      voterId: candidateVoterId,
      password: await bcrypt.hash("temp_password", 10), // Temporary password
      role: "candidate",
      party,
      bio,
      age: age ? parseInt(age) : undefined,
      cgpa: cgpa ? parseFloat(cgpa) : undefined,
      // position: position || undefined, // Removed - will be auto-assigned after election
      img: imageUrl,
      symbol: symbolUrl,
      approvalStatus: "approved", // Admin-created candidates are auto-approved
      voteStatus: false, // Explicitly set to false to ensure they can vote
    };

    const newCandidate = new User(candidateData);
    await newCandidate.save();

    res.json({ success: true, message: "Candidate registered successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error registering candidate" });
  }
});

// ✅ Approve candidate
app.post("/api/approveCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }

    const candidate = await User.findByIdAndUpdate(
      id,
      { approvalStatus: "approved" },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    res.json({ success: true, message: "Candidate approved successfully", candidate });
  } catch (err) {
    console.error("Error approving candidate:", err);
    res.status(500).json({ success: false, message: "Error approving candidate" });
  }
});

// ❌ Reject candidate
app.post("/api/rejectCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }

    // Revert role to voter and set status to rejected
    const candidate = await User.findByIdAndUpdate(
      id,
      {
        role: "voter",
        approvalStatus: "rejected"
        // We keep the other candidate fields (bio, party, etc.) in case they want to re-apply, 
        // or we could clear them. For now, keeping them seems safer.
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    res.json({ success: true, message: "Candidate rejected successfully", candidate });
  } catch (err) {
    console.error("Error rejecting candidate:", err);
    res.status(500).json({ success: false, message: "Error rejecting candidate" });
  }
});

// 📥 Get all candidates (only approved candidates for public/voting)
app.get("/getCandidate", async (req, res) => {
  try {
    // Only return approved candidates for voting
    const candidate = await User.find({
      role: "candidate",
      approvalStatus: { $in: ["approved", null] } // Include null for backward compatibility
    }).select("name party bio age cgpa role img symbol votes department position");
    // Map party to department for backwards compatibility
    const candidatesWithDepartment = candidate.map(c => ({
      ...c.toObject(),
      department: c.department || c.party || 'Not specified'
    }));
    res.json({ success: true, candidate: candidatesWithDepartment });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching candidates" });
  }
});

// 📥 Get candidates grouped by position (for backward compatibility)
// Note: Positions are now auto-assigned after election, so this returns all candidates
app.get("/api/candidatesByPosition", async (req, res) => {
  try {
    const validPositions = [
      "President",
      "Vice President",
      "Secretary",
      "Finance Officer",
      "Public Relations Officer",
      "Sports & Recreation Officer",
      "Gender and Equality Officer"
    ];

    // Get all approved candidates (positions assigned after election)
    const candidates = await User.find({
      role: "candidate",
      approvalStatus: { $in: ["approved", null] }
    }).select("name party bio age cgpa role img symbol votes department position");

    // Group candidates by position (if position is assigned) or show all in "All Candidates"
    const candidatesByPosition = {};
    const allCandidates = candidates.map(c => ({
      ...c.toObject(),
      department: c.department || c.party || 'Not specified'
    }));

    // If positions are assigned, group by position; otherwise show all candidates together
    const hasAssignedPositions = candidates.some(c => c.position);
    if (hasAssignedPositions) {
      validPositions.forEach(position => {
        candidatesByPosition[position] = candidates
          .filter(c => c.position === position)
          .map(c => ({
            ...c.toObject(),
            department: c.department || c.party || 'Not specified'
          }));
      });
    } else {
      // No positions assigned yet - show all candidates in all positions (for voting)
      validPositions.forEach(position => {
        candidatesByPosition[position] = allCandidates;
      });
    }

    res.json({ success: true, candidatesByPosition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching candidates by position" });
  }
});

// 🏆 Auto-assign positions based on vote totals (call after election ends)
// Assigns positions: 1st highest votes = President, 2nd = Vice President, etc.
app.post("/api/assignPositions", async (req, res) => {
  try {
    const validPositions = [
      "President",
      "Vice President",
      "Secretary",
      "Finance Officer",
      "Public Relations Officer",
      "Sports & Recreation Officer",
      "Gender and Equality Officer"
    ];

    // Get all approved candidates sorted by votes (highest first)
    const candidates = await User.find({
      role: "candidate",
      approvalStatus: { $in: ["approved", null] }
    })
      .select("name party bio age cgpa img symbol department votes position")
      .sort({ votes: -1 }); // Sort by votes descending

    if (candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No candidates found to assign positions"
      });
    }

    // Assign positions based on vote ranking
    const assignments = [];
    for (let i = 0; i < Math.min(candidates.length, validPositions.length); i++) {
      const candidate = candidates[i];
      const position = validPositions[i];

      // Update candidate with assigned position
      await User.findByIdAndUpdate(candidate._id, { position: position });

      assignments.push({
        position: position,
        candidate: {
          name: candidate.name,
          votes: candidate.votes || 0,
          _id: candidate._id
        }
      });
    }

    // Clear position for candidates who didn't get a position (beyond 7th place)
    if (candidates.length > validPositions.length) {
      const remainingCandidates = candidates.slice(validPositions.length);
      for (const candidate of remainingCandidates) {
        await User.findByIdAndUpdate(candidate._id, { position: null });
      }
    }

    res.json({
      success: true,
      message: `Positions assigned successfully. ${assignments.length} candidates assigned positions.`,
      assignments
    });
  } catch (err) {
    console.error("Error assigning positions:", err);
    res.status(500).json({ success: false, message: "Error assigning positions" });
  }
});

// 🏆 Get winners per position (based on assigned positions after election)
app.get("/api/winnersByPosition", async (req, res) => {
  try {
    const validPositions = [
      "President",
      "Vice President",
      "Secretary",
      "Finance Officer",
      "Public Relations Officer",
      "Sports & Recreation Officer",
      "Gender and Equality Officer"
    ];

    const winners = {};

    // Get candidate assigned to each position
    for (const position of validPositions) {
      const candidate = await User.findOne({
        role: "candidate",
        position: position,
        approvalStatus: { $in: ["approved", null] }
      }).select("name party bio age cgpa img symbol department position votes");

      if (candidate) {
        winners[position] = {
          candidate: {
            ...candidate.toObject(),
            department: candidate.department || candidate.party || 'Not specified',
            votes: candidate.votes || 0
          },
          voteCount: candidate.votes || 0
        };
      } else {
        // No candidate assigned to this position yet
        winners[position] = null;
      }
    }

    res.json({ success: true, winners });
  } catch (err) {
    console.error("Error fetching winners:", err);
    res.status(500).json({ success: false, message: "Error fetching winners by position" });
  }
});

// 📥 Get pending candidates (Admin only)
app.get("/api/pendingCandidates", async (req, res) => {
  try {
    console.log("📥 Fetching pending candidates...");
    const pendingCandidates = await User.find({
      role: "candidate",
      approvalStatus: "pending"
    }).select("name party bio age cgpa img symbol email createdAt voterId college department authenticatedDocument");

    console.log(`✅ Found ${pendingCandidates.length} pending candidates`);
    res.json({ success: true, candidates: pendingCandidates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching pending candidates" });
  }
});

// ✅ Approve candidate (Admin only)
app.post("/api/approveCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }

    const candidate = await User.findByIdAndUpdate(
      id,
      { approvalStatus: "approved" },
      { new: true }
    ).select("name email approvalStatus");

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    if (candidate.role !== "candidate") {
      return res.status(400).json({ success: false, message: "User is not a candidate" });
    }

    res.json({
      success: true,
      message: "Candidate approved successfully",
      candidate
    });
  } catch (err) {
    console.error("Error approving candidate:", err);
    res.status(500).json({ success: false, message: "Error approving candidate" });
  }
});

// ❌ Reject candidate (Admin only)
app.post("/api/rejectCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }

    const candidate = await User.findByIdAndUpdate(
      id,
      { approvalStatus: "rejected" },
      { new: true }
    ).select("name email approvalStatus");

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    res.json({
      success: true,
      message: "Candidate rejected successfully",
      candidate
    });
  } catch (err) {
    console.error("Error rejecting candidate:", err);
    res.status(500).json({ success: false, message: "Error rejecting candidate" });
  }
});

// 🔄 Remove candidate rejection (Admin only - allows re-applying)
app.post("/api/resetCandidateStatus/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate ID" });
    }

    const candidate = await User.findByIdAndUpdate(
      id,
      {
        approvalStatus: null,
        role: "voter" // Reset to voter so they can reapply
      },
      { new: true }
    ).select("name email approvalStatus role");

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    res.json({
      success: true,
      message: "Candidate status reset successfully. User can now reapply.",
      candidate
    });
  } catch (err) {
    console.error("Error resetting candidate status:", err);
    res.status(500).json({ success: false, message: "Error resetting candidate status" });
  }
});

// 📊 Get dashboard statistics
app.get("/getDashboardData", async (req, res) => {
  try {
    // Count total voters (including candidates as they are also voters)
    const voterCount = await User.countDocuments({
      role: { $in: ["voter", "candidate", undefined, null] }
    });

    // Count total candidates
    const candidateCount = await User.countDocuments({ role: "candidate" });

    // Count voters who have voted (including candidates)
    const votersVoted = await User.countDocuments({
      role: { $in: ["voter", "candidate", undefined, null] },
      voteStatus: true
    });

    res.json({
      success: true,
      DashboardData: {
        voterCount,
        candidateCount,
        votersVoted
      }
    });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ success: false, message: "Error fetching dashboard statistics" });
  }
});

// ✅ Vote for candidate: increments vote count
app.patch("/getCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate id" });
    }
    const updated = await User.findOneAndUpdate(
      { _id: id },
      { $inc: { votes: 1 } },
      { new: true }
    ).select("name votes");
    if (!updated) {
      console.error("Vote failed: candidate not found", { id });
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    res.json({ success: true, votes: updated.votes });
  } catch (err) {
    console.error("Error updating candidate vote", err);
    res.status(500).json({ success: false, message: "Error updating vote" });
  }
});

// ✅ Update voter information (for admin)
app.patch("/updateVoter/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid voter id" });
    }

    const { name, email, voterId, college, department, voteStatus, password } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Validate Gmail format
      const emailPatternUpdate = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email !== undefined && !emailPatternUpdate.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
      updateData.email = email;
    }
    if (voterId !== undefined) {
      // Validate WCU student ID format if provided
      const wcuPattern = /^WCU\d{7}$/;
      if (!wcuPattern.test(voterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Student ID format. Use format: WCU1234567 (exactly 7 digits)"
        });
      }

      // Check if student ID already exists (for another user)
      const existingStudent = await User.findOne({
        voterId: voterId,
        _id: { $ne: id } // Exclude current user
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student ID already registered to another user"
        });
      }

      updateData.voterId = voterId;
    }
    if (college !== undefined) updateData.college = college;
    if (department !== undefined) updateData.department = department;
    if (voteStatus !== undefined) updateData.voteStatus = !!voteStatus;

    // Handle password update if provided
    if (password !== undefined && password !== '') {
      // Hash the password before storing
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update voter
    const updated = await User.findOneAndUpdate(
      { _id: id, role: { $in: ["voter", undefined, null] } },
      updateData,
      { new: true, runValidators: true }
    ).select("name email voterId college department voteStatus img");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    res.json({
      success: true,
      message: "Voter updated successfully",
      voter: updated
    });
  } catch (err) {
    console.error("Error updating voter:", err);

    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered to another user"
      });
    }

    res.status(500).json({ success: false, message: "Error updating voter" });
  }
});

// 📸 Upload voter profile photo
app.post("/uploadVoterPhoto/:id", upload.single("photo"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid voter id" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No photo uploaded" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const updated = await User.findByIdAndUpdate(
      id,
      { img: photoUrl },
      { new: true }
    ).select("name img");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    res.json({ success: true, message: "Photo uploaded successfully", img: photoUrl });
  } catch (err) {
    console.error("Error uploading photo", err);
    res.status(500).json({ success: false, message: "Error uploading photo" });
  }
});

// 🔐 Helper function to create email transporter (reusable)
const createEmailTransporter = async () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file.');
  }

  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  let transporter;

  if (emailService === 'Outlook365' || emailService === 'Office365') {
    transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      logger: true,
      debug: true,
    });
  } else {
    // For Gmail - use App Password (required if 2-Step Verification is enabled)
    // Try both secure (465) and TLS (587) ports for better compatibility
    const gmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS (not SSL)
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };

    transporter = nodemailer.createTransport(gmailConfig);
    console.log('📧 Gmail transporter configured');
    console.log(`📧 Using email: ${process.env.EMAIL_USER}`);
  }

  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
  } catch (verifyError) {
    console.error('❌ Email server verification failed:', verifyError.message);
    throw new Error(`Email server verification failed: ${verifyError.message}`);
  }

  return transporter;
};

// 📧 Request OTP for voting
app.post("/api/requestOTP", async (req, res) => {
  try {
    const { voterId } = req.body;

    if (!Types.ObjectId.isValid(voterId)) {
      return res.status(400).json({ success: false, message: "Invalid voter ID" });
    }

    // Check if voting is active
    const settings = await VotingSettings.getSettings();
    if (!settings.isVotingActive()) {
      return res.status(403).json({
        success: false,
        message: "Voting is not currently active."
      });
    }

    // Get voter information
    const voter = await User.findById(voterId).select("name email voteStatus");
    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    // Check if already voted
    if (voter.voteStatus) {
      return res.status(409).json({ success: false, message: "You have already voted" });
    }

    // Invalidate any existing unused OTPs for this voter
    await OTP.updateMany(
      { voterId: voterId, used: false },
      { used: true }
    );

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to database
    const otp = new OTP({
      voterId: voterId,
      code: otpCode,
      email: voter.email,
      expiresAt: expiresAt,
      used: false
    });
    await otp.save();

    // Send OTP via email
    try {
      console.log(`📧 Attempting to send OTP to ${voter.email}...`);
      console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
      console.log(`📧 Email user: ${process.env.EMAIL_USER ? 'Configured' : 'NOT CONFIGURED'}`);

      const transporter = await createEmailTransporter();

      const mailOptions = {
        from: {
          name: 'Wachemo University Online Voting System',
          address: process.env.EMAIL_USER
        },
        to: voter.email,
        subject: 'Your Voting OTP - Wachemo University',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2196F3;">Wachemo University Online Voting System</h2>
          <p>Dear ${voter.name},</p>
          <p>You have requested to vote. Please use the following One-Time Password (OTP) to complete your vote:</p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; text-align: center;">
            <h1 style="color: #1976d2; margin: 0; font-size: 36px; letter-spacing: 8px;">${otpCode}</h1>
          </div>
          
          <p><strong>This OTP is valid for 10 minutes.</strong></p>
          <p>If you did not request this OTP, please ignore this email or contact the administrator.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            This is an automated message from Online Voting System.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
      };

      const emailInfo = await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully!`);
      console.log(`📧 Message ID: ${emailInfo.messageId}`);
      console.log(`📧 Response: ${emailInfo.response}`);
      console.log(`📧 To: ${voter.email}`);
      // OTP is NOT logged in console for security - only sent via email
      console.log(`✅ OTP generated and sent to ${voter.email}`);
      console.log(`📧 From: ${process.env.EMAIL_USER}`);

      res.json({
        success: true,
        message: "OTP has been sent to your email address. Please check your inbox (and spam folder)."
        // OTP is NOT included in response for security - user must check their email to receive it
      });
    } catch (emailError) {
      console.error("❌ Error sending OTP email:");
      console.error("❌ Error message:", emailError.message);
      console.error("❌ Error code:", emailError.code);
      console.error("❌ Full error:", emailError);

      // Delete the OTP if email failed
      await OTP.findByIdAndDelete(otp._id);

      // Provide more specific error messages
      let errorMessage = "Failed to send OTP email. ";

      if (emailError.message && emailError.message.includes('credentials')) {
        errorMessage += "Email server credentials are incorrect. Please check your .env file.";
      } else if (emailError.message && emailError.message.includes('not configured')) {
        errorMessage += "Email server is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file.";
      } else if (emailError.code === 'EAUTH') {
        errorMessage += "Email authentication failed. Please check your email credentials.";
      } else if (emailError.code === 'ECONNECTION' || emailError.code === 'ETIMEDOUT') {
        errorMessage += "Cannot connect to email server. Please check your internet connection.";
      } else {
        errorMessage += `Error: ${emailError.message}`;
      }

      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  } catch (err) {
    console.error("Error requesting OTP:", err);
    res.status(500).json({ success: false, message: "Error generating OTP" });
  }
});

// 🧪 Test email sending (for debugging)
app.post("/api/testEmail", async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide testEmail in request body"
      });
    }

    console.log(`🧪 Testing email sending to ${testEmail}...`);

    // Check email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Email credentials not configured. Check .env file."
      });
    }

    const transporter = await createEmailTransporter();

    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const mailOptions = {
      from: {
        name: 'Wachemo University Online Voting System',
        address: process.env.EMAIL_USER
      },
      to: testEmail,
      subject: 'Test OTP Email - Voting System',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2196F3;">Test Email - Online Voting System</h2>
        <p>This is a test email to verify email configuration.</p>
        <p>If you receive this email, the OTP system is working correctly!</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; text-align: center;">
          <h1 style="color: #1976d2; margin: 0; font-size: 36px; letter-spacing: 8px;">${testOTP}</h1>
        </div>
        
        <p>Email configuration is working! ✅</p>
      </div>
    `,
      text: `Test OTP: ${testOTP} - If you receive this, email is working!`
    };

    const emailInfo = await transporter.sendMail(mailOptions);
    console.log(`✅ Test email sent successfully!`);
    console.log(`📧 Message ID: ${emailInfo.messageId}`);
    console.log(`📧 Response: ${emailInfo.response}`);

    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}. Please check your inbox (and spam folder).`,
      messageId: emailInfo.messageId,
      testOTP: testOTP
    });
  } catch (err) {
    console.error("❌ Test email error:", err);
    let errorMessage = "Failed to send test email. ";

    if (err.message && err.message.includes('credentials')) {
      errorMessage += "Check EMAIL_USER and EMAIL_PASSWORD in .env file.";
    } else if (err.code === 'EAUTH') {
      errorMessage += "Authentication failed. Make sure you're using Gmail App Password (not regular password).";
    } else if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT') {
      errorMessage += "Cannot connect to Gmail servers. Check internet connection.";
    } else {
      errorMessage += err.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: err.message
    });
  }
});

// 📝 Update candidate departments in bulk
app.post("/api/updateCandidateDepartments", async (req, res) => {
  try {
    // More flexible matching - matches names containing these keywords
    const departmentMappings = [
      { namePattern: /habtamu/i, department: 'Computer Science' },
      { namePattern: /henok/i, department: 'Information System' },
      { namePattern: /misgana/i, department: 'Chemical Engineering' },
      { namePattern: /wonde/i, department: 'Medicine' }
    ];

    const updates = [];

    // First, get all candidates
    const allCandidates = await User.find({ role: 'candidate' }).select('name party');
    console.log('📋 Current candidates:', allCandidates.map(c => ({ name: c.name, party: c.party })));

    for (const mapping of departmentMappings) {
      const result = await User.updateMany(
        { role: 'candidate', name: { $regex: mapping.namePattern } },
        { $set: { party: mapping.department, department: mapping.department } }
      );
      updates.push({
        pattern: mapping.namePattern.toString(),
        department: mapping.department,
        updated: result.modifiedCount
      });
    }

    // Verify updates
    const updatedCandidates = await User.find({ role: 'candidate' }).select('name party');
    console.log('✅ Updated candidates:', updatedCandidates.map(c => ({ name: c.name, party: c.party })));

    res.json({
      success: true,
      message: "Candidate departments updated successfully",
      updates,
      candidates: updatedCandidates.map(c => ({ name: c.name, department: c.party }))
    });
  } catch (err) {
    console.error("Error updating candidate departments:", err);
    res.status(500).json({ success: false, message: "Error updating departments" });
  }
});

// ✅ Verify OTP before voting
app.post("/api/verifyOTP", async (req, res) => {
  try {
    const { voterId, otpCode } = req.body;

    if (!Types.ObjectId.isValid(voterId)) {
      return res.status(400).json({ success: false, message: "Invalid voter ID" });
    }

    if (!otpCode || otpCode.length !== 6) {
      return res.status(400).json({ success: false, message: "Invalid OTP format" });
    }

    // Find the OTP
    const otp = await OTP.findOne({
      voterId: voterId,
      code: otpCode,
      used: false
    });

    if (!otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Check if OTP is expired
    if (new Date() > otp.expiresAt) {
      // Mark as used even though expired (cleanup)
      await OTP.findByIdAndUpdate(otp._id, { used: true });
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    res.json({
      success: true,
      message: "OTP verified successfully",
      otpVerified: true
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
});

// 🗳️ Unified vote endpoint - single vote per voter (now requires OTP verification)
// Positions are assigned automatically after election based on vote totals
app.post("/vote", async (req, res) => {
  try {
    // First, check if voting is currently active
    const settings = await VotingSettings.getSettings();
    if (!settings.isVotingActive()) {
      const now = new Date();
      if (now < settings.startDate) {
        return res.status(403).json({
          success: false,
          message: `Voting has not started yet. Voting will begin on ${settings.startDate.toLocaleString()}.`
        });
      } else if (now > settings.endDate) {
        return res.status(403).json({
          success: false,
          message: `Voting has ended. The voting period closed on ${settings.endDate.toLocaleString()}.`
        });
      } else if (!settings.isActive) {
        return res.status(403).json({
          success: false,
          message: "Voting is currently disabled by administrator."
        });
      }
    }

    const { candidateId, voterId, otpCode } = req.body || {};
    if (!Types.ObjectId.isValid(candidateId) || !Types.ObjectId.isValid(voterId)) {
      return res.status(400).json({ success: false, message: "Invalid candidate or voter id" });
    }

    // Verify OTP before allowing vote
    if (!otpCode || otpCode.length !== 6) {
      return res.status(400).json({ success: false, message: "OTP is required. Please request an OTP first." });
    }

    // Find and verify the OTP
    const otp = await OTP.findOne({
      voterId: voterId,
      code: otpCode,
      used: false
    });

    if (!otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new one." });
    }

    // Check if OTP is expired
    if (new Date() > otp.expiresAt) {
      await OTP.findByIdAndUpdate(otp._id, { used: true });
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    // Check if candidate exists
    const candidate = await User.findOne({ _id: candidateId, role: "candidate" }).select("name");
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    // Check if voter has already voted (one vote per voter)
    const existingVote = await Vote.findOne({ voterId });
    if (existingVote) {
      return res.status(409).json({
        success: false,
        message: "You have already voted. You can only vote once."
      });
    }

    // Create vote record (no position field - single vote per voter)
    const vote = new Vote({
      voterId,
      candidateId
    });

    await vote.save();

    // Increment candidate's total vote count
    await User.findByIdAndUpdate(candidateId, { $inc: { votes: 1 } });

    // Mark voter as voted
    await User.findByIdAndUpdate(voterId, { voteStatus: true });

    // Invalidate the OTP after successful voting
    await OTP.findByIdAndUpdate(otp._id, { used: true });

    console.log(`✅ Vote recorded: Voter ${voterId} voted for ${candidate.name}`);
    return res.json({
      success: true,
      message: "Vote recorded successfully. Positions will be assigned after election ends based on vote totals.",
    });
  } catch (err) {
    console.error("Error processing vote", err);

    // Handle duplicate vote error (unique index violation)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already voted. You can only vote once."
      });
    }

    return res.status(500).json({ success: false, message: "Server error while voting" });
  }
});

// ⚙️ Get voting settings (start/end date, status)
app.get("/api/votingSettings", async (req, res) => {
  try {
    const settings = await VotingSettings.getSettings();
    const now = new Date();
    const isActive = settings.isVotingActive();

    res.json({
      success: true,
      settings: {
        startDate: settings.startDate,
        endDate: settings.endDate,
        isActive: settings.isActive,
        electionTitle: settings.electionTitle,
        votingActive: isActive,
        timeRemaining: isActive ? settings.endDate - now : 0,
        timeUntilStart: now < settings.startDate ? settings.startDate - now : 0,
      }
    });
  } catch (err) {
    console.error("Error fetching voting settings:", err);
    res.status(500).json({ success: false, message: "Error fetching voting settings" });
  }
});

// ⚙️ Update voting settings (Admin only)
app.post("/api/votingSettings", async (req, res) => {
  try {
    const { startDate, endDate, isActive, electionTitle } = req.body;

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date"
        });
      }
    }

    // Get existing settings or create new
    let settings = await VotingSettings.findOne();

    if (!settings) {
      // Create new settings
      const defaultStartDate = startDate ? new Date(startDate) : new Date();
      const defaultEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      settings = await VotingSettings.create({
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        isActive: isActive !== undefined ? isActive : true,
        electionTitle: electionTitle || "Wachemo University Election",
      });
    } else {
      // Update existing settings
      if (startDate) settings.startDate = new Date(startDate);
      if (endDate) settings.endDate = new Date(endDate);
      if (isActive !== undefined) settings.isActive = isActive;
      if (electionTitle) settings.electionTitle = electionTitle;
      settings.updatedAt = new Date();

      await settings.save();
    }

    const now = new Date();
    const votingActive = settings.isVotingActive();

    res.json({
      success: true,
      message: "Voting settings updated successfully",
      settings: {
        startDate: settings.startDate,
        endDate: settings.endDate,
        isActive: settings.isActive,
        electionTitle: settings.electionTitle,
        votingActive: votingActive,
        timeRemaining: votingActive ? settings.endDate - now : 0,
      }
    });
  } catch (err) {
    console.error("Error updating voting settings:", err);
    res.status(500).json({ success: false, message: "Error updating voting settings" });
  }
});

// 📋 Student List Management Endpoints (Admin only)

// 📋 Get all students in the StudentList
app.get("/api/studentList", async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const students = await StudentList.find(query)
      .sort({ createdAt: -1 })
      .select("studentId name email college department year cgpa status createdAt updatedAt")
      .lean();

    const totalCount = await StudentList.countDocuments(query);

    res.json({
      success: true,
      students,
      totalCount
    });
  } catch (err) {
    console.error("Error fetching student list:", err);
    res.status(500).json({ success: false, message: "Error fetching student list" });
  }
});

// ➕ Add a single student to StudentList
app.post("/api/studentList", async (req, res) => {
  try {
    const { studentId, name, email, college, department, year, status } = req.body;

    // Validate required fields
    if (!studentId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "studentId, name, and email are required"
      });
    }

    // Validate WCU student ID format
    const wcuPattern = /^WCU\d{7}$/;
    if (!wcuPattern.test(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid WCU Student ID format. Use format: WCU1234567 (exactly 7 digits)"
      });
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Check if student already exists
    const existingStudent = await StudentList.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student ID already exists in the list"
      });
    }

    const newStudent = new StudentList({
      studentId,
      name,
      email,
      college: college || undefined,
      department: department || undefined,
      year: year ? parseInt(year) : undefined,
      status: status || "active"
    });

    await newStudent.save();

    res.json({
      success: true,
      message: "Student added to list successfully",
      student: newStudent
    });
  } catch (err) {
    console.error("Error adding student to list:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Student ID already exists in the list"
      });
    }

    res.status(500).json({ success: false, message: "Error adding student to list" });
  }
});

// 📦 Add multiple students to StudentList (bulk upload)
app.post("/api/studentList/bulk", async (req, res) => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "students must be a non-empty array"
      });
    }

    const results = {
      success: [],
      errors: []
    };

    for (const student of students) {
      try {
        let { studentId, name, email, college, department, year, status } = student;

        // Trim whitespace from string fields
        if (studentId) studentId = String(studentId).trim();
        if (name) name = String(name).trim();
        if (email) email = String(email).trim();
        if (college) college = String(college).trim();
        if (department) department = String(department).trim();

        // Validate required fields - skip records with empty/null studentId
        if (!studentId || studentId === "" || !name || name === "" || !email || email === "") {
          results.errors.push({
            studentId: studentId || "N/A",
            name: name || "N/A",
            error: "studentId, name, and email are required and cannot be empty"
          });
          continue;
        }

        // Validate WCU student ID format
        const wcuPattern = /^WCU\d{7}$/;
        if (!wcuPattern.test(studentId)) {
          results.errors.push({
            studentId,
            error: "Invalid WCU Student ID format. Must be WCU followed by 7 digits (e.g., WCU1234567)"
          });
          continue;
        }

        // Check if student already exists
        const existingStudent = await StudentList.findOne({ studentId });
        if (existingStudent) {
          results.errors.push({
            studentId,
            error: "Student ID already exists"
          });
          continue;
        }

        const newStudent = new StudentList({
          studentId,
          name,
          email,
          college: college || undefined,
          department: department || undefined,
          year: year ? parseInt(year) : undefined,
          status: status || "active"
        });

        await newStudent.save();
        results.success.push({
          studentId,
          name,
          email
        });
      } catch (err) {
        results.errors.push({
          studentId: student.studentId || "N/A",
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${students.length} students: ${results.success.length} added, ${results.errors.length} errors`,
      results
    });
  } catch (err) {
    console.error("Error bulk adding students:", err);
    res.status(500).json({ success: false, message: "Error bulk adding students" });
  }
});

// ✏️ Update student in StudentList
app.patch("/api/studentList/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    const { studentId, name, email, college, department, year, status } = req.body;
    const updateData = {};

    if (studentId !== undefined) {
      // Validate WCU student ID format if provided
      const wcuPattern = /^WCU\d{7}$/;
      if (!wcuPattern.test(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid WCU Student ID format"
        });
      }

      // Check if student ID already exists (for another student)
      const existingStudent = await StudentList.findOne({
        studentId,
        _id: { $ne: id }
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student ID already exists for another student"
        });
      }

      updateData.studentId = studentId;
    }

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
      updateData.email = email;
    }
    if (college !== undefined) updateData.college = college;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year ? parseInt(year) : undefined;
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'active' or 'inactive'"
        });
      }
      updateData.status = status;
    }

    const updated = await StudentList.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("studentId name email college department year status");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Student not found in list" });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      student: updated
    });
  } catch (err) {
    console.error("Error updating student:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Student ID already exists"
      });
    }

    res.status(500).json({ success: false, message: "Error updating student" });
  }
});

// 🗑️ Delete student from StudentList
app.delete("/api/studentList/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid student ID" });
    }

    const deleted = await StudentList.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Student not found in list" });
    }

    res.json({
      success: true,
      message: "Student removed from list successfully"
    });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ success: false, message: "Error deleting student" });
  }
});

// 🔧 Fix/Recreate StudentList index (Admin only - fixes duplicate key errors)
app.post("/api/studentList/fixIndex", async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection("studentlists");

    // Drop existing studentId index if it exists
    try {
      const indexes = await collection.indexes();
      const studentIdIndex = indexes.find(idx => idx.key && idx.key.studentId);
      if (studentIdIndex) {
        await collection.dropIndex(studentIdIndex.name);
        console.log("✅ Dropped existing studentId index");
      }
    } catch (err) {
      console.log("ℹ️ No existing index to drop or error:", err.message);
    }

    // Create new sparse unique index
    await collection.createIndex(
      { studentId: 1 },
      {
        unique: true,
        sparse: true,
        name: "studentId_1"
      }
    );

    console.log("✅ Created sparse unique index on studentId");

    res.json({
      success: true,
      message: "Index fixed successfully. The studentId index is now sparse, allowing multiple null values while maintaining uniqueness for non-null values."
    });
  } catch (err) {
    console.error("Error fixing index:", err);
    res.status(500).json({
      success: false,
      message: "Error fixing index: " + err.message
    });
  }
});

// 🧹 Clean up records with null/empty studentId from StudentList
app.post("/api/studentList/cleanup", async (req, res) => {
  try {
    // Delete records where studentId is null, undefined, or empty string
    const result = await StudentList.deleteMany({
      $or: [
        { studentId: null },
        { studentId: undefined },
        { studentId: "" },
        { studentId: { $exists: false } }
      ]
    });

    console.log(`✅ Cleaned up ${result.deletedCount} records with invalid studentId`);

    res.json({
      success: true,
      message: `Cleanup completed. Removed ${result.deletedCount} records with null/empty studentId.`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error cleaning up student list:", err);
    res.status(500).json({
      success: false,
      message: "Error cleaning up student list: " + err.message
    });
  }
});

// 🗑️ Delete ALL students from StudentList (Admin only - use with caution!)
app.delete("/api/studentList", async (req, res) => {
  try {
    // Delete all student records
    const result = await StudentList.deleteMany({});

    console.log(`✅ Deleted all ${result.deletedCount} students from the list`);

    res.json({
      success: true,
      message: `Successfully deleted all students from the list.`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting all students:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting all students: " + err.message
    });
  }
});

// 🔄 Reset all votes (Admin only - for testing/new elections)
app.post("/resetVotes", async (req, res) => {
  try {
    // Reset all voters' voteStatus to false
    await User.updateMany(
      { role: { $in: ["voter", undefined, null] } },
      { voteStatus: false }
    );

    // Reset all candidates' vote counts to 0
    await User.updateMany(
      { role: "candidate" },
      { votes: 0 }
    );

    console.log("✅ All votes reset successfully");
    res.json({
      success: true,
      message: "All votes have been reset. Voters can now vote again and candidate counts are set to 0."
    });
  } catch (err) {
    console.error("Error resetting votes:", err);
    res.status(500).json({ success: false, message: "Error resetting votes" });
  }
});

// 🗑️ Delete candidate by id
app.delete("/deleteCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ _id: id, role: "candidate" });
    if (!deleted) {
      return res.json({ success: false, message: "Candidate not found" });
    }
    res.json({ success: true, message: "Candidate deleted" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error deleting candidate" });
  }
});

// 🗑️ Delete voter by id
app.delete("/deleteVoter/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid voter id" });
    }

    const deleted = await User.findOneAndDelete({
      _id: id,
      role: { $in: ["voter", undefined, null] }
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    res.json({ success: true, message: "Voter deleted successfully" });
  } catch (err) {
    console.error("Error deleting voter:", err);
    res.status(500).json({ success: false, message: "Error deleting voter" });
  }
});

// ✏️ Update candidate details (name/party/bio/cgpa/email/voterId/position)
app.patch("/updateCandidate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid candidate id" });
    }

    // First check if user exists and is a candidate
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role !== "candidate") {
      return res.status(400).json({ success: false, message: "User is not a candidate" });
    }

    const validPositions = [
      "President",
      "Vice President",
      "Secretary",
      "Finance Officer",
      "Public Relations Officer",
      "Sports & Recreation Officer",
      "Gender and Equality Officer"
    ];

    const { name, party, bio, cgpa, age, email, voterId, password, position } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (party !== undefined) update.party = party;
    if (bio !== undefined) update.bio = bio;
    // Support both cgpa (new) and age (backward compatibility)
    if (cgpa !== undefined && cgpa !== '') {
      const cgpaValue = parseFloat(cgpa);
      if (isNaN(cgpaValue) || cgpaValue < 0 || cgpaValue > 4.0) {
        return res.status(400).json({
          success: false,
          message: "CGPA must be a number between 0 and 4.0"
        });
      }
      update.cgpa = cgpaValue;
    } else if (age !== undefined && age !== '') {
      // Backward compatibility: if age is provided but cgpa is not, use age
      update.cgpa = parseFloat(age);
    }

    // Update position if provided
    if (position !== undefined) {
      if (position && !validPositions.includes(position)) {
        return res.status(400).json({
          success: false,
          message: `Invalid position. Must be one of: ${validPositions.join(", ")}`
        });
      }
      update.position = position || null;
    }

    // Validate and update email if provided
    if (email !== undefined) {
      const emailPatternGeneral = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email !== undefined && !emailPatternGeneral.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
      // Check if email already exists (for another user)
      const existingUser = await User.findOne({
        email: email,
        _id: { $ne: id } // Exclude current user
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered to another user"
        });
      }
      update.email = email;
    }

    // Validate and update voterId if provided
    if (voterId !== undefined) {
      const wcuPattern = /^WCU\d{7}$/;
      if (!wcuPattern.test(voterId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Student ID format. Use format: WCU1234567 (exactly 7 digits)"
        });
      }
      // Check if student ID already exists (for another user)
      const existingStudent = await User.findOne({
        voterId: voterId,
        _id: { $ne: id } // Exclude current user
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student ID already registered to another user"
        });
      }
      update.voterId = voterId;
    }

    // Handle password update if provided
    if (password !== undefined && password !== '') {
      update.password = await bcrypt.hash(password, 10);
    }

    const updated = await User.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    ).select("name party bio cgpa age img email voterId position");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }
    res.json({ success: true, candidate: updated, message: "Candidate profile updated successfully" });
  } catch (err) {
    console.error("Error updating candidate:", err);

    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different ${field}.`
      });
    }

    res.status(500).json({ success: false, message: "Error updating candidate" });
  }
});

// 🔐 Login - Single credential field (OTP for first-time, password for returning users)
app.post("/login", async (req, res) => {
  try {
    const { username, credential } = req.body;

    if (!username || !credential) {
      return res.json({ success: false, message: "Username and credential are required" });
    }

    // Allow login by email OR student voterId
    const query = username?.includes("@") ? { email: username } : { voterId: username };
    const user = await User.findOne(query);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if this is first-time login (user hasn't completed first login yet)
    if (!user.firstLoginCompleted) {
      // FIRST-TIME LOGIN: Credential is treated as OTP
      // Verify pre-sent OTP
      const otpRecord = await OTP.findOne({
        voterId: user._id,
        code: credential,
        used: false,
        isPreElectionOTP: true
      }).sort({ createdAt: -1 });

      if (!otpRecord) {
        return res.json({
          success: false,
          message: "Invalid OTP. Please use the OTP sent to your email.",
          isFirstTimeLogin: true
        });
      }

      // Check if OTP is expired
      if (otpRecord.expiresAt < new Date()) {
        return res.json({
          success: false,
          message: "OTP has expired. Please contact administrator for a new OTP.",
          isFirstTimeLogin: true
        });
      }

      // Mark OTP as used
      await OTP.updateOne({ _id: otpRecord._id }, { used: true });

      console.log(`✅ First-time OTP verified for ${user.email}`);

      // Return success with flag to require password change
      return res.json({
        success: true,
        requiresPasswordChange: true,
        message: "OTP verified. Please set a new password.",
        userId: user._id.toString(),
        userInfo: {
          name: user.name,
          email: user.email,
          voterId: user.voterId
        }
      });
    }

    // RETURNING USER LOGIN: Credential is treated as password
    const isPasswordValid = await bcrypt.compare(credential, user.password);
    if (!isPasswordValid) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Password is correct - allow direct login for returning users
    console.log(`✅ Returning user login successful for ${user.email}`);

    // Return success with user session
    return res.json({
      success: true,
      message: "Login successful",
      voterObject: {
        id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        voteId: user.voteId,
        role: user.role,
        voteStatus: user.voteStatus,
        college: user.college,
        department: user.department
      }
    });
  } catch (err) {
    console.error("Error in login:", err);
    res.json({ success: false, message: "Error during login" });
  }
});

// 🔑 Set Password - Mandatory password change after first-time OTP verification
app.post("/setPassword", async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!userId || !newPassword || !confirmPassword) {
      return res.json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has already completed first login
    if (user.firstLoginCompleted) {
      return res.json({
        success: false,
        message: "Password has already been set for this account"
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Generate Vote ID for first-time login
    const voteId = `VOTE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Update user: set password, mark first login complete, and assign Vote ID
    await User.updateOne(
      { _id: user._id },
      {
        password: hashedPassword,
        firstLoginCompleted: true,
        voteId
      }
    );

    console.log(`✅ Password set for user ${user.email}, Vote ID: ${voteId}`);

    // Return success with user session
    return res.json({
      success: true,
      message: "Password set successfully. You can now login with your new password.",
      voterObject: {
        id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        voteId,
        role: user.role,
        voteStatus: user.voteStatus,
        college: user.college,
        department: user.department
      }
    });
  } catch (err) {
    console.error("Error setting password:", err);
    res.json({
      success: false,
      message: "Error setting password"
    });
  }
});


// 🔄 Request Password Reset - Send OTP to user's email
app.post("/requestPasswordReset", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.json({
        success: false,
        message: "Username or email is required"
      });
    }

    // Find user by email or voterId
    const query = username?.includes("@") ? { email: username } : { voterId: username };
    const user = await User.findOne(query);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has completed first login
    if (!user.firstLoginCompleted) {
      return res.json({
        success: false,
        message: "Please complete your first login before resetting password. Use the OTP sent to your email."
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Invalidate any previous password reset OTPs for this user
    await OTP.updateMany(
      { voterId: user._id, used: false, isPasswordReset: true },
      { used: true }
    );

    // Create new password reset OTP
    const newOTP = new OTP({
      voterId: user._id,
      code: otpCode,
      email: user.email,
      expiresAt: expiresAt,
      used: false,
      isPasswordReset: true // Mark as password reset OTP
    });
    await newOTP.save();

    // Send OTP via email
    try {
      const transporter = await createEmailTransporter();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset OTP - Wachemo University Voting System",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You have requested to reset your password for the Wachemo University Voting System.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Your Password Reset OTP:</strong></p>
            <h1 style="color: #e74c3c; font-size: 36px; letter-spacing: 5px; margin: 10px 0;">${otpCode}</h1>
          </div>
          
          <p><strong>This OTP will expire in 15 minutes.</strong></p>
          <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            Wachemo University Voting System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset OTP sent to ${user.email}`);

      // Mask email for privacy
      const emailParts = user.email.split('@');
      const maskedEmail = emailParts[0].substring(0, 2) + '**@' + emailParts[1];

      res.json({
        success: true,
        message: "Password reset OTP sent to your email",
        email: maskedEmail
      });
    } catch (emailError) {
      console.error("❌ Error sending password reset OTP:", emailError);
      await OTP.findByIdAndDelete(newOTP._id);
      return res.json({
        success: false,
        message: "Failed to send OTP email. Please try again later."
      });
    }
  } catch (err) {
    console.error("Error requesting password reset:", err);
    res.json({
      success: false,
      message: "Error requesting password reset"
    });
  }
});

// 🔍 Verify Password Reset OTP
app.post("/verifyResetOTP", async (req, res) => {
  try {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.json({
        success: false,
        message: "Username and OTP are required"
      });
    }

    // Find user
    const query = username?.includes("@") ? { email: username } : { voterId: username };
    const user = await User.findOne(query);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    // Find the password reset OTP
    const otpRecord = await OTP.findOne({
      voterId: user._id,
      code: otp,
      used: false,
      isPasswordReset: true
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.findByIdAndUpdate(otpRecord._id, { used: true });
      return res.json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Mark OTP as used
    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    // Generate temporary reset token (valid for 10 minutes)
    const resetToken = `RST-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store reset token in user document temporarily
    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetTokenExpiry
    });

    console.log(`✅ Password reset OTP verified for ${user.email}`);

    res.json({
      success: true,
      message: "OTP verified successfully",
      resetToken: resetToken,
      userId: user._id.toString()
    });
  } catch (err) {
    console.error("Error verifying reset OTP:", err);
    res.json({
      success: false,
      message: "Error verifying OTP"
    });
  }
});

// 🔒 Reset Password
app.post("/resetPassword", async (req, res) => {
  try {
    const { userId, resetToken, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!userId || !resetToken || !newPassword || !confirmPassword) {
      return res.json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res.json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    // Verify reset token
    if (user.passwordResetToken !== resetToken) {
      return res.json({
        success: false,
        message: "Invalid reset token"
      });
    }

    // Check if token is expired
    if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      return res.json({
        success: false,
        message: "Reset token has expired. Please request a new password reset."
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null
    });

    console.log(`✅ Password reset successful for ${user.email}`);

    res.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.json({
      success: false,
      message: "Error resetting password"
    });
  }
});

// 🔐 Login - Step 2: Verify OTP and Generate Vote ID
app.post("/verifyOTP", async (req, res) => {
  try {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.status(400).json({
        success: false,
        message: "Username and OTP are required"
      });
    }

    // Find user by email or voterId
    const query = username?.includes("@") ? { email: username } : { voterId: username };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Find the OTP for this user
    const otpRecord = await OTP.findOne({
      voterId: user._id,
      code: otp,
      used: false
    }).sort({ createdAt: -1 }); // Get the most recent OTP

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code"
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.findByIdAndUpdate(otpRecord._id, { used: true });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    // Mark OTP as used
    await OTP.findByIdAndUpdate(otpRecord._id, { used: true });

    // Generate unique Vote ID
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const voteId = `VOTE-${timestamp}-${randomPart}`;

    // Update user with Vote ID
    await User.findByIdAndUpdate(user._id, { voteId: voteId });

    console.log(`✅ OTP verified for user ${user.email}, Vote ID: ${voteId}`);

    // Return user data for session
    res.json({
      success: true,
      message: "Login successful",
      voterObject: {
        id: user._id,
        name: user.name,
        email: user.email,
        voterId: user.voterId,
        voteId: voteId,
        role: user.role,
        voteStatus: user.voteStatus,
        college: user.college,
        department: user.department
      }
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP"
    });
  }
});

// 🔄 Resend OTP
app.post("/resendOTP", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    // Find user by email or voterId
    const query = username?.includes("@") ? { email: username } : { voterId: username };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Generate new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Invalidate any previous OTPs for this user
    await OTP.updateMany(
      { voterId: user._id, used: false },
      { used: true }
    );

    // Create new OTP
    const newOTP = new OTP({
      voterId: user._id,
      code: otpCode,
      email: user.email,
      expiresAt: expiresAt,
      used: false
    });
    await newOTP.save();

    // Send OTP via email
    try {
      const transporter = await createEmailTransporter();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Your New Login OTP - Wachemo University Voting System",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Login Verification - Resent OTP</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You have requested a new OTP for the Wachemo University Voting System.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Username (Student ID):</strong> ${user.voterId || user.email}</p>
            <p style="margin: 5px 0;"><strong>Your New OTP Code:</strong></p>
            <h1 style="color: #3498db; font-size: 36px; letter-spacing: 5px; margin: 10px 0;">${otpCode}</h1>
          </div>
          
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you did not request this OTP, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            Wachemo University Voting System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ New OTP sent to ${user.email}`);

      res.json({
        success: true,
        message: "New OTP sent to your registered email address."
      });
    } catch (emailError) {
      console.error("❌ Error sending OTP email:", emailError);
      await OTP.findByIdAndDelete(newOTP._id);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again later."
      });
    }
  } catch (err) {
    console.error("Error resending OTP:", err);
    res.status(500).json({
      success: false,
      message: "Error resending OTP"
    });
  }
});

// 🔐 Admin Login
app.post("/adminlogin", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hardcoded admin credentials for demo purposes
    if (username === "admin" && password === "admin@123") {
      res.json({
        success: true,
        message: "Admin login successful",
        adminObject: {
          id: "admin_001",
          username: "admin",
          role: "admin"
        }
      });
    } else {
      res.json({ success: false, message: "Invalid admin credentials" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error during admin login" });
  }
});

// 📊 Generate Voting Report (Admin only)
app.get("/api/votingReport", async (req, res) => {
  try {
    console.log("📊 Generating voting report...");

    // Get total registered voters
    const totalVoters = await User.countDocuments({
      role: { $in: ["voter", "candidate", undefined, null] }
    });

    // Get total votes cast (unique voters who have voted)
    const totalVotesCast = await User.countDocuments({
      role: { $in: ["voter", "candidate", undefined, null] },
      voteStatus: true
    });

    // Calculate turnout percentage
    const turnoutPercentage = totalVoters > 0
      ? ((totalVotesCast / totalVoters) * 100).toFixed(2)
      : 0;

    // Get all candidates with their vote counts
    const candidates = await User.find({
      role: "candidate",
      approvalStatus: { $in: ["approved", null] }
    })
      .select("name party bio age cgpa img symbol votes department position college voterId")
      .sort({ votes: -1 }) // Sort by votes descending
      .lean();

    // Calculate percentage for each candidate
    const candidateResults = candidates.map(candidate => ({
      id: candidate._id,
      name: candidate.name,
      studentId: candidate.voterId || 'N/A',
      position: candidate.position || 'Not Assigned',
      department: candidate.department || candidate.party || 'Not specified',
      college: candidate.college || 'Not specified',
      votes: candidate.votes || 0,
      percentage: totalVotesCast > 0
        ? ((candidate.votes || 0) / totalVotesCast * 100).toFixed(2)
        : 0,
      bio: candidate.bio || '',
      img: candidate.img || null
    }));

    // Get vote details with Vote IDs (for audit trail)
    const voteDetails = await Vote.find({})
      .populate('voterId', 'name voterId email')
      .populate('candidateId', 'name department position')
      .select('voteId voterId candidateId position createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const voteDetailsFormatted = voteDetails.map(vote => ({
      voteId: vote.voteId,
      voterStudentId: vote.voterId?.voterId || 'Anonymous', // Anonymized
      voterName: vote.voterId?.name || 'Anonymous',
      candidateName: vote.candidateId?.name || 'Unknown',
      candidateDepartment: vote.candidateId?.department || 'N/A',
      position: vote.position || vote.candidateId?.position || 'Not Assigned',
      timestamp: vote.createdAt
    }));

    // Group candidates by position
    const positionBreakdown = {};
    const validPositions = [
      "President",
      "Vice President",
      "Secretary",
      "Finance Officer",
      "Public Relations Officer",
      "Sports & Recreation Officer",
      "Gender and Equality Officer"
    ];

    validPositions.forEach(position => {
      positionBreakdown[position] = candidateResults.filter(
        c => c.position === position
      );
    });

    // Add unassigned candidates
    positionBreakdown["Not Assigned"] = candidateResults.filter(
      c => c.position === 'Not Assigned'
    );

    // Get voting settings for election date
    const votingSettings = await VotingSettings.findOne({}).lean();
    const electionDate = votingSettings?.electionDate || new Date();

    // Compile the report
    const report = {
      summary: {
        totalVoters,
        totalVotesCast,
        turnoutPercentage: parseFloat(turnoutPercentage),
        totalCandidates: candidates.length,
        electionDate,
        reportGeneratedAt: new Date()
      },
      candidateResults,
      voteDetails: voteDetailsFormatted,
      positionBreakdown,
      statistics: {
        averageVotesPerCandidate: candidates.length > 0
          ? (totalVotesCast / candidates.length).toFixed(2)
          : 0,
        highestVotes: candidates[0]?.votes || 0,
        lowestVotes: candidates[candidates.length - 1]?.votes || 0
      }
    };

    console.log(`✅ Report generated: ${totalVotesCast} votes, ${candidates.length} candidates`);

    res.json({
      success: true,
      report
    });
  } catch (err) {
    console.error("Error generating voting report:", err);
    res.status(500).json({
      success: false,
      message: "Error generating voting report",
      error: err.message
    });
  }
});

// 📨 Bulk OTP Distribution (Admin only - Pre-Election)
app.post("/api/admin/distributeOTPs", async (req, res) => {
  try {
    console.log("📨 Starting bulk OTP distribution...");

    // Get all registered users (voters and candidates)
    const users = await User.find({
      role: { $in: ["voter", "candidate", undefined, null] },
      email: { $exists: true, $ne: null }
    }).select("name email voterId _id");

    if (users.length === 0) {
      return res.json({
        success: false,
        message: "No users found to send OTPs"
      });
    }

    console.log(`Found ${users.length} users to send OTPs`);

    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    // Get election date from voting settings
    let electionDate = "TBD";
    try {
      const votingSettings = await VotingSettings.findOne({});
      if (votingSettings && votingSettings.electionDate) {
        electionDate = new Date(votingSettings.electionDate).toLocaleDateString();
      }
    } catch (err) {
      console.log("Could not fetch election date:", err.message);
    }

    // Process each user
    for (const user of users) {
      try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Invalidate any previous pre-election OTPs for this user
        await OTP.updateMany(
          {
            voterId: user._id,
            used: false,
            isPreElectionOTP: true
          },
          { used: true }
        );

        // Store OTP with 7-day expiration
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await OTP.create({
          voterId: user._id,
          code: otp,
          email: user.email,
          expiresAt,
          used: false,
          isPreElectionOTP: true
        });

        // Send email
        const transporter = await createEmailTransporter();

        const emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
              }
              .credentials-box {
                background: white;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 5px;
              }
              .credential-item {
                margin: 15px 0;
              }
              .credential-label {
                font-weight: bold;
                color: #666;
                font-size: 14px;
              }
              .credential-value {
                font-size: 24px;
                color: #667eea;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                letter-spacing: 2px;
              }
              .instructions {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
                border-top: 1px solid #ddd;
              }
              .important {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🗳️ Voting System Login Credentials</h1>
              <p>Wachemo University Online Voting System</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <p>Your login credentials for the Wachemo University Online Voting System have been generated. Please use these credentials to complete your first-time login before the election.</p>
              
              <div class="credentials-box">
                <div class="credential-item">
                  <div class="credential-label">Username (Student ID):</div>
                  <div class="credential-value">${user.voterId || 'N/A'}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">One-Time Password (OTP):</div>
                  <div class="credential-value">${otp}</div>
                </div>
              </div>
              
              <div class="instructions">
                <h3>📋 How to Login:</h3>
                <ol>
                  <li>Visit the voting system website</li>
                  <li>Enter your <strong>Username</strong> (Student ID) shown above</li>
                  <li>Enter your <strong>OTP</strong> shown above</li>
                  <li>Click "Login" to access the system</li>
                </ol>
              </div>
              
              <div class="important">
                <h3>⚠️ Important Information:</h3>
                <ul>
                  <li><strong>Election Date:</strong> ${electionDate}</li>
                  <li><strong>OTP Validity:</strong> This OTP is valid for 7 days</li>
                  <li><strong>First Login:</strong> Please complete your first login before the election</li>
                  <li><strong>Security:</strong> Do not share your credentials with anyone</li>
                </ul>
              </div>
              
              <p>If you have any questions or issues, please contact the election committee.</p>
              
              <p>Best regards,<br>
              <strong>Wachemo University Election Committee</strong></p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from the Wachemo University Online Voting System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </body>
          </html>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "🗳️ Your Voting System Login Credentials",
          html: emailHTML
        });

        results.sent++;
        console.log(`✅ OTP sent to ${user.email}`);

      } catch (err) {
        results.failed++;
        results.errors.push({
          user: user.email,
          error: err.message
        });
        console.error(`❌ Failed to send OTP to ${user.email}:`, err.message);
      }
    }

    console.log(`📊 Distribution complete: ${results.sent} sent, ${results.failed} failed`);

    res.json({
      success: true,
      message: `OTP distribution complete`,
      results
    });

  } catch (err) {
    console.error("Error in bulk OTP distribution:", err);
    res.status(500).json({
      success: false,
      message: "Error distributing OTPs",
      error: err.message
    });
  }
});

// 📧 Contact Form Submission
app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.json({ success: false, message: "Please fill all fields" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ success: false, message: "Invalid email address" });
    }

    // Create new contact message
    const newContact = new Contact({
      name,
      email,
      message,
    });

    await newContact.save();

    res.json({
      success: true,
      message: "Your message has been sent successfully! We'll get back to you soon.",
    });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({
      success: false,
      message: "Error sending message. Please try again.",
    });
  }
});

// 📋 Get all contact messages (Admin only)
app.get("/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching contacts" });
  }
});

// 📧 Reply to contact message
app.post("/contact/reply/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage, adminEmail } = req.body;

    if (!replyMessage) {
      return res.json({ success: false, message: "Reply message is required" });
    }

    // Find the contact message
    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact message not found" });
    }

    // Create email transporter
    // You can use Gmail, Outlook, or other email services
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    let transporter;

    // Handle Outlook365/Office365 with custom SMTP configuration
    if (emailService === 'Outlook365' || emailService === 'Office365') {
      transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        },
        logger: true, // Enable logging
        debug: true, // Enable debug output
      });

      // Verify connection
      await transporter.verify();
      console.log('✅ Email server is ready to send messages');
    } else {
      // Use default service configuration (Gmail, Yahoo, etc.)
      transporter = nodemailer.createTransport({
        service: emailService,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // Verify connection
      await transporter.verify();
      console.log('✅ Email server is ready to send messages');
    }

    // Email options with proper sender name
    const mailOptions = {
      from: {
        name: 'Wachemo University Online Voting System',
        address: process.env.EMAIL_USER
      },
      replyTo: process.env.EMAIL_USER,
      to: contact.email,
      subject: `Re: Your message to Online Voting System`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Online Voting System - Admin Response</h2>
        <p>Dear ${contact.name},</p>
        <p>Thank you for contacting us. Here is our response to your message:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Original Message:</h3>
          <p style="color: #666;">${contact.message}</p>
        </div>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <h3 style="margin-top: 0;">Our Response:</h3>
          <p>${replyMessage.replace(/\n/g, '<br>')}</p>
        </div>
        
        <p>If you have any further questions, please don't hesitate to contact us again.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">
          This is an automated response from Online Voting System.<br>
          Please do not reply directly to this email.
        </p>
      </div>
    `
    };

    // Send email
    console.log(`📧 Sending email to: ${contact.email}`);
    console.log(`📧 From: ${process.env.EMAIL_USER}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);

    // Update contact status
    contact.status = "responded";
    await contact.save();

    res.json({
      success: true,
      message: "Reply sent successfully to " + contact.email
    });

  } catch (err) {
    console.error("❌ Email sending error:", err);
    console.error("❌ Error details:", err.message);

    // Check if it's an authentication error
    if (err.message && (err.message.includes("Invalid login") || err.message.includes("authentication"))) {
      return res.status(500).json({
        success: false,
        message: "Email configuration error. Please check your email credentials in the .env file."
      });
    }

    // Check if it's a connection error
    if (err.code && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
      return res.status(500).json({
        success: false,
        message: "Cannot connect to email server. Please check your internet connection and email settings."
      });
    }

    res.status(500).json({
      success: false,
      message: "Error sending reply: " + err.message
    });
  }
});

// 🔄 Update contact message status
app.patch("/contact/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'responded'].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact message not found" });
    }

    res.json({ success: true, message: "Status updated", contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
});

// 🗑️ Delete contact message
app.delete("/contact/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid contact ID" });
    }

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact message not found" });
    }

    res.json({
      success: true,
      message: "Contact message deleted successfully"
    });
  } catch (err) {
    console.error("Delete contact error:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting contact message"
    });
  }
});

// -------------------------------------------

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const duration = (Date.now() - startTime) / 1000;
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🚀 Startup time: ${duration.toFixed(3)}s`);
});
