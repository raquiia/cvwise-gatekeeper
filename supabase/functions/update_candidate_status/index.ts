
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Valid status values - Updated for recruitment pipeline steps
const VALID_STATUSES = [
  'prise_contact',
  'ps',
  'ci1',
  'ci2',
  'ci3',
  'pipeline',
  'formal_offer',
  'contingent_offer',
  'offer_declined',
  'offer_accepted',
  'contract_signed',
  'hired'
];

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
    
    // Validate status value
    if (!VALID_STATUSES.includes(detailed_status)) {
      return new Response(
        JSON.stringify({
          error: `Invalid status value: ${detailed_status}. Valid values are: ${VALID_STATUSES.join(', ')}`,
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

    // First try using the RPC function which should avoid recursion issues
    try {
      const { data: rpcData, error: rpcError } = await supabaseClient.rpc(
        'update_candidate_status',
        {
          p_candidate_id: candidate_id,
          p_detailed_status: detailed_status
        }
      );
      
      if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw rpcError;
      }
      
      if (rpcData === true) {
        return new Response(
          JSON.stringify({ success: true }),
          { 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders 
            } 
          }
        );
      }
    } catch (rpcError) {
      console.error("Error using RPC function:", rpcError);
      // Continue to direct update as fallback
    }

    // Fallback: Direct update if RPC fails
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
