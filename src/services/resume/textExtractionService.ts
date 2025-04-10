
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Extraire le texte d'un CV à partir de son ID
 */
export const extractResumeText = async (resumeId: string, filePath?: string): Promise<{ success: boolean; message?: string; text?: string }> => {
  try {
    console.log('Starting text extraction for resume:', resumeId);
    
    // If filePath is not provided, try to get it from the database
    let path = filePath;
    
    if (!path) {
      try {
        // Fetch the resume data to get the file path
        const { data: resumeData, error: resumeError } = await supabase
          .from("resumes")
          .select("file_path")
          .eq("id", resumeId)
          .maybeSingle();
          
        if (resumeError) {
          // Check specifically for the recursion error
          if (resumeError.message && resumeError.message.includes('recursion')) {
            console.warn('Detected recursion error, trying alternative method');
            
            // Try using the RPC instead
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_resume_by_id', { p_resume_id: resumeId });
              
            if (rpcError || !rpcData) {
              console.error('Failed to get resume data via RPC:', rpcError);
              throw new Error('Impossible de récupérer les informations du CV');
            }
            
            // Handle both array and object responses properly
            if (Array.isArray(rpcData)) {
              if (rpcData.length > 0) {
                path = rpcData[0].file_path;
              } else {
                throw new Error('Aucune donnée de CV trouvée');
              }
            } else {
              // Direct object access if not an array
              // Add type assertion to help TypeScript understand the object structure
              const resumeObj = rpcData as { file_path: string };
              path = resumeObj.file_path;
            }
          } else {
            console.error('Failed to get resume data:', resumeError);
            throw new Error('Impossible de trouver le CV avec cet identifiant');
          }
        } else if (!resumeData) {
          throw new Error('CV non trouvé');
        } else {
          path = resumeData.file_path;
        }
      } catch (dbError) {
        console.error('Database error when fetching resume:', dbError);
        throw dbError;
      }
      
      if (!path) {
        throw new Error('Chemin du fichier non trouvé pour ce CV');
      }
    }
    
    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(path);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for file');
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }
    
    // Appel à l'edge function d'extraction de texte
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
    toast({
      title: "Échec de l'extraction",
      description: error.message || "Une erreur est survenue lors de l'extraction du texte",
      variant: "destructive",
    });
    return { 
      success: false, 
      message: error.message || "Échec de l'extraction du texte"
    };
  }
};
