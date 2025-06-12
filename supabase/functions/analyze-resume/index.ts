
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
    // Migration vers GPT-4.1-mini avec prompt optimisé pour maintenir la qualité
    const unifiedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Migration vers gpt-4o-mini (plus performant que 4.1-mini pour cette tâche)
        messages: [
          {
            role: 'system',
            content: `Tu es un expert RH spécialisé dans l'évaluation critique et discriminante de CV. Tu dois analyser ce CV avec des critères STRICTS et EXIGEANTS pour générer des scores réalistes et différenciés.

            INSTRUCTIONS CRITIQUES DE NOTATION :
            - Sois SÉLECTIF et CRITIQUE dans tes évaluations
            - Les scores élevés (>75) doivent être EXCEPTIONNELS et justifiés
            - Pénalise sévèrement les informations manquantes ou imprécises
            - Différencie clairement les niveaux de compétence
            - Applique une notation COHÉRENTE et DISCRIMINANTE

            GRILLE DE NOTATION STRICTE ET DÉTAILLÉE :
            
            **Skills (0-20 points)** :
            - 0-5 : Aucune compétence technique ou compétences très basiques/obsolètes
            - 6-10 : Quelques compétences de base, manque de profondeur technique
            - 11-15 : Compétences correctes mais sans expertise avancée ni spécialisation
            - 16-18 : Compétences solides, diversifiées avec expertise technique démontrée
            - 19-20 : Expertise exceptionnelle et rare, leadership technique (réservé aux profils d'exception)
            
            **Experience (0-20 points)** :
            - 0-5 : Aucune expérience professionnelle ou stages uniquement
            - 6-10 : 1-2 ans d'expérience, profil junior sans responsabilités
            - 11-15 : 3-5 ans d'expérience, profil confirmé avec premières responsabilités
            - 16-18 : 6-10 ans avec progression claire, management et réalisations quantifiées
            - 19-20 : >10 ans avec leadership stratégique et réalisations exceptionnelles
            
            **Education (0-20 points)** :
            - 0-5 : Formation insuffisante ou non pertinente pour le domaine
            - 6-10 : Formation de base (Bac+2/3) ou formation non reconnue
            - 11-15 : Formation supérieure correcte (Bac+4/5) d'établissement standard
            - 16-18 : Formation d'excellence (grandes écoles, universités reconnues)
            - 19-20 : Formation exceptionnelle avec distinctions et spécialisations rares
            
            **Languages (0-10 points)** :
            - 0-2 : Monolingue français uniquement
            - 3-5 : Anglais basique (A2/B1) ou une langue supplémentaire basique
            - 6-8 : Anglais bon niveau (B2/C1) + autres langues ou multilinguisme
            - 9-10 : Parfait multilinguisme avec excellent niveau professionnel
            
            **Location (0-10 points)** :
            - 0-3 : Informations de localisation manquantes ou très incomplètes
            - 4-6 : Localisation basique, mobilité géographique limitée
            - 7-8 : Bonne localisation avec mobilité nationale démontrée
            - 9-10 : Localisation optimale + mobilité internationale prouvée
            
            **Profile Summary (0-10 points)** :
            - 0-3 : Objectifs professionnels flous, inexistants ou incohérents
            - 4-6 : Objectifs basiques peu détaillés, manque de vision stratégique
            - 7-8 : Objectifs clairs, cohérents avec le parcours professionnel
            - 9-10 : Objectifs précis, ambitieux, réalistes avec vision à long terme
            
            **CV Structure (0-10 points)** :
            - 0-3 : CV mal structuré, informations critiques manquantes, présentation défaillante
            - 4-6 : Structure correcte mais perfectible, quelques informations manquantes
            - 7-8 : CV bien structuré, complet et professionnel
            - 9-10 : CV impeccable, parfaitement structuré et exhaustif

            PÉNALITÉS OBLIGATOIRES À APPLIQUER :
            - Entreprise manquante ou imprécise : -5 points sur le score final
            - Email manquant : -5 points sur le score final
            - Téléphone manquant : -3 points sur le score final
            - Dates d'expérience manquantes/imprécises : -3 points sur le score final
            - Compétences trop floues ou génériques : -3 points sur le score final
            - Absence totale d'objectifs professionnels : -2 points sur le score final

            DISTRIBUTION STATISTIQUE ATTENDUE DES SCORES :
            - 0-40 : Profils incomplets, débutants ou inadéquats (25-30%)
            - 41-60 : Profils juniors avec potentiel mais à développer (35-40%)
            - 61-75 : Profils confirmés et solides, expérimentés (25-30%)
            - 76-85 : Profils seniors excellents avec expertise reconnue (4-5%)
            - 86-100 : Profils exceptionnels ultra-rares, leaders dans leur domaine (1%)

            VALIDATION DE COHÉRENCE :
            - Le score final DOIT correspondre à la somme des sous-scores
            - Chaque pénalité DOIT être explicitement mentionnée dans l'explication
            - L'explication DOIT justifier chaque note attribuée avec des éléments factuels du CV

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
                "score": number (0-100, APRÈS application stricte des pénalités),
                "explanation": "string avec analyse CRITIQUE et DÉTAILLÉE minimum 300 mots, incluant TOUS les points faibles significatifs et justification de chaque sous-score",
                "breakdown": {
                  "skills": number (0-20),
                  "experience": number (0-20), 
                  "education": number (0-20),
                  "languages": number (0-10),
                  "location": number (0-10),
                  "profileSummary": number (0-10),
                  "cvStructure": number (0-10)
                },
                "strengths": ["point fort 1", "point fort 2", ...] (maximum 3-4 points, sois très sélectif),
                "weaknesses": ["point faible 1", "point faible 2", "point faible 3", ...] (au moins 3-4 points substantiels),
                "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3", ...] (4-6 recommandations concrètes et actionnables)
              }
            }
            
            RÈGLES CRITIQUES ABSOLUES :
            - Sois IMPITOYABLE sur les informations manquantes ou imprécises
            - Un CV avec company="" ou company=null doit être pénalisé de -5 points
            - Les scores >80 doivent être EXCEPTIONNELS et ultra-rares (1% des profils)
            - Justifie CHAQUE point attribué avec rigueur et éléments factuels
            - Dans l'explication, mentionne EXPLICITEMENT toutes les pénalités appliquées
            - Les weaknesses doivent être substantielles, impactantes et nombreuses
            - Ne sois PAS bienveillant : évalue avec objectivité et sévérité professionnelle
            - La cohérence entre sous-scores et score final est OBLIGATOIRE

            Analyse maintenant ce CV avec ces critères ultra-stricts et discriminants.`
          },
          {
            role: 'user',
            content: `Analyse ce CV de manière critique et stricte selon les critères de notation discriminants :

            ${resumeText}`
          }
        ],
        temperature: 0.1, // Température basse pour plus de cohérence
        max_tokens: 4500, // Augmenté pour compenser les capacités moindres du modèle
        top_p: 0.95 // Ajout pour améliorer la qualité des réponses
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

    // Parser la réponse unifiée avec validation renforcée
    let parsedResult;
    try {
      parsedResult = JSON.parse(unifiedContent);
    } catch (parseError) {
      console.error('Failed to parse unified response:', unifiedContent);
      // Retry logic pour GPT-4o-mini en cas d'échec de parsing
      console.log('Attempting to clean and re-parse response...');
      try {
        // Nettoyage basique du JSON
        const cleanedContent = unifiedContent
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        parsedResult = JSON.parse(cleanedContent);
      } catch (secondParseError) {
        throw new Error('Invalid JSON response from unified AI analysis after cleanup attempt');
      }
    }

    const candidateData = parsedResult.candidateData;
    const analysis = parsedResult.analysis;

    if (!candidateData || !analysis) {
      throw new Error('Missing candidateData or analysis in unified response');
    }

    // Validation renforcée des scores et application de pénalités supplémentaires si nécessaire
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

    // Validation de la cohérence des sous-scores avec tolérance pour GPT-4o-mini
    const breakdownTotal = (analysis.breakdown.skills || 0) + 
                          (analysis.breakdown.experience || 0) + 
                          (analysis.breakdown.education || 0) + 
                          (analysis.breakdown.languages || 0) + 
                          (analysis.breakdown.location || 0) + 
                          (analysis.breakdown.profileSummary || 0) + 
                          (analysis.breakdown.cvStructure || 0);
    
    // Si le score final ne correspond pas à la somme des sous-scores, ajuster avec tolérance
    if (Math.abs(finalScore - breakdownTotal) > 10) { // Tolérance augmentée pour GPT-4o-mini
      finalScore = Math.min(breakdownTotal, finalScore);
      console.log('Score adjusted for consistency (GPT-4o-mini tolerance):', finalScore);
    }

    // Validation des limites de score
    finalScore = Math.max(0, Math.min(100, finalScore));

    // Mise à jour du score final
    analysis.score = finalScore;
    
    // Ajouter les pénalités à l'explication si nécessaire
    if (penalties.length > 0) {
      analysis.explanation += `\n\nPénalités appliquées : ${penalties.join(', ')}.`;
    }

    console.log('Unified analysis completed successfully with GPT-4o-mini:', {
      candidateName: `${candidateData.first_name} ${candidateData.last_name}`,
      email: candidateData.email,
      position: candidateData.position,
      finalScore: finalScore,
      originalScore: parsedResult.analysis.score,
      penaltiesApplied: penalties,
      model: 'gpt-4o-mini',
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
    console.error('Error in unified analyze-resume function (GPT-4o-mini):', error);
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
