# Online Voting Management System
A professional, secure, and modern MERN stack application for end-to-end election management.

## 📖 Documentation
For a detailed overview of the system architecture, user roles, security protocols, and performance features, please refer to the:
👉 **[Comprehensive System Description](system_description.md)**

---

## 🏗️ Project Structure
The project is organized into a clean client/server hierarchy:
- `/client` - React frontend (Vite/CRA based).
- `/server` - Node.js/Express.js backend API.

## 🚀 Quick Start
The system is managed from the root for maximum efficiency:

1. **Install All Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Configure Environment**:
   - Navigate to `/server`.
   - Copy `.env.example` to `.env`.
   - Set your `MONGO_URI` and `EMAIL` credentials.

3. **Run Concurrently**:
   ```bash
   npm start
   ```
   *This single command starts both the backend (Port 5000) and frontend (Port 3000) simultaneously.*

---

## 💎 Core Features
- **Admin Dashboard**: Real-time analytics and data control.
- **OTP Authentication**: Secure 6-digit verification via email.
- **Dynamic Ranking**: Automatic position assignment (President, VP, etc.) based on live vote totals.
- **Glassmorphic UI**: High-end, responsive design with dark/light mode support.

## 🛠️ Technologies
- **Frontend**: React, Material UI (MUI), Chart.js, Axios.
- **Backend**: Node.js, Express, MongoDB/Mongoose.
- **Security**: bcryptjs, OTP-verification, sanitized uploads.

---
*Developed for excellence in digital democracy.*
