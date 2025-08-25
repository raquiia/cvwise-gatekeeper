import { supabase } from '@/integrations/supabase/client';

export interface CandidateDocument {
  id: string;
  candidate_id: string;
  user_id: string;
  document_type: 'cv' | 'proposal' | 'recommendation_letter' | 'salary_grid' | 'case_study';
  file_name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPES = {
  cv: 'CV',
  proposal: 'Proposition commerciale',
  recommendation_letter: 'Lettre de recommandation',
  salary_grid: 'Grille salariale',
  case_study: 'Résultats du case study'
} as const;

class CandidateDocumentsService {
  async getDocumentsByCandidate(candidateId: string): Promise<CandidateDocument[]> {
    const { data, error } = await supabase
      .from('candidate_documents')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('status', 'active')
      .order('upload_date', { ascending: false });

    if (error) {
      throw new Error(`Error fetching documents: ${error.message}`);
    }

    return (data || []) as CandidateDocument[];
  }

  async uploadDocument(
    candidateId: string,
    file: File,
    documentType: CandidateDocument['document_type']
  ): Promise<CandidateDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${candidateId}/${documentType}_${Date.now()}.${fileExt}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('candidate-documents')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    // Save document metadata
    const { data, error } = await supabase
      .from('candidate_documents')
      .insert({
        candidate_id: candidateId,
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('candidate-documents').remove([fileName]);
      throw new Error(`Error saving document metadata: ${error.message}`);
    }

    return data as CandidateDocument;
  }

  async downloadDocument(document: CandidateDocument): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('candidate-documents')
      .download(document.file_path);

    if (error) {
      throw new Error(`Error downloading document: ${error.message}`);
    }

    return data;
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Get document details first
    const { data: document, error: fetchError } = await supabase
      .from('candidate_documents')
      .select('file_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new Error(`Error fetching document: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('candidate-documents')
      .remove([document.file_path]);

    if (storageError) {
      console.warn('Error deleting file from storage:', storageError.message);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('candidate_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Error deleting document: ${dbError.message}`);
    }
  }

  async getDocumentUrl(document: CandidateDocument): Promise<string> {
    const { data, error } = await supabase.storage
      .from('candidate-documents')
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (error) {
      throw new Error(`Error creating signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  getDocumentTypeLabel(type: CandidateDocument['document_type']): string {
    return DOCUMENT_TYPES[type];
  }
}

export const candidateDocumentsService = new CandidateDocumentsService();