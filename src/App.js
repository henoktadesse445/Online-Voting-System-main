import React, { Suspense, lazy } from 'react';
import {BrowserRouter,Route,Routes,Navigate} from 'react-router-dom';
import './App.css';
const Home = lazy(() => import('./components/Home/Home'));
const AdminLogin = lazy(() => import('./components/Sign/AdminLogin'));
const Login = lazy(() => import('./components/Sign/Login'));
const User = lazy(() => import('./components/User/User'));
const Signup = lazy(() => import('./components/Sign/Signup'));
const NewVoters = lazy(() => import('./components/NewDashboard/scenes/voters/NewVoters'));
const Vote = lazy(() => import('./components/User/Components/Voter/Vote'));
const EditProfile = lazy(() => import('./components/User/Components/EditProfile/EditProfile'));
const ElectionResults = lazy(() => import('./components/User/Components/Results/ElectionResults'));
const New = lazy(() => import('./components/NewDashboard/New'));
const NewCandidates = lazy(() => import('./components/NewDashboard/scenes/candidates/NewCandidates'));
const Calendar = lazy(() => import('./components/NewDashboard/scenes/calendar/Calendar'));
const Line = lazy(() => import('./components/NewDashboard/scenes/line/Line'));
const Pie = lazy(() => import('./components/NewDashboard/scenes/pie/Pie'));
const Result = lazy(() => import('./components/NewDashboard/scenes/result/Result'));
const ContactMessages = lazy(() => import('./components/NewDashboard/scenes/contacts/ContactMessages'));
const VotingSettings = lazy(() => import('./components/NewDashboard/scenes/settings/VotingSettings'));
const PendingCandidates = lazy(() => import('./components/NewDashboard/scenes/candidates/PendingCandidates'));
const CandidateRegister = lazy(() => import('./components/Sign/CandidateRegister'));
const StudentListUpload = lazy(() => import('./components/NewDashboard/scenes/students/StudentListUpload'));
const StudentListInfo = lazy(() => import('./components/NewDashboard/scenes/students/StudentListInfo'));

const Routing = ()=>{

  return(
    <Suspense fallback={<div style={{padding:'20px',textAlign:'center'}}>Loading...</div>}>
    <Routes>
      <Route exact path="/" element = {<Home />} />
      <Route path='/Signup' element = {<Signup/>} />
      <Route path="/Login" element = {<Login/>} />
      <Route path="/AdminLogin" element = {<AdminLogin/>} />
      <Route path="/Admin" element = {<New/>} />
      <Route path="/LineChart" element = {<Line/>} />
      <Route path="/BarChart" element = {<Result/>} />
      <Route path="/PieChart" element = {<Pie/>} />
      <Route path="/Voters" element = {<NewVoters/>} />
      <Route path="/Candidate" element = {<NewCandidates/>} />
      <Route path="/calendar" element ={<Calendar/>} />
      <Route path="/Edit" element ={<EditProfile/>} />
      <Route path="/User" element = {<User/>} />
      <Route path="/Vote" element = {<Vote/>} />
      <Route path="/Results" element = {<ElectionResults/>} />
      <Route path="/contacts" element = {<ContactMessages/>}/>
      <Route path="/votingSettings" element = {<VotingSettings/>}/>
      <Route path="/pendingCandidates" element = {<PendingCandidates/>}/>
      <Route path="/registerCandidate" element = {<CandidateRegister/>}/>
      <Route path="/studentListUpload" element = {<StudentListUpload/>}/>
      <Route path="/studentListInfo" element = {<StudentListInfo/>}/>
      <Route path="/upcoming" element = {<Navigate to="/votingSettings" replace />}/>
    </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routing />      
    </BrowserRouter>
  );
}

export default App;
