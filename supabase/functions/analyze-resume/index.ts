
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

    console.log('Starting resume analysis for resume ID:', resumeId);
    console.log('Resume text length:', resumeText.length);

    // Step 1: Extract candidate information from resume text using AI
    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Tu es un expert en extraction d'informations de CV. Analyse ce CV et extrais les informations du candidat au format JSON strictement structuré.

            Tu dois retourner UNIQUEMENT un objet JSON avec cette structure exacte :
            {
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
            }

            Règles importantes :
            - Retourne UNIQUEMENT du JSON valide, pas de texte supplémentaire
            - Si une information n'est pas trouvée, utilise "" pour les strings et [] pour les arrays
            - Pour years_experience, estime le nombre d'années basé sur les expériences (0 si pas d'info)
            - Sois précis pour l'adresse : extrait l'adresse complète si mentionnée
            - Sépare bien adresse, code postal, ville, pays si possible
            - Pour les compétences, inclus toutes les compétences techniques et soft skills trouvées`
          },
          {
            role: 'user',
            content: `Analyse ce CV et extrais les informations du candidat :\n\n${resumeText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error('OpenAI extraction API error:', extractionResponse.status, errorText);
      throw new Error(`OpenAI extraction API error: ${extractionResponse.status} - ${errorText}`);
    }

    const extractionData = await extractionResponse.json();
    const extractedContent = extractionData.choices[0]?.message?.content;
    
    if (!extractedContent) {
      throw new Error('No content received from OpenAI for extraction');
    }

    console.log('Raw extraction response:', extractedContent);

    // Parse the extracted candidate information
    let candidateData;
    try {
      candidateData = JSON.parse(extractedContent);
    } catch (parseError) {
      console.error('Failed to parse candidate extraction response:', extractedContent);
      throw new Error('Invalid JSON response from AI extraction');
    }

    console.log('Candidate information extracted successfully:', {
      name: `${candidateData.first_name} ${candidateData.last_name}`,
      email: candidateData.email,
      position: candidateData.position,
      address: candidateData.address,
      city: candidateData.city,
      skillsCount: candidateData.skills?.length || 0,
      experienceYears: candidateData.years_experience
    });

    // Step 2: Generate AI analysis and scoring with detailed breakdown
    console.log('Starting AI scoring and analysis...');
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Tu es un expert RH spécialisé dans l'analyse de CV. Analyse ce CV et fournis une évaluation détaillée avec score, points forts, points faibles et recommandations.
            
            Tu dois retourner une réponse JSON avec cette structure exacte :
            {
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
            
            Critères d'évaluation :
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
            content: `Analyse ce profil candidat et son CV de manière détaillée :
            
            Données candidat : ${JSON.stringify(candidateData)}
            
            Texte du CV complet : ${resumeText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2500
      }),
    });

    let analysis = null;
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      const analysisContent = analysisData.choices[0]?.message?.content;
      
      if (analysisContent) {
        try {
          analysis = JSON.parse(analysisContent);
          console.log('AI analysis completed successfully:', {
            score: analysis.score,
            explanationLength: analysis.explanation?.length || 0,
            hasBreakdown: !!analysis.breakdown,
            strengthsCount: analysis.strengths?.length || 0,
            weaknessesCount: analysis.weaknesses?.length || 0,
            recommendationsCount: analysis.recommendations?.length || 0
          });
        } catch (parseError) {
          console.error('Failed to parse AI analysis response:', analysisContent);
          // Continue without analysis if parsing fails
        }
      }
    } else {
      const errorText = await analysisResponse.text();
      console.warn(`OpenAI analysis API error: ${analysisResponse.status} - ${errorText}`);
      // Continue without analysis if scoring fails
    }

    // Ensure we have at least basic analysis if detailed analysis failed
    if (!analysis) {
      console.log('Creating fallback analysis...');
      analysis = {
        score: Math.min(85, Math.max(45, 50 + (candidateData.years_experience || 0) * 3 + (candidateData.skills?.length || 0) * 2)),
        explanation: `Profil candidat analysé automatiquement. Expérience professionnelle de ${candidateData.years_experience || 0} ans dans le domaine ${candidateData.position || 'non spécifié'}. Compétences identifiées : ${candidateData.skills?.slice(0, 5)?.join(', ') || 'non spécifiées'}. Formation : ${candidateData.education?.length ? candidateData.education[0]?.degree : 'non spécifiée'}.`,
        breakdown: {
          skills: Math.min(20, (candidateData.skills?.length || 0) * 2),
          experience: Math.min(20, (candidateData.years_experience || 0) * 2),
          education: candidateData.education?.length ? 15 : 10,
          languages: candidateData.languages?.length ? Math.min(10, candidateData.languages.length * 3) : 5,
          location: candidateData.location ? 8 : 5,
          profileSummary: candidateData.career_objectives ? 8 : 6,
          cvStructure: 7
        },
        strengths: candidateData.skills?.slice(0, 3) || ['Profil en cours d\'analyse'],
        weaknesses: ['Analyse détaillée non disponible'],
        recommendations: ['Compléter les informations manquantes', 'Mettre à jour le CV']
      };
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
