
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TextExtractionResult {
  success: boolean;
  message?: string;
  text?: string;
}

/**
 * Extraire le texte d'un CV à partir de son ID
 */
export const extractResumeText = async (resumeId: string, filePath?: string): Promise<TextExtractionResult> => {
  try {
    console.log('Starting text extraction for resume:', resumeId);
    
    // If filePath is not provided, try to get it from the database
    let path = filePath;
    
    if (!path) {
      try {
        console.log('File path not provided, fetching from database');
        
        // Try to get the resume data using the RPC function first
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_resume_by_id', { p_resume_id: resumeId });
          
        if (rpcError) {
          console.error('Failed to get resume data via RPC:', rpcError);
          throw new Error('Impossible de récupérer les informations du CV via RPC');
        }
        
        if (!rpcData) {
          throw new Error('Aucune donnée de CV trouvée');
        }
        
        // Handle the response which could be an array or a single object
        if (Array.isArray(rpcData)) {
          if (rpcData.length === 0) {
            throw new Error('Aucune donnée de CV trouvée');
          }
          path = rpcData[0].file_path;
          console.log('Got file path from RPC array response:', path);
        } else {
          // Type assertion to help TypeScript understand the object structure
          const resumeObj = rpcData as unknown as { file_path: string };
          path = resumeObj.file_path;
          console.log('Got file path from RPC object response:', path);
        }
      } catch (rpcError) {
        console.error('RPC error, trying direct query as fallback:', rpcError);
        
        // Fallback to direct query if RPC fails
        try {
          const { data: resumeData, error: queryError } = await supabase
            .from("resumes")
            .select("file_path")
            .eq("id", resumeId)
            .single();
            
          if (queryError) {
            console.error('Failed to get resume data via direct query:', queryError);
            throw queryError;
          }
          
          if (!resumeData) {
            throw new Error('CV non trouvé');
          }
          
          path = resumeData.file_path;
          console.log('Got file path from direct query:', path);
        } catch (queryError) {
          console.error('All attempts to get file path failed:', queryError);
          throw new Error('Impossible de trouver le chemin du fichier pour ce CV');
        }
      }
      
      if (!path) {
        throw new Error('Chemin du fichier non trouvé pour ce CV');
      }
    }
    
    // Obtenir l'URL publique du fichier
    console.log('Getting public URL for file path:', path);
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(path);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for file');
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }
    
    console.log('Public URL obtained:', urlData.publicUrl);
    
    // Appel à l'edge function d'extraction de texte
    console.log('Invoking extract-cv-text edge function');
    const { data, error } = await supabase.functions.invoke('extract-cv-text', {
      body: { 
        pdfUrl: urlData.publicUrl,
        resumeId: resumeId
      }
    });
    
    if (error) {
      console.error('Error invoking extract-cv-text function:', error);
      throw new Error(`Erreur lors de l'extraction du texte: ${error.message}`);
    }
    
    if (!data || !data.success) {
      console.error('Text extraction failed:', data?.error || 'Raison inconnue');
      throw new Error(data?.error || 'Extraction du texte échouée');
    }
    
    console.log('Text extraction successful, length:', data.data?.text?.length || 0);
    console.log('Sample of extracted text:', data.data?.text?.substring(0, 500) + '...');
    
    // Vérifier que le texte extrait n'est pas vide
    if (!data.data?.text || data.data.text.trim() === '') {
      throw new Error('Le texte extrait est vide');
    }
    
    // Retourner le texte extrait
    return { 
      success: true, 
      message: "Texte extrait avec succès",
      text: data.data?.text || ''
    };
  } catch (error: any) {
    console.error('Text extraction error:', error);
    return { 
      success: false, 
      message: error.message || "Échec de l'extraction du texte"
    };
  }
};
