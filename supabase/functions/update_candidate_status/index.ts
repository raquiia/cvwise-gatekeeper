
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

serve(async (req) => {
  try {
    // Parse request body
    const { candidate_id, detailed_status } = await req.json();

    if (!candidate_id || !detailed_status) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: candidate_id or detailed_status",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the project URL and service key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Call the RPC function
    const { data, error } = await supabaseClient.rpc(
      "update_candidate_status",
      {
        p_candidate_id: candidate_id,
        p_detailed_status: detailed_status,
      }
    );

    if (error) {
      console.error("Error updating candidate status:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: data }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exception in update_candidate_status edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
