
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateId, notes } = await req.json();

    if (!notes || notes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucune note disponible pour l\'extraction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combiner toutes les notes en un texte
    const notesText = notes.map((note: any) => {
      const content = note.enhanced_content || note.content;
      return `--- ${note.note_type || 'Note'} ---\n${content}`;
    }).join('\n\n');

    console.log('Extracting candidate info from notes:', notesText.substring(0, 200) + '...');

    const systemPrompt = `Tu es un assistant IA spécialisé dans l'extraction d'informations de candidats à partir de notes d'entretien.

À partir des notes fournies, extrait UNIQUEMENT les informations suivantes si elles sont explicitement mentionnées :

- position: Poste recherché ou actuel
- company: Entreprise actuelle ou précédente
- location: Localisation géographique
- salary_expectations: Prétentions salariales
- availability: Disponibilité
- mobility: Mobilité géographique
- contract_type: Type de contrat recherché (CDI, CDD, freelance, etc.)
- remote_preference: Préférence télétravail
- travel_willingness: Volonté de voyager
- career_objectives: Objectifs de carrière
- professional_values: Valeurs professionnelles
- work_authorization: Autorisation de travail
- interests: Centres d'intérêt professionnels

RÈGLES IMPORTANTES :
- Ne retourne QUE les champs pour lesquels tu as trouvé une information explicite
- N'invente AUCUNE information
- Si une information n'est pas clairement mentionnée, ne l'inclus pas
- Retourne un objet JSON valide
- Utilise des valeurs textuelles simples (pas d'objets complexes)

Exemple de réponse :
{
  "position": "Développeur Full Stack",
  "salary_expectations": "45k-50k euros",
  "remote_preference": "Hybride 2-3 jours par semaine"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Voici les notes d'entretien :\n\n${notesText}` }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedContent = data.choices[0].message.content;

    console.log('OpenAI response:', extractedContent);

    // Parser la réponse JSON
    let extractedInfo;
    try {
      extractedInfo = JSON.parse(extractedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', extractedContent);
      return new Response(
        JSON.stringify({ error: 'Erreur lors du parsing de la réponse IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        candidateId,
        extractedInfo,
        extractedFields: Object.keys(extractedInfo),
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in extract-candidate-info function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
