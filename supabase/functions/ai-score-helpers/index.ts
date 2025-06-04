
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

    // Valider candidateId
    if (!candidateId || typeof candidateId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Candidate ID is required and must be a valid UUID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normaliser jobOfferId - s'assurer qu'il est null si c'est une chaîne vide ou "null"
    const normalizedJobOfferId = (jobOfferId === "null" || jobOfferId === "" || jobOfferId === undefined) ? null : jobOfferId;

    console.log('AI Score Helpers:', { action, candidateId, normalizedJobOfferId });

    switch (action) {
      case 'get':
        return await getAiCandidateScore(candidateId, normalizedJobOfferId);
      
      case 'delete':
        return await deleteAiCandidateScore(candidateId, normalizedJobOfferId);
      
      case 'save':
        return await saveAiCandidateScore(candidateId, normalizedJobOfferId, score, explanation, breakdown);
      
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
    console.log('Getting AI score for:', { candidateId, jobOfferId });
    
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
    console.log('Found AI score data:', scoreData ? 'Yes' : 'No');

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
    console.log('Deleting AI score for:', { candidateId, jobOfferId });
    
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

    console.log('AI score deleted:', data);

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
    console.log('Saving AI score for:', { candidateId, jobOfferId, score });
    
    // Valider les paramètres
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('Score must be a number between 0 and 100');
    }
    
    if (!explanation || typeof explanation !== 'string') {
      throw new Error('Explanation is required and must be a string');
    }
    
    const { data, error } = await supabase
      .rpc('save_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_score: score,
        p_explanation: explanation,
        p_job_offer_id: jobOfferId,
        p_breakdown: breakdown || {}
      });

    if (error) {
      console.error('Error saving AI score:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scoreData = data && data.length > 0 ? data[0] : null;
    console.log('AI score saved successfully');

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
