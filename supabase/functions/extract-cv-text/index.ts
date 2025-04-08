
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
    
    console.log(`Starting text extraction for: ${pdfUrl.substring(0, 50)}...`);

    // Get file directly from the URL with cache busting
    const timestamp = Date.now();
    const urlWithCache = new URL(pdfUrl);
    urlWithCache.searchParams.append('_', timestamp.toString());
    
    console.log(`Fetching PDF with cache busting: ${urlWithCache.toString().substring(0, 50)}...`);
    
    // Download the PDF
    const response = await fetch(urlWithCache.toString(), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Impossible de télécharger le PDF: ${response.status} ${response.statusText}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    // Convert to ArrayBuffer
    const pdfData = await response.arrayBuffer();
    
    if (!pdfData || pdfData.byteLength === 0) {
      console.error("PDF data is empty");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Le fichier PDF est vide"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    console.log(`PDF downloaded, size: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
    
    // Extract text with our improved method
    const result = await extractTextFromPDF(pdfData);
    const extractedText = result.extractedText;
    const pageCount = result.pageCount;
    
    console.log(`Extraction complete: ${pageCount} pages, text length: ${extractedText.length} chars`);
    
    if (!extractedText || extractedText.trim().length < 10) {
      console.error("Extracted text is too short or empty");
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
  } catch (error: any) {
    console.error("Error during text extraction:", error);
    
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
