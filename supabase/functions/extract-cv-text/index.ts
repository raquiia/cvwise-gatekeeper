
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

    // Check if the URL is accessible
    let response = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(correctedUrl, {
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) break;
        
        console.log(`URL check attempt ${retryCount + 1}/${maxRetries} failed with status ${response.status}. Retrying...`);
        retryCount++;
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (urlError) {
        console.error(`URL check error (attempt ${retryCount + 1}):`, urlError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!response || !response.ok) {
      console.error(`URL check failed after ${maxRetries} attempts:`, response?.status || 'Network error');
      
      // Try getting a different URL format for storage access
      try {
        const projectUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const storagePath = pdfUrl.includes('/object/public/') 
          ? pdfUrl.split('/object/public/')[1] 
          : pdfUrl.includes('/object/') 
            ? pdfUrl.split('/object/')[1]
            : pdfUrl;
            
        // Try with direct storage API access using service role
        const alternativeUrl = `${projectUrl}/storage/v1/object/resumes/${storagePath}`;
        
        console.log("Trying alternative URL format:", alternativeUrl);
        
        response = await fetch(alternativeUrl, {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status: ${response.status}`);
        }
      } catch (altUrlError) {
        console.error("Alternative URL access failed:", altUrlError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `PDF inaccessible après plusieurs tentatives: Vérifiez que le bucket 'resumes' existe et que le fichier est accessible.`
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
    }
    
    // Download the PDF with better error handling and retry
    retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(correctedUrl, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        });
        
        if (response.ok) break;
        
        console.log(`Download attempt ${retryCount + 1}/${maxRetries} failed with status ${response.status}. Retrying...`);
        retryCount++;
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (fetchError) {
        console.error(`Fetch error (attempt ${retryCount + 1}):`, fetchError);
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
    
    // Convert to ArrayBuffer
    let pdfData: ArrayBuffer;
    try {
      pdfData = await response.arrayBuffer();
    } catch (convError) {
      console.error("Error converting to ArrayBuffer:", convError);
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
    
    console.log(`PDF downloaded, size: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
    
    // Limit PDF size to avoid timeouts
    const maxSizeKB = 10 * 1024; // 10 MB
    if (pdfData.byteLength > maxSizeKB * 1024) {
      console.log(`PDF too large (${(pdfData.byteLength / 1024 / 1024).toFixed(2)} MB), extraction limited`);
    }
    
    // Extract text with our simplified method
    let extractedText = "";
    let pageCount = 0;
    
    try {
      const result = await extractTextFromPDF(pdfData);
      extractedText = result.extractedText;
      pageCount = result.pageCount;
    } catch (extractError) {
      console.error("Extraction error:", extractError);
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
    
    console.log(`Extraction successful, ${pageCount} page(s), text length: ${extractedText.length} characters`);
    
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
