# Online Voting System

This repository contains the source code for an Online Voting System developed using the MERN stack (MongoDB, Express.js, React.js, Node.js). The system allows users to participate in various types of online voting, such as elections, polls, surveys, and more.


## Features
- **User Authentication:** Secure user authentication and authorization system.
- **Voting Dashboard:** Interactive dashboard for users to view ongoing and upcoming voting events.
- **Voting Interface:** Intuitive interface for users to cast their votes.
- **Admin Panel:** Admin interface to create, manage, and monitor voting events.
- **Real-time Updates:** Real-time updates using WebSocket for instant notifications on voting results.
- **Data Security:** Implementation of security measures to ensure data privacy and integrity.

## Technologies Used
- **Frontend:** React.js for building the user interface.
- **Backend:** Node.js and Express.js for server-side logic.
- **Database:** MongoDB for storing user data, voting events, and results.
- **Authentication:** JSON Web Tokens (JWT) for user authentication.
- **Real-time Updates:** WebSocket for real-time communication between clients and the server.
- **UI Framework:** Material-UI for designing responsive and modern UI components.

## Getting Started
To run the project locally, follow these steps:

1. Clone this repository to your local machine.
2. Navigate to the project directory.
3. Install dependencies for both the server and client:
  - cd server
  - npm install
  - cd ../client
  - npm install

4. Configure environment variables:
Create a .env file in the server directory.
Add necessary environment variables (e.g., MongoDB connection string, JWT secret).

5. Start the server:
cd server
npm start

6. Start the client:
cd ../client
npm start

## Contributing
Contributions are welcome! Please feel free to submit bug reports, feature requests, or pull requests.

- Fork the repository.
- Create a new branch (git checkout -b feature/fooBar).
- Commit your changes (git commit -am 'Add some fooBar').
- Push to the branch (git push origin feature/fooBar).
- Create a new Pull Request.

## Windows — quick run helpers

If you're on Windows and PowerShell blocks npm script wrappers (common error: "npm.ps1 cannot be loaded because running scripts is disabled"), use the included batch helpers to run the project without changing system policies.

Files added:

- `start-server.bat` — installs server dependencies if needed and starts the backend using `npm.cmd`.
- `start-client.bat` — installs client dependencies if needed and starts the React frontend using `npm.cmd`.
- `server/.env.example` — example environment variables for the backend.

Steps (Windows):

1) Copy the example env file and edit it:

  - Copy `server\.env.example` to `server\.env` and set `MONGO_URI` (e.g., `mongodb://localhost:27017/online-voting`).

2) Start the backend (in one terminal):

  - Double-click `start-server.bat` or run it from PowerShell/cmd:

```powershell
cd 'C:\Users\heni\Downloads\Telegram Desktop\Online-Voting-System-main'
.\start-server.bat
```

3) Start the frontend (in another terminal):

```powershell
cd 'C:\Users\heni\Downloads\Telegram Desktop\Online-Voting-System-main'
.\start-client.bat
```

If you prefer to enable PowerShell scripts instead, you can set a per-user policy (not required if using the batch files):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

If you run into database connection issues, confirm `MONGO_URI` is correct and MongoDB is running. For email features (OTP/contact), set `EMAIL_USER` and `EMAIL_PASSWORD` in `server/.env` (use a Gmail App Password if using Gmail with 2FA).

If anything fails when you run the batch files, paste the terminal output here and I'll diagnose the next steps (DB, missing env, dependency errors, etc.).
