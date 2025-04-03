import { v4 as uuidv4 } from 'uuid';
import { resumeStorageService } from './storage/resumeStorageService';
import { supabase } from '@/integrations/supabase/client';
import { ensureResumesBucketExists } from '@/integrations/supabase/createBucket';

// Re-export des opérations sur les CV
import { uploadResume, getUserResumes, checkDuplicateResume } from './resume/resumeOperations';
import { downloadResume, deleteResume } from './resume/fileOperations';
import { analyzeResume } from './resume/analysisOperations';

// Re-export des interfaces
import type { ResumeData, CandidateData } from './data/resumeDataService';

// Re-export des services existants
import { resumeAnalysisService } from './analysis/resumeAnalysisService';
import { candidateDataService } from './data/candidateDataService';

export {
  // Resume operations
  uploadResume,
  getUserResumes,
  checkDuplicateResume,
  
  // File operations
  downloadResume,
  deleteResume,
  
  // Analysis operations
  analyzeResume,
  
  // Types
  ResumeData,
  CandidateData,
  
  // Other services
  resumeAnalysisService,
  candidateDataService
};
