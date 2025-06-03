
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_STATUSES = [
  'initial', 'contact', 'prequalification', 'ec1', 'ec2', 
  'presentation_client', 'en_mission', 'refus', 'ancien_employe'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { candidate_id, detailed_status } = await req.json();
    console.log("Updating candidate status:", candidate_id, "to:", detailed_status);

    if (!candidate_id || !detailed_status) {
      return new Response(
        JSON.stringify({ error: "candidate_id and detailed_status are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!VALID_STATUSES.includes(detailed_status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status: ${detailed_status}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get auth header to verify user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Create user client for auth verification
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { authorization: authHeader }
        }
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("User authenticated:", user.id);

    // First, verify candidate exists and user owns it
    const { data: candidateData, error: candidateError } = await supabaseAdmin
      .from("candidates")
      .select("user_id")
      .eq("id", candidate_id)
      .single();

    if (candidateError) {
      console.error("Error fetching candidate:", candidateError);
      return new Response(
        JSON.stringify({ error: "Candidate not found" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Verify ownership
    if (candidateData.user_id !== user.id) {
      console.error("Ownership verification failed");
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Update candidate status using admin client (bypasses RLS)
    const { data: updatedCandidate, error: updateError } = await supabaseAdmin
      .from("candidates")
      .update({ 
        detailed_status: detailed_status,
        updated_at: new Date().toISOString()
      })
      .eq("id", candidate_id)
      .eq("user_id", user.id) // Double security check
      .select()
      .single();

    if (updateError) {
      console.error("Error updating candidate:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update candidate status" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Status updated successfully:", updatedCandidate);

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: updatedCandidate 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Exception in update-candidate-status-secure:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
