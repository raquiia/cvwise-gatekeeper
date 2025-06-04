
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Fonction pour récupérer un score IA
export async function getAiCandidateScore(candidateId: string, jobOfferId: string | null) {
  try {
    const { data, error } = await supabase
      .from('ai_candidate_scores')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_offer_id', jobOfferId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching AI score:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getAiCandidateScore:', error);
    return null;
  }
}

// Fonction pour supprimer un score IA
export async function deleteAiCandidateScore(candidateId: string, jobOfferId: string | null) {
  try {
    const { error } = await supabase
      .from('ai_candidate_scores')
      .delete()
      .eq('candidate_id', candidateId)
      .eq('job_offer_id', jobOfferId);

    if (error) {
      console.error('Error deleting AI score:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAiCandidateScore:', error);
    return false;
  }
}

// Fonction pour sauvegarder un score IA
export async function saveAiCandidateScore(
  candidateId: string,
  jobOfferId: string | null,
  userId: string,
  score: number,
  explanation: string,
  breakdown: any
) {
  try {
    const { data, error } = await supabase
      .from('ai_candidate_scores')
      .upsert({
        candidate_id: candidateId,
        job_offer_id: jobOfferId,
        user_id: userId,
        score,
        explanation,
        breakdown,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving AI score:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in saveAiCandidateScore:', error);
    return null;
  }
}
