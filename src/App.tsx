
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

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
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
      
      {/* Nouvelles routes pour les offres d'emploi */}
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
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute>
          <AllUsers />
        </ProtectedRoute>
      } />

      {/* Nouvelle route pour les use cases */}
      <Route path="/usecases" element={<UseCases />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Toaster />
    <Sonner />
  </TooltipProvider>
);

export default App;
