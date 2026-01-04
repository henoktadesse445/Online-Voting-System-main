const startTime = Date.now();
const express = require("express");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
require("dotenv").config();

const connectDB = require("./config/db");
const routes = require("./routes");
const legacyRoutes = require("./routes/legacyRoutes");

const app = express();

// Connect to Database
connectDB();

// Compression
app.use(compression({
    level: 6,
    threshold: 1024
}));

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT", "OPTIONS"],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// API Routes
app.use("/api", routes);
app.use("/", legacyRoutes); // Support old frontend paths

// Base route
app.get("/", (req, res) => {
    res.json({ message: "Wachemo University Voting System API" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🚀 Startup time: ${duration.toFixed(3)}s`);
});
