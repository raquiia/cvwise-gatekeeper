
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

serve(async (req) => {
  try {
    // Parse request body
    const { candidate_id } = await req.json();

    if (!candidate_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: candidate_id",
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
      "get_candidate_status",
      {
        p_candidate_id: candidate_id,
      }
    );

    if (error) {
      console.error("Error getting candidate status:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: data }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exception in get_candidate_status edge function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
