
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
export const extractResumeText = async (resumeId: string): Promise<TextExtractionResult> => {
  try {
    console.log('Starting text extraction for resume:', resumeId);
    
    // Get the file path from the database
    console.log('Fetching resume data from database');
    const { data: resumeData, error: fetchError } = await supabase
      .from("resumes")
      .select("file_path")
      .eq("id", resumeId)
      .single();
      
    if (fetchError) {
      console.error('Failed to get resume data:', fetchError);
      throw new Error('Impossible de récupérer les informations du CV');
    }
    
    if (!resumeData || !resumeData.file_path) {
      throw new Error('Chemin du fichier non trouvé pour ce CV');
    }
    
    const filePath = resumeData.file_path;
    console.log('Got file path from database:', filePath);
    
    // Get the public URL for the file
    console.log('Getting public URL for file path:', filePath);
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);
      
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL for file');
      throw new Error('Impossible d\'obtenir l\'URL du fichier');
    }
    
    console.log('Public URL obtained:', urlData.publicUrl);
    
    // Call the edge function with the PDF URL
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
    
    // Check that extracted text is not empty
    if (!data.data?.text || data.data.text.trim() === '') {
      throw new Error('Le texte extrait est vide');
    }
    
    // Return the extracted text
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
