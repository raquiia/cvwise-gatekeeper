
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
      throw new Error("L'URL du PDF est requise");
    }
    
    console.log("Démarrage de l'extraction de texte pour:", pdfUrl);

    // Récupérer le PDF
    const response = await fetch(pdfUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
    });
    
    if (!response.ok) {
      throw new Error(`Échec du téléchargement du PDF: ${response.status} ${response.statusText}`);
    }
    
    // Convertir en ArrayBuffer
    const pdfData = await response.arrayBuffer();
    
    if (pdfData.byteLength === 0) {
      throw new Error("Le fichier PDF est vide");
    }
    
    console.log(`PDF téléchargé, taille: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
    
    // Extraction du texte
    const { extractedText, pageCount } = await extractTextFromPDF(pdfData);
    
    console.log(`Extraction réussie, ${pageCount} page(s), texte: ${extractedText.substring(0, 100)}...`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          text: extractedText,
          pageCount: pageCount,
          resumeId: resumeId
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
