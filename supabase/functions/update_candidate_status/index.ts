
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body: " + e.message,
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    const { candidate_id, detailed_status } = body;

    if (!candidate_id || !detailed_status) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: candidate_id or detailed_status",
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Validate detailed_status before proceeding
    const validStatuses = [
      'initial', 'contact', 'prequalification', 'ec1', 'ec2', 
      'presentation_client', 'en_mission', 'refus', 'ancien_employe'
    ];

    if (!validStatuses.includes(detailed_status)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid status value: ${detailed_status}. Valid values are: ${validStatuses.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    // Create Supabase client with the project URL and service key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Directly update the candidates table to avoid recursion issues
    const { data, error } = await supabaseClient
      .from('candidates')
      .update({ 
        detailed_status: detailed_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidate_id)
      .select();

    if (error) {
      console.error("Error updating candidate status:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: data }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Exception in update_candidate_status edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
});
