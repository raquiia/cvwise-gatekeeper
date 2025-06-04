
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, candidateId, jobOfferId, score, explanation, breakdown } = await req.json();

    switch (action) {
      case 'get':
        return await getAiCandidateScore(candidateId, jobOfferId);
      
      case 'delete':
        return await deleteAiCandidateScore(candidateId, jobOfferId);
      
      case 'save':
        return await saveAiCandidateScore(candidateId, jobOfferId, score, explanation, breakdown);
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error in ai-score-helpers:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fonction pour récupérer un score IA
async function getAiCandidateScore(candidateId: string, jobOfferId: string | null) {
  try {
    const { data, error } = await supabase
      .rpc('get_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId
      });

    if (error) {
      console.error('Error fetching AI score:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scoreData = data && data.length > 0 ? data[0] : null;

    return new Response(
      JSON.stringify({ success: true, data: scoreData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in getAiCandidateScore:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Fonction pour supprimer un score IA
async function deleteAiCandidateScore(candidateId: string, jobOfferId: string | null) {
  try {
    const { data, error } = await supabase
      .rpc('delete_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: jobOfferId
      });

    if (error) {
      console.error('Error deleting AI score:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, deleted: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in deleteAiCandidateScore:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Fonction pour sauvegarder un score IA
async function saveAiCandidateScore(
  candidateId: string,
  jobOfferId: string | null,
  score: number,
  explanation: string,
  breakdown: any
) {
  try {
    const { data, error } = await supabase
      .rpc('save_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_score: score,
        p_explanation: explanation,
        p_job_offer_id: jobOfferId,
        p_breakdown: breakdown
      });

    if (error) {
      console.error('Error saving AI score:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scoreData = data && data.length > 0 ? data[0] : null;

    return new Response(
      JSON.stringify({ success: true, data: scoreData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in saveAiCandidateScore:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
