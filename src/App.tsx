
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ActiveJobProvider } from '@/context/ActiveJobContext';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import RegistrationPending from '@/pages/RegistrationPending';
import Dashboard from '@/pages/Dashboard';
import Candidates from '@/pages/Candidates';
import CandidateDetail from '@/pages/CandidateDetail';
import Resumes from '@/pages/Resumes';
import ResumeUpload from '@/pages/ResumeUpload';
import JobOffers from '@/pages/JobOffers';
import JobOfferCreate from '@/pages/JobOfferCreate';
import JobOfferEdit from '@/pages/JobOfferEdit';
import JobOfferDetail from '@/pages/JobOfferDetail';
import Admin from '@/pages/Admin';
import RecruiterDetail from '@/pages/RecruiterDetail';
import AllUsers from '@/pages/AllUsers';
import UseCases from '@/pages/UseCases';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ActiveJobProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/registration-pending" element={<RegistrationPending />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/candidates/:id" element={<CandidateDetail />} />
              <Route path="/resumes" element={<Resumes />} />
              <Route path="/resumes/upload" element={<ResumeUpload />} />
              <Route path="/job-offers" element={<JobOffers />} />
              <Route path="/job-offers/create" element={<JobOfferCreate />} />
              <Route path="/job-offers/:id/edit" element={<JobOfferEdit />} />
              <Route path="/job-offers/:id" element={<JobOfferDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/recruiter/:id" element={<RecruiterDetail />} />
              <Route path="/all-users" element={<AllUsers />} />
              <Route path="/use-cases" element={<UseCases />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </ActiveJobProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
