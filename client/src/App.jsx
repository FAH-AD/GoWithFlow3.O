import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

// Layouts
import AdminLaouts from './Layouts/AdminLaouts';
import UserLayout from './Layouts/UserLayout';
import PublicLayouts from './Layouts/PublicLayouts';
import HowItWorks from './pages/how-it-works';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/AdminDashboard';
import Client from './pages/ClientDashboard';
import Freelancer from './pages/Freelancer';
import JobSearchPage from './pages/searchJob';
import AboutUs from './pages/AboutUs';
import ApplyOnJobPage from './pages/applyJob';
import PostJob from './pages/postJob';
import AdminUsers from './pages/Users';
import RoleSelection from './pages/RoleSelection';
import FreelancerRegister from './pages/freelancerRegister';
import ClientRegister from './pages/clientRegister';
import VerifyEmail from './pages/VerifyEmail';
import VerifyCompany from './pages/VerifyCompany';
import VerifyUsers from './pages/VerifyUser';
import ClientJobs from './pages/ClientJobs';
import JobBids from './pages/JobBids';
import FreelacnerProposals from './pages/FreelancerProposals';
import ProposalDetails from './pages/ProposalDetails';
import MessageTest from './pages/MessageTest';
import FreelancerProfile from './pages/FreelancerProfile';
import ClientProfile from './pages/ClientProfile';
import webSocketSingleton from './socket';
import SearchJobs from './pages/SearchJobs';
import SearchFreelancers from './pages/SearchFreelancers';
import ClientTeams from './pages/clientTeams';
import FreelancerTeams from './pages/FreelancerTeams';
import HireOffers from './pages/HireOffers';
import FreelancerJobs from './pages/FreelancerJobs';
import FreelancerJobDetails from './pages/FreealncerJobDetails';
import ClientJobDetails from './pages/ClientJobDetails';
import SupportPage from './pages/SupportPage';
import AdminIssueManagement from './pages/AdminIssueManagement';


// Forgot Password Flow
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/ResetPassword';

import Messaging from './pages/Messaging';

export default function App() {
  const token = localStorage.getItem('authToken');
  const user = useSelector((state) => state.Auth.user);

  const isFreelancer = user?.role === 'freelancer';
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (token) {
      webSocketSingleton.init(token);
    }
    return () => {
      webSocketSingleton.close();
    };
  }, [token]);
  useEffect(() => {
    console.log(user, "user in app")
  }, [user]);

   const RedirectLoggedInUser = () => {
    if (isFreelancer) return <Navigate to="/freelancer" />;
    if (isClient) return <Navigate to="/client" />;
    if (isAdmin) return <Navigate to="/admin" />;
    return <Home />;
  };
  return (
    <>
      <BrowserRouter>
        <Toaster />
        <Routes>

          {/* Public Routes */}
          {/* <Route path="/" element={<UserLayout />}>
            <Route index element={
              isFreelancer ? <Freelancer /> : 
              isClient ? <Client /> : 
              <Home />
            } />
          </Route> */}

         <Route path="/" element={<PublicLayouts />}>
            <Route index element={<RedirectLoggedInUser />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<RoleSelection />} />
            <Route path="signup/freelancer" element={ <FreelancerRegister />} />
            <Route path="signup/client" element={token ? <RedirectLoggedInUser /> : <ClientRegister />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="verify-code" element={<VerifyCode />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="about-us" element={<AboutUs />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLaouts />}>
            <Route index element={<Admin />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="verify-users" element={<VerifyUsers />} />
            <Route path="issues" element={<AdminIssueManagement />} />
          </Route>
          <Route path="/client" element={<UserLayout />}>
            <Route index element={<Client />} />
            <Route path="verify-company" element={<VerifyCompany />} />
            <Route path="post-job" element={<PostJob />} />
            <Route path="my-jobs" element={<ClientJobs />} />
            <Route path="search-freelancers" element={< SearchFreelancers />} />
            <Route path="jobs/:jobId" element={isClient ? <JobBids /> : <Navigate to="/" />} />
            <Route path="my-jobs/:jobId" element={<ClientJobDetails/>} />
            <Route path="my-teams/:jobId?" element={<ClientTeams />} />
            <Route path="message-test" element={<MessageTest />} />
            <Route path="messages" element={<Messaging />} />
            <Route path="messages/:conversationId" element={<Messaging />} />
            <Route path="profile/:userId" element={<ClientProfile />} />
            <Route path="support" element={<SupportPage />} />
          </Route>
          


          <Route path="/freelancer" element={<UserLayout />}>
            <Route index element={<Freelancer />} />
            <Route path="search-job" element={<SearchJobs/>} />
            <Route path="apply-job/:jobId" element={<ApplyOnJobPage />} />
            <Route path="my-proposals" element={<FreelacnerProposals />} />
             <Route path="my-jobs" element={<FreelancerJobs />} />
            <Route path="my-teams/:jobId?" element={<FreelancerTeams />} />
            <Route path="hire-offers" element={<HireOffers />} />
            <Route path="proposals/:jobId" element={<ProposalDetails />} />
            <Route path="jobs/:jobId" element={<FreelancerJobDetails />} />
            <Route path="messages" element={<Messaging />} />
            <Route path="messages/:conversationId" element={<Messaging />} />
            <Route path="profile/:userId" element={<FreelancerProfile />} />
            <Route path="support" element={<SupportPage />} />

          </Route>

          {/* Protected Freelancer Route */}
          
          

          {/* Protected Client Route */}
         


          {/* Chat Route - Available to Freelancer or Client */}
         

          {/* Optional: Catch-all route for 404 */}
          {/* <Route path="*" element={<NotFound />} /> */}

        </Routes>
      </BrowserRouter>
    </>
  );
}
