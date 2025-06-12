
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, resumeId } = await req.json();
    
    if (!resumeText || !resumeId) {
      throw new Error('Missing resumeText or resumeId');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Starting unified resume analysis for resume ID:', resumeId);
    console.log('Resume text length:', resumeText.length);

    // Requête IA unifiée : extraction + analyse + scoring en une seule fois
    const unifiedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert RH spécialisé dans l'analyse complète de CV. Analyse ce CV et fournis une réponse JSON complète avec extraction des données ET analyse détaillée avec scoring.

            Tu dois retourner UNIQUEMENT un objet JSON avec cette structure exacte :
            {
              "candidateData": {
                "first_name": "string",
                "last_name": "string", 
                "email": "string",
                "phone": "string",
                "position": "string",
                "years_experience": number,
                "location": "string",
                "address": "string",
                "postal_code": "string", 
                "city": "string",
                "country": "string",
                "company": "string",
                "skills": ["skill1", "skill2", ...],
                "education": [{"degree": "string", "school": "string", "year": "string"}],
                "experiences": [{"position": "string", "company": "string", "duration": "string", "description": "string"}],
                "languages": [{"language": "string", "level": "string"}],
                "availability": "string",
                "salary_expectations": "string",
                "contract_type": "string",
                "remote_preference": "string",
                "mobility": "string",
                "career_objectives": "string",
                "interests": "string"
              },
              "analysis": {
                "score": number (0-100),
                "explanation": "string avec analyse détaillée minimum 200 mots, incluant points forts et points faibles",
                "breakdown": {
                  "skills": number (0-20),
                  "experience": number (0-20), 
                  "education": number (0-20),
                  "languages": number (0-10),
                  "location": number (0-10),
                  "profileSummary": number (0-10),
                  "cvStructure": number (0-10)
                },
                "strengths": ["point fort 1", "point fort 2", "point fort 3", ...],
                "weaknesses": ["point faible 1", "point faible 2", ...],
                "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3", ...]
              }
            }
            
            Instructions pour l'extraction des données candidat :
            - Retourne UNIQUEMENT du JSON valide, pas de texte supplémentaire
            - Si une information n'est pas trouvée, utilise "" pour les strings et [] pour les arrays
            - Pour years_experience, estime le nombre d'années basé sur les expériences (0 si pas d'info)
            - Sois précis pour l'adresse : extrait l'adresse complète si mentionnée
            - Sépare bien adresse, code postal, ville, pays si possible
            - Pour les compétences, inclus toutes les compétences techniques et soft skills trouvées
            
            Instructions pour l'analyse et le scoring :
            - Skills (20 pts) : Pertinence et diversité des compétences techniques et soft skills
            - Experience (20 pts) : Qualité, progression et cohérence de l'expérience professionnelle
            - Education (20 pts) : Niveau et pertinence des formations par rapport au profil
            - Languages (10 pts) : Maîtrise des langues (bonus si multilingue)
            - Location (10 pts) : Informations de localisation et mobilité
            - Profile Summary (10 pts) : Clarté de la présentation du profil et objectifs
            - CV Structure (10 pts) : Organisation, lisibilité et professionnalisme du CV
            
            Dans l'explication, tu DOIS inclure :
            - Une analyse de 3-5 points forts majeurs avec exemples concrets
            - Une analyse de 2-3 points faibles avec suggestions d'amélioration
            - Une évaluation de la cohérence du parcours professionnel
            - Des recommandations spécifiques pour améliorer le profil
            
            Pour les strengths (3-5 points forts) :
            - Identifie les compétences clés les plus remarquables
            - Mets en avant l'expérience pertinente
            - Souligne les formations ou certifications importantes
            - Note la progression de carrière si applicable
            
            Pour les weaknesses (2-3 points faibles) :
            - Identifie les lacunes en compétences
            - Note les manques d'information dans le CV
            - Souligne les incohérences ou gaps dans le parcours
            
            Pour les recommendations (3-5 recommandations) :
            - Propose des actions concrètes pour améliorer le profil
            - Suggère des compétences à acquérir
            - Recommande des améliorations du CV
            - Propose des objectifs de carrière
            
            Sois précis, constructif et professionnel dans tes commentaires.`
          },
          {
            role: 'user',
            content: `Analyse ce CV de manière complète (extraction + analyse + scoring) :

            ${resumeText}`
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      }),
    });

    if (!unifiedResponse.ok) {
      const errorText = await unifiedResponse.text();
      console.error('OpenAI unified API error:', unifiedResponse.status, errorText);
      throw new Error(`OpenAI unified API error: ${unifiedResponse.status} - ${errorText}`);
    }

    const unifiedData = await unifiedResponse.json();
    const unifiedContent = unifiedData.choices[0]?.message?.content;
    
    if (!unifiedContent) {
      throw new Error('No content received from OpenAI for unified analysis');
    }

    console.log('Raw unified response:', unifiedContent);

    // Parser la réponse unifiée
    let parsedResult;
    try {
      parsedResult = JSON.parse(unifiedContent);
    } catch (parseError) {
      console.error('Failed to parse unified response:', unifiedContent);
      throw new Error('Invalid JSON response from unified AI analysis');
    }

    const candidateData = parsedResult.candidateData;
    const analysis = parsedResult.analysis;

    if (!candidateData || !analysis) {
      throw new Error('Missing candidateData or analysis in unified response');
    }

    console.log('Unified analysis completed successfully:', {
      candidateName: `${candidateData.first_name} ${candidateData.last_name}`,
      email: candidateData.email,
      position: candidateData.position,
      score: analysis.score,
      explanationLength: analysis.explanation?.length || 0,
      strengthsCount: analysis.strengths?.length || 0,
      weaknessesCount: analysis.weaknesses?.length || 0,
      recommendationsCount: analysis.recommendations?.length || 0
    });

    // S'assurer que les données sont au bon format pour la sauvegarde
    if (!analysis.breakdown) {
      analysis.breakdown = {};
    }
    if (!Array.isArray(analysis.strengths)) {
      analysis.strengths = [];
    }
    if (!Array.isArray(analysis.weaknesses)) {
      analysis.weaknesses = [];
    }
    if (!Array.isArray(analysis.recommendations)) {
      analysis.recommendations = [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        candidateData: candidateData,
        analysis: analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in unified analyze-resume function:', error);
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
