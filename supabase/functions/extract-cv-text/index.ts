
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
    console.log("PDF extraction function invoked");
    
    const requestData = await req.json();
    const { pdfUrl, resumeId } = requestData;
    
    if (!pdfUrl) {
      console.error("Missing PDF URL in request");
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
    
    console.log(`Starting text extraction for PDF: ${resumeId || 'unknown'}`);
    
    try {
      // Get file directly from the URL with cache busting
      const timestamp = Date.now();
      const urlWithCache = new URL(pdfUrl);
      urlWithCache.searchParams.append('_', timestamp.toString());
      
      console.log(`Fetching PDF from: ${urlWithCache.toString()}`);
      
      // Download the PDF with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      try {
        // Download the PDF
        const response = await fetch(urlWithCache.toString(), {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Failed to download PDF: ${response.status} ${response.statusText}`);
          throw new Error(`Impossible de télécharger le PDF: ${response.status} ${response.statusText}`);
        }
        
        // Convert to ArrayBuffer
        const pdfData = await response.arrayBuffer();
        
        if (!pdfData || pdfData.byteLength === 0) {
          console.error("PDF data is empty");
          throw new Error("Le fichier PDF est vide");
        }
        
        console.log(`PDF downloaded, size: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
        
        // Extract text with our improved methods
        const result = await extractTextFromPDF(pdfData);
        const extractedText = result.extractedText;
        const pageCount = result.pageCount;
        
        console.log(`Extraction complete: ${pageCount} pages, text length: ${extractedText.length} chars`);
        
        // Check if we got any meaningful text 
        if (!extractedText || extractedText.trim().length < 10) {
          console.error("Extracted text is too short or empty");
          throw new Error("Aucun texte n'a pu être extrait du PDF");
        }
        
        // Return successful response with extracted text
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
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("Le téléchargement du PDF a dépassé le délai d'attente");
        }
        throw fetchError;
      }
    } catch (extractionError: any) {
      console.error("Error during extraction process:", extractionError);
      
      // Provide clear error message for debugging
      return new Response(
        JSON.stringify({
          success: false,
          error: extractionError.message || "Une erreur est survenue lors de l'extraction du texte",
          details: typeof extractionError === 'object' ? extractionError.toString() : null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
  } catch (error: any) {
    console.error("Error during request processing:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Une erreur est survenue lors du traitement de la requête"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
