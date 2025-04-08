
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

    // Get service role key for authenticated access
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    
    if (!serviceKey || !supabaseUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuration du serveur incomplète (variables d'environnement manquantes)"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500
        }
      );
    }

    // Extract user_id and file path from the URL pattern
    const filePathMatch = pdfUrl.match(/\/([^\/]+)\/([^\/]+\.[^\/]+)$/);
    let filePath = '';
    
    if (filePathMatch && filePathMatch.length >= 3) {
      // Use the extracted path from URL
      filePath = `${filePathMatch[1]}/${filePathMatch[2]}`;
    } else {
      // Try to extract from the Supabase storage URL pattern
      const storageMatch = pdfUrl.match(/\/storage\/v\d\/object\/(?:public\/)?([^?]+)/);
      if (storageMatch && storageMatch.length >= 2) {
        filePath = decodeURIComponent(storageMatch[1]);
      } else {
        // Last attempt - check if it's already a path
        if (pdfUrl.includes('/')) {
          const parts = pdfUrl.split('/');
          filePath = parts.slice(-2).join('/');
        }
      }
    }
    
    if (!filePath) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Impossible d'extraire le chemin du fichier depuis l'URL"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    console.log("Chemin du fichier extrait:", filePath);
    
    // Try direct storage API access using admin privileges
    const storageFileUrl = `${supabaseUrl}/storage/v1/object/resumes/${filePath}`;
    console.log("Tentative d'accès au fichier via URL admin:", storageFileUrl);
    
    // Set up retry mechanism
    let response = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(storageFileUrl, {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Cache-Control': 'no-cache',
            'apikey': serviceKey
          }
        });
        
        if (response.ok) break;
        
        console.log(`Tentative ${retryCount + 1}/${maxRetries} échouée avec statut ${response.status}. Nouvelle tentative...`);
        retryCount++;
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (urlError) {
        console.error(`Erreur lors de la tentative ${retryCount + 1}:`, urlError);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!response || !response.ok) {
      console.error(`Échec d'accès au fichier après ${maxRetries} tentatives:`, response?.status || 'Erreur réseau');
      
      // Try getting a public URL as fallback
      try {
        // Use rest API to get file data directly
        const restUrl = `${supabaseUrl}/rest/v1/resumes?id=eq.${resumeId}&select=file_path`;
        console.log("Tentative de récupération des informations du fichier via API REST:", restUrl);
        
        const restResponse = await fetch(restUrl, {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          }
        });
        
        if (!restResponse.ok) {
          throw new Error(`Échec de récupération des informations: ${restResponse.status}`);
        }
        
        const resumeInfo = await restResponse.json();
        if (!resumeInfo || resumeInfo.length === 0) {
          throw new Error("Aucune information trouvée pour ce CV");
        }
        
        filePath = resumeInfo[0].file_path;
        console.log("Chemin de fichier obtenu via API REST:", filePath);
        
        // Try one last time with the new path
        const finalStorageUrl = `${supabaseUrl}/storage/v1/object/resumes/${filePath}`;
        console.log("Dernière tentative avec l'URL:", finalStorageUrl);
        
        response = await fetch(finalStorageUrl, {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Échec avec statut: ${response.status}`);
        }
      } catch (fallbackError) {
        console.error("Toutes les tentatives d'accès au fichier ont échoué:", fallbackError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Impossible d'accéder au fichier PDF: Vérifiez que le bucket 'resumes' existe et que le fichier est accessible.`
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
          }
        );
      }
    }
    
    // Download the PDF
    console.log("Accès au fichier réussi, téléchargement en cours...");
    
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
    
    console.log(`PDF téléchargé, taille: ${(pdfData.byteLength / 1024).toFixed(2)} KB`);
    
    // Limit PDF size to avoid timeouts
    const maxSizeKB = 10 * 1024; // 10 MB
    if (pdfData.byteLength > maxSizeKB * 1024) {
      console.log(`PDF trop volumineux (${(pdfData.byteLength / 1024 / 1024).toFixed(2)} MB), extraction limitée`);
    }
    
    // Extract text with our improved method
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
    
    console.log(`Extraction réussie, ${pageCount} page(s), texte de longueur: ${extractedText.length} caractères`);
    
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
