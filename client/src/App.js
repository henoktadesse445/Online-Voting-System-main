import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import { ColorModeContext, useMode } from './components/NewDashboard/theme';
import { CssBaseline, ThemeProvider } from "@mui/material";
const Home = lazy(() => import('./components/Home/Home'));
const AdminLogin = lazy(() => import('./components/Sign/AdminLogin'));
const Login = lazy(() => import('./components/Sign/Login'));
const User = lazy(() => import('./components/User/User'));
const Vote = lazy(() => import('./components/User/Components/Voter/Vote'));
const EditProfile = lazy(() => import('./components/User/Components/EditProfile/EditProfile'));
const ElectionResults = lazy(() => import('./components/User/Components/Results/ElectionResults'));
const New = lazy(() => import('./components/NewDashboard/New'));
const NewDashBoard = lazy(() => import('./components/NewDashboard/scenes/dashboard/NewDashBoard'));
const NewCandidates = lazy(() => import('./components/NewDashboard/scenes/candidates/NewCandidates'));
const Calendar = lazy(() => import('./components/NewDashboard/scenes/calendar/Calendar'));
const Line = lazy(() => import('./components/NewDashboard/scenes/line/Line'));
const Pie = lazy(() => import('./components/NewDashboard/scenes/pie/Pie'));
const Result = lazy(() => import('./components/NewDashboard/scenes/result/Result'));
const ContactMessages = lazy(() => import('./components/NewDashboard/scenes/contacts/ContactMessages'));
const VotingSettings = lazy(() => import('./components/NewDashboard/scenes/settings/VotingSettings'));
const PendingCandidates = lazy(() => import('./components/NewDashboard/scenes/candidates/PendingCandidates'));
const StudentListInfo = lazy(() => import('./components/NewDashboard/scenes/students/StudentListInfo'));
const VotingReport = lazy(() => import('./components/NewDashboard/scenes/report/VotingReport'));
const ElectionHistory = lazy(() => import('./components/NewDashboard/scenes/history/ElectionHistory'));
const CandidateRegister = lazy(() => import('./components/Sign/CandidateRegister'));

const Routing = () => {

  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/AdminLogin" element={<AdminLogin />} />

        {/* 📋 Admin Dashboard Layout - Persistent Sidebar & Topbar */}
        <Route element={<New />}>
          <Route path="/Admin" element={<NewDashBoard />} />
          <Route path="/Candidate" element={<NewCandidates />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/LineChart" element={<Line />} />
          <Route path="/BarChart" element={<Result />} />
          <Route path="/PieChart" element={<Pie />} />
          <Route path="/contacts" element={<ContactMessages />} />
          <Route path="/votingSettings" element={<VotingSettings />} />
          <Route path="/pendingCandidates" element={<PendingCandidates />} />
          <Route path="/studentListInfo" element={<StudentListInfo />} />
          <Route path="/votingReport" element={<VotingReport />} />
          <Route path="/electionHistory" element={<ElectionHistory />} />
        </Route>

        <Route path="/Edit" element={<EditProfile />} />
        <Route path="/User" element={<User />} />
        <Route path="/Vote" element={<Vote />} />
        <Route path="/Results" element={<ElectionResults />} />
        <Route path="/registerCandidate" element={<CandidateRegister />} />
        <Route path="/upcoming" element={<Navigate to="/votingSettings" replace />} />
      </Routes>
    </Suspense>
  )
}

function App() {
  const [theme, colorMode] = useMode();

  // ⚡ Performance Optimization: Prefetch common routes on idle
  React.useEffect(() => {
    const prefetchRoutes = () => {
      // Prefetch commonly accessed routes
      import('./components/Sign/Login');
      import('./components/Home/Home');
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchRoutes, { timeout: 2000 });
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(prefetchRoutes, 1000);
    }
  }, []);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routing />
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
