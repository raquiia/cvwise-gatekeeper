
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateData, resumeText } = await req.json();
    
    if (!candidateData || !resumeText) {
      throw new Error('Missing candidateData or resumeText');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Analyzing resume for candidate:', candidateData.id);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert RH spécialisé dans l'analyse de CV. Analyse ce CV et fournis une évaluation détaillée.
            
            Tu dois retourner une réponse JSON avec cette structure exacte :
            {
              "score": number (0-100),
              "explanation": "string avec analyse détaillée, points forts et points faibles",
              "breakdown": {
                "skills": number (0-20),
                "experience": number (0-20), 
                "education": number (0-20),
                "languages": number (0-10),
                "location": number (0-10),
                "profileSummary": number (0-10),
                "cvStructure": number (0-10)
              },
              "strengths": ["point fort 1", "point fort 2", ...],
              "weaknesses": ["point faible 1", "point faible 2", ...],
              "recommendations": ["recommandation 1", "recommandation 2", ...]
            }
            
            Critères d'évaluation :
            - Skills (20 pts) : Pertinence et diversité des compétences
            - Experience (20 pts) : Qualité et progression de l'expérience 
            - Education (20 pts) : Niveau et pertinence des formations
            - Languages (10 pts) : Maîtrise des langues
            - Location (10 pts) : Informations de localisation/mobilité
            - Profile Summary (10 pts) : Qualité du résumé professionnel
            - CV Structure (10 pts) : Clarté et organisation du CV
            
            Sois précis et constructif dans tes commentaires.`
          },
          {
            role: 'user',
            content: `Analyse ce CV :
            
            Données candidat : ${JSON.stringify(candidateData)}
            
            Texte du CV : ${resumeText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from AI analysis');
    }

    // Validate the response structure
    if (!analysisResult.score || !analysisResult.explanation || !analysisResult.breakdown) {
      throw new Error('Invalid analysis result structure');
    }

    console.log('AI Analysis completed:', {
      candidateId: candidateData.id,
      score: analysisResult.score,
      hasExplanation: !!analysisResult.explanation,
      hasBreakdown: !!analysisResult.breakdown
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
