import { Navigate, useRoutes } from 'react-router-dom'
import Home from '../pages/Home/Home.jsx'
import Login from '../pages/Login/Login.jsx'
import Register from '../pages/Register/Register.jsx'
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword.jsx'
import ResetPassword from '../pages/ResetPassword/ResetPassword.jsx'
import Profile from '../pages/Profile/Profile.jsx'
import ResumeUpload from '../pages/ResumeUpload/ResumeUpload.jsx'
import SkillExtraction from '../pages/SkillExtraction/SkillExtraction.jsx'
import Dashboard from '../pages/Dashboard/Dashboard.jsx'
import JobList from '../pages/JobList/JobList.jsx'
import JobDetails from '../pages/JobDetails/JobDetails.jsx'
import ApplyRedirect from '../pages/ApplyRedirect/ApplyRedirect.jsx'
import TodayDigest from '../pages/TodayDigest/TodayDigest.jsx'
import Applications from '../pages/Applications/Applications.jsx'


const AppRoutes = () =>
  useRoutes([
    { path: '/', element: <Home /> },
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/forgot-password', element: <ForgotPassword /> },
    { path: '/reset-password', element: <ResetPassword /> },
    { path: '/profile', element: <Profile /> },
    { path: '/resume-upload', element: <ResumeUpload /> },
    { path: '/skill-extraction', element: <SkillExtraction /> },
    { path: '/applications', element: <Applications /> },

    { path: '/dashboard', element: <Dashboard /> },
    { path: '/jobs', element: <JobList /> },
    { path: '/jobs/:id', element: <JobDetails /> },
    { path: '/today-digest', element: <TodayDigest /> },
    { path: '/apply', element: <ApplyRedirect /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ])

export default AppRoutes
