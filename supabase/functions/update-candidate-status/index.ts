
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

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
    const { candidateId, status } = await req.json();
    
    if (!candidateId || !status) {
      throw new Error("L'ID du candidat et le statut sont requis");
    }

    console.log("Mise à jour du statut du candidat:", candidateId, "vers:", status);

    // Créer un client Supabase avec la clé service
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer l'utilisateur authentifié depuis les headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Token d'authentification manquant");
    }

    // Créer un client pour l'utilisateur authentifié
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: {
        headers: {
          authorization: authHeader
        }
      }
    });

    // Vérifier que l'utilisateur est authentifié et récupérer son ID
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Erreur d'authentification:", authError);
      throw new Error("Utilisateur non authentifié");
    }

    console.log("Utilisateur authentifié:", user.id);

    // Valider le statut
    const validStatuses = [
      'initial', 'contact', 'prequalification', 'ec1', 'ec2', 
      'presentation_client', 'en_mission', 'refus', 'ancien_employe'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Statut invalide: ${status}`);
    }

    // Vérifier que le candidat existe et appartient à l'utilisateur
    const { data: candidateCheck, error: checkError } = await supabase
      .from("candidates")
      .select("id, user_id")
      .eq("id", candidateId)
      .single();
      
    if (checkError || !candidateCheck) {
      console.error("Erreur lors de la vérification du candidat:", checkError);
      throw new Error("Candidat introuvable");
    }
    
    if (candidateCheck.user_id !== user.id) {
      console.error("Tentative d'accès non autorisé au candidat:", candidateId, "par l'utilisateur:", user.id);
      throw new Error("Accès non autorisé à ce candidat");
    }

    console.log("Candidat vérifié, mise à jour du statut...");

    // Mettre à jour le statut du candidat avec les privilèges service
    const { data: updatedCandidate, error: updateError } = await supabase
      .from("candidates")
      .update({
        detailed_status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", candidateId)
      .eq("user_id", user.id) // Double vérification de sécurité
      .select()
      .single();
      
    if (updateError) {
      console.error("Erreur lors de la mise à jour:", updateError);
      throw new Error(`Erreur lors de la mise à jour du statut: ${updateError.message}`);
    }

    console.log("Statut mis à jour avec succès:", updatedCandidate);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Statut mis à jour avec succès",
        candidate: updatedCandidate
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error: any) {
    console.error("Erreur dans update-candidate-status:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erreur interne du serveur"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message.includes("non authentifié") ? 401 : 
               error.message.includes("non autorisé") ? 403 : 500,
      }
    );
  }
});
