import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegistrationPending from "./pages/RegistrationPending";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import CandidateEdit from "./pages/CandidateEdit";
import Resumes from "./pages/Resumes";
import ResumeUpload from "./pages/ResumeUpload";
import JobOffers from "./pages/JobOffers";
import JobOfferCreate from "./pages/JobOfferCreate";
import JobOfferEdit from "./pages/JobOfferEdit";
import JobOfferDetail from "./pages/JobOfferDetail";
import Admin from "./pages/Admin";
import AllUsers from "./pages/AllUsers";
import NotFound from "./pages/NotFound";
import UseCases from "./pages/UseCases";

// Loading component
const Loading = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-sand/30">
    <div className="w-16 h-16 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-navy">Chargement...</p>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Allow access to Admin pages for all authenticated users
  // Admin functionality will be controlled inside the Admin component
  return <>{children}</>;
};

const App = () => (
  <TooltipProvider>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/registration-pending" element={<RegistrationPending />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/candidates" element={
        <ProtectedRoute>
          <Candidates />
        </ProtectedRoute>
      } />
      <Route path="/candidates/:candidateId" element={
        <ProtectedRoute>
          <CandidateDetail />
        </ProtectedRoute>
      } />
      <Route path="/candidates/:candidateId/edit" element={
        <ProtectedRoute>
          <CandidateEdit />
        </ProtectedRoute>
      } />
      <Route path="/candidates/:candidateId/job-match" element={
        <ProtectedRoute>
          <CandidateDetail />
        </ProtectedRoute>
      } />
      <Route path="/resumes" element={
        <ProtectedRoute>
          <Resumes />
        </ProtectedRoute>
      } />
      <Route path="/resumes/upload" element={
        <ProtectedRoute>
          <ResumeUpload />
        </ProtectedRoute>
      } />
      
      {/* Job offer routes */}
      <Route path="/job-offers" element={
        <ProtectedRoute>
          <JobOffers />
        </ProtectedRoute>
      } />
      <Route path="/job-offers/create" element={
        <ProtectedRoute>
          <JobOfferCreate />
        </ProtectedRoute>
      } />
      <Route path="/job-offers/:jobOfferId" element={
        <ProtectedRoute>
          <JobOfferDetail />
        </ProtectedRoute>
      } />
      <Route path="/job-offers/:jobOfferId/edit" element={
        <ProtectedRoute>
          <JobOfferEdit />
        </ProtectedRoute>
      } />
      
      {/* Admin routes - always accessible for authenticated users */}
      <Route path="/admin" element={
        <AdminRoute>
          <Admin />
        </AdminRoute>
      } />
      <Route path="/admin/users" element={
        <AdminRoute>
          <AllUsers />
        </AdminRoute>
      } />

      {/* Public routes */}
      <Route path="/usecases" element={<UseCases />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Toaster />
    <Sonner />
  </TooltipProvider>
);

export default App;
