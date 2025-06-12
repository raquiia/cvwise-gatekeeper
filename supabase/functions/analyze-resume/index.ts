
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

    // Requête IA unifiée avec des critères de notation plus stricts et discriminants
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
            content: `Tu es un expert RH spécialisé dans l'évaluation critique et discriminante de CV. Tu dois analyser ce CV avec des critères STRICTS et EXIGEANTS pour générer des scores réalistes et différenciés.

            INSTRUCTIONS CRITIQUES DE NOTATION :
            - Sois SÉLECTIF et CRITIQUE dans tes évaluations
            - Les scores élevés (>75) doivent être EXCEPTIONNELS et justifiés
            - Pénalise sévèrement les informations manquantes ou imprécises
            - Différencie clairement les niveaux de compétence

            GRILLE DE NOTATION STRICTE :
            
            **Skills (0-20 points)** :
            - 0-5 : Aucune compétence ou compétences très basiques
            - 6-10 : Quelques compétences de base, manque de profondeur
            - 11-15 : Compétences correctes mais sans expertise avancée
            - 16-18 : Compétences solides et diversifiées avec expertise
            - 19-20 : Expertise exceptionnelle et rare (réservé aux profils d'exception)
            
            **Experience (0-20 points)** :
            - 0-5 : Aucune expérience ou stages uniquement
            - 6-10 : 1-2 ans d'expérience, profil junior
            - 11-15 : 3-5 ans d'expérience, profil confirmé
            - 16-18 : 6-10 ans avec progression et responsabilités
            - 19-20 : >10 ans avec leadership et réalisations exceptionnelles
            
            **Education (0-20 points)** :
            - 0-5 : Formation insuffisante ou non pertinente
            - 6-10 : Formation de base (Bac+2/3)
            - 11-15 : Formation supérieure correcte (Bac+4/5)
            - 16-18 : Formation d'excellence (grandes écoles, spécialisations)
            - 19-20 : Formation exceptionnelle avec distinctions
            
            **Languages (0-10 points)** :
            - 0-2 : Monolingue français uniquement
            - 3-5 : Anglais basique ou une langue supplémentaire
            - 6-8 : Anglais bon niveau + autres langues
            - 9-10 : Multilingue avec excellent niveau
            
            **Location (0-10 points)** :
            - 0-3 : Informations de localisation incomplètes
            - 4-6 : Localisation basique, mobilité limitée
            - 7-8 : Bonne localisation avec mobilité
            - 9-10 : Localisation optimale + mobilité internationale
            
            **Profile Summary (0-10 points)** :
            - 0-3 : Objectifs flous ou inexistants
            - 4-6 : Objectifs basiques peu détaillés
            - 7-8 : Objectifs clairs et cohérents
            - 9-10 : Objectifs précis, ambitieux et réalistes
            
            **CV Structure (0-10 points)** :
            - 0-3 : CV mal structuré, informations manquantes
            - 4-6 : Structure correcte mais perfectible
            - 7-8 : CV bien structuré et complet
            - 9-10 : CV impeccable, professionnel et exhaustif

            PÉNALITÉS OBLIGATOIRES :
            - Entreprise manquante : -5 points sur le score final
            - Email manquant : -5 points
            - Téléphone manquant : -3 points
            - Expérience imprécise (sans dates) : -3 points
            - Compétences floues : -3 points

            DISTRIBUTION ATTENDUE DES SCORES :
            - 0-40 : Profils incomplets, débutants ou inadéquats (30%)
            - 41-60 : Profils juniors avec potentiel (40%)
            - 61-75 : Profils confirmés et solides (25%)
            - 76-85 : Profils seniors excellents (4%)
            - 86-100 : Profils exceptionnels ultra-rares (1%)

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
                "score": number (0-100, APRÈS application des pénalités),
                "explanation": "string avec analyse CRITIQUE et DÉTAILLÉE minimum 250 mots, incluant points faibles significatifs",
                "breakdown": {
                  "skills": number (0-20),
                  "experience": number (0-20), 
                  "education": number (0-20),
                  "languages": number (0-10),
                  "location": number (0-10),
                  "profileSummary": number (0-10),
                  "cvStructure": number (0-10)
                },
                "strengths": ["point fort 1", "point fort 2", ...] (maximum 3-4 points, sois sélectif),
                "weaknesses": ["point faible 1", "point faible 2", "point faible 3", ...] (au moins 2-3 points),
                "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3", ...] (3-5 recommandations concrètes)
              }
            }
            
            RÈGLES CRITIQUES :
            - Sois IMPITOYABLE sur les informations manquantes
            - Un CV avec company="" doit être pénalisé de -5 points
            - Les scores >80 doivent être EXCEPTIONNELS et rares
            - Justifie chaque point attribué avec rigueur
            - Dans l'explication, mentionne EXPLICITEMENT les pénalités appliquées
            - Les weaknesses doivent être substantielles et impactantes
            - Ne sois PAS bienveillant : évalue objectivement

            Analyse maintenant ce CV avec ces critères stricts et discriminants.`
          },
          {
            role: 'user',
            content: `Analyse ce CV de manière critique et stricte selon les nouveaux critères :

            ${resumeText}`
          }
        ],
        temperature: 0.1,
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

    // Validation des scores et application de pénalités supplémentaires si nécessaire
    let finalScore = analysis.score;
    const penalties = [];
    
    // Vérification des pénalités critiques
    if (!candidateData.company || candidateData.company.trim() === '') {
      finalScore = Math.max(0, finalScore - 5);
      penalties.push('Entreprise manquante (-5 pts)');
    }
    
    if (!candidateData.email || candidateData.email.trim() === '') {
      finalScore = Math.max(0, finalScore - 5);
      penalties.push('Email manquant (-5 pts)');
    }
    
    if (!candidateData.phone || candidateData.phone.trim() === '') {
      finalScore = Math.max(0, finalScore - 3);
      penalties.push('Téléphone manquant (-3 pts)');
    }

    // Vérification de la cohérence des sous-scores
    const breakdownTotal = (analysis.breakdown.skills || 0) + 
                          (analysis.breakdown.experience || 0) + 
                          (analysis.breakdown.education || 0) + 
                          (analysis.breakdown.languages || 0) + 
                          (analysis.breakdown.location || 0) + 
                          (analysis.breakdown.profileSummary || 0) + 
                          (analysis.breakdown.cvStructure || 0);
    
    // Si le score final ne correspond pas à la somme des sous-scores, ajuster
    if (Math.abs(finalScore - breakdownTotal) > 5) {
      finalScore = Math.min(breakdownTotal, finalScore);
      console.log('Score adjusted for consistency:', finalScore);
    }

    // Mise à jour du score final
    analysis.score = finalScore;
    
    // Ajouter les pénalités à l'explication si nécessaire
    if (penalties.length > 0) {
      analysis.explanation += `\n\nPénalités appliquées : ${penalties.join(', ')}.`;
    }

    console.log('Unified analysis completed successfully:', {
      candidateName: `${candidateData.first_name} ${candidateData.last_name}`,
      email: candidateData.email,
      position: candidateData.position,
      finalScore: finalScore,
      originalScore: parsedResult.analysis.score,
      penaltiesApplied: penalties,
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
