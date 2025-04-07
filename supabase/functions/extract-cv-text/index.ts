
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js";

// Configurer le worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { pdfUrl, resumeId } = await req.json();
    
    if (!pdfUrl && !resumeId) {
      return new Response(
        JSON.stringify({ error: "Une URL PDF ou un ID de CV est requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Créer un client Supabase avec la clé service
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    let pdfData: ArrayBuffer;
    let fileName = "document.pdf";

    // Obtenir le fichier PDF, soit par URL soit par ID de CV
    if (pdfUrl) {
      // Récupérer le PDF depuis une URL
      const response = await fetch(pdfUrl, {
        headers: {
          "Accept": "application/pdf",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Échec de récupération du PDF: ${response.status} ${response.statusText}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      pdfData = await response.arrayBuffer();
      fileName = pdfUrl.split("/").pop()?.split("?")[0] || fileName;
    } else {
      // Récupération depuis Supabase Storage via l'ID du CV
      try {
        // Créer client Supabase
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.33.2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Récupérer les informations du CV
        const { data: resumeData, error: resumeError } = await supabase
          .from("resumes")
          .select("file_path, file_name")
          .eq("id", resumeId)
          .single();
          
        if (resumeError || !resumeData) {
          throw new Error(resumeError?.message || "CV introuvable");
        }
        
        // Télécharger le fichier depuis storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from("resumes")
          .download(resumeData.file_path);
          
        if (fileError || !fileData) {
          throw new Error(fileError?.message || "Fichier introuvable");
        }
        
        pdfData = await fileData.arrayBuffer();
        fileName = resumeData.file_name;
      } catch (supabaseError) {
        return new Response(
          JSON.stringify({ error: `Erreur d'accès au fichier: ${supabaseError.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    if (!pdfData || pdfData.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: "Les données PDF sont vides" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extraire le texte
    try {
      const extractedText = await extractTextFromPDFBuffer(new Uint8Array(pdfData));
      
      // Retourner le résultat
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            text: extractedText.extractedText,
            pageCount: extractedText.pageCount,
            metadata: {
              fileName: fileName,
              fileSize: (pdfData.byteLength / 1024).toFixed(2) + " KB",
              timestamp: new Date().toISOString(),
              extractionMethod: "pdfjs"
            }
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (extractionError) {
      // Tenter la méthode de secours
      try {
        const fallbackText = await fallbackExtraction(new Uint8Array(pdfData));
        
        // Retourner le résultat de la méthode de secours
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              text: fallbackText,
              pageCount: -1, // Inconnu avec la méthode de secours
              metadata: {
                fileName: fileName,
                fileSize: (pdfData.byteLength / 1024).toFixed(2) + " KB",
                timestamp: new Date().toISOString(),
                extractionMethod: "fallback"
              }
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (fallbackError) {
        // Si toutes les méthodes échouent
        return new Response(
          JSON.stringify({ error: `Échec d'extraction du texte: ${extractionError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error: any) {
    console.error("Erreur dans la fonction extract-cv-text:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Extrait le texte d'un PDF à partir d'un ArrayBuffer
 */
async function extractTextFromPDFBuffer(pdfData: Uint8Array): Promise<{ extractedText: string, pageCount: number }> {
  try {
    // Charger le document PDF avec PDF.js
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    // Extraire le texte de chaque page
    const textContent: string[] = [];
    
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => 'str' in item ? item.str : '')
          .join(' ');
        
        textContent.push(pageText);
      } catch (pageError) {
        console.warn(`Error extracting text from page ${i}:`, pageError);
        textContent.push(`[Échec d'extraction - page ${i}]`);
      }
    }
    
    // Joindre toutes les pages avec des sauts de ligne
    let extractedText = textContent.join('\n\n');
    
    // Nettoyer le texte extrait
    extractedText = cleanExtractedText(extractedText);
    
    return { extractedText, pageCount: numPages };
  } catch (error) {
    console.error('Error in extractTextFromPDFBuffer:', error);
    throw error;
  }
}

/**
 * Méthode d'extraction de secours pour les PDFs problématiques
 */
async function fallbackExtraction(pdfData: Uint8Array): Promise<string> {
  try {
    // Convertir Uint8Array en string pour l'analyse
    const pdfString = new TextDecoder().decode(pdfData);
    
    // Utiliser regex pour extraire le texte entre les balises stream et endstream
    const textBlocks: string[] = [];
    const streamRegex = /stream([\s\S]*?)endstream/g;
    let match;
    
    while ((match = streamRegex.exec(pdfString)) !== null) {
      if (match[1] && match[1].length > 10) {
        // Nettoyer les caractères non imprimables
        const cleanedText = match[1]
          .replace(/[^\x20-\x7E\r\n]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
          
        if (cleanedText.length > 20) {
          textBlocks.push(cleanedText);
        }
      }
    }
    
    let extractedText = textBlocks.join('\n\n');
    
    // Appliquer le nettoyage standard
    extractedText = cleanExtractedText(extractedText);
    
    return extractedText || "[Aucun texte extrait via la méthode de secours]";
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    throw error;
  }
}

/**
 * Nettoie le texte extrait pour le rendre plus utilisable
 */
function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    // Normaliser les espaces et sauts de ligne
    .replace(/\s+/g, ' ')
    .replace(/(\n\s*){3,}/g, '\n\n')
    // Supprimer les caractères non imprimables
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Nettoyer les artefacts PDF courants
    .replace(/[^\w\s.,;:'\-+()[\]{}?!@#$%^&*=\/\\|<>"éèêëàâäôöûüùïîçÉÈÊËÀÂÄÔÖÛÜÙÏÎÇ]/g, '')
    .trim();
}
