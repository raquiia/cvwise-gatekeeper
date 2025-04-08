
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractTextFromPDF } from "./pdf-extractor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const requestData = await req.json();
    const { pdfUrl, resumeId } = requestData;
    
    if (!pdfUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "L'URL du PDF est requise"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    console.log("Démarrage de l'extraction de texte pour:", pdfUrl);

    // Ensure URL is correctly formed for the Supabase Storage
    const correctedUrl = ensureValidUrl(pdfUrl);
    console.log("URL corrigée pour extraction:", correctedUrl);

    // Vérifier si l'URL est publique/accessible
    try {
      const checkResponse = await fetch(correctedUrl, { 
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!checkResponse.ok) {
        throw new Error(`PDF non accessible, code: ${checkResponse.status}`);
      }
    } catch (urlError) {
      console.error("Erreur lors de la vérification d'accessibilité:", urlError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `URL inaccessible: ${urlError.message}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }

    // Récupérer le PDF avec une meilleure gestion des erreurs et retry
    let response = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(correctedUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });
        
        if (response.ok) break;
        
        console.log(`Tentative ${retryCount + 1}/${maxRetries} a échoué avec le status ${response.status}. Réessai...`);
        retryCount++;
        
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (fetchError) {
        console.error(`Erreur de fetch (tentative ${retryCount + 1}):`, fetchError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Échec du téléchargement du PDF après ${maxRetries} tentatives: ${response?.status || 'Erreur réseau'}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }
    
    // Convertir en ArrayBuffer
    let pdfData: ArrayBuffer;
    try {
      pdfData = await response.arrayBuffer();
    } catch (convError) {
      console.error("Erreur lors de la conversion en ArrayBuffer:", convError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Impossible de lire les données du PDF"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }
    
    if (!pdfData || pdfData.byteLength === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Le fichier PDF est vide ou corrompu"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    console.log(`PDF téléchargé, taille: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
    
    // Limiter la taille du PDF pour éviter les timeouts
    const maxSizeKB = 10 * 1024; // 10 MB
    if (pdfData.byteLength > maxSizeKB * 1024) {
      console.log(`PDF trop volumineux (${(pdfData.byteLength / 1024 / 1024).toFixed(2)} MB), extraction limitée`);
    }
    
    // Extraction du texte avec notre méthode simplifiée
    let extractedText = "";
    let pageCount = 0;
    
    try {
      const result = await extractTextFromPDF(pdfData);
      extractedText = result.extractedText;
      pageCount = result.pageCount;
    } catch (extractError) {
      console.error("Erreur lors de l'extraction:", extractError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur d'extraction: ${extractError.message}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }
    
    if (!extractedText || extractedText.trim().length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Aucun texte n'a pu être extrait du PDF"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    console.log(`Extraction réussie, ${pageCount} page(s), longueur du texte: ${extractedText.length} caractères`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          text: extractedText,
          pageCount: pageCount,
          resumeId: resumeId,
          fileSize: pdfData.byteLength
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("Erreur lors de l'extraction du texte:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Une erreur est survenue lors de l'extraction du texte"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});

/**
 * Ensures the URL is valid for Supabase storage
 * Handles cases where the URL might be missing parts or using incorrect format
 */
function ensureValidUrl(url: string): string {
  // If the URL is already fully qualified, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path, convert to absolute
  if (url.startsWith('/')) {
    // Get the Supabase URL from the request origin or environment
    const projectRef = Deno.env.get('SUPABASE_URL') || '';
    return projectRef + url;
  }
  
  // Handle storage URLs without http prefix
  if (url.includes('storage/v1/object')) {
    const projectRef = Deno.env.get('SUPABASE_URL') || '';
    return projectRef + '/' + url;
  }
  
  // Default case, just return the original
  return url;
}
