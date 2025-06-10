
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fonction pour nettoyer et décoder les textes avec caractères spéciaux
 */
const cleanAndDecodeText = (text: string): string => {
  if (!text) return '';
  
  try {
    let cleaned = text;
    let previousCleaned = '';
    while (cleaned !== previousCleaned) {
      previousCleaned = cleaned;
      try {
        cleaned = decodeURIComponent(cleaned);
      } catch {
        break;
      }
    }
    cleaned = cleaned.replace(/%/g, '').replace(/\s+/g, ' ');
    return cleaned.trim();
  } catch (error) {
    return text.replace(/%/g, '').replace(/\s+/g, ' ').trim();
  }
};

/**
 * Extraction d'adresse simplifiée
 */
const extractAddressFromText = (text: string): { address: string; postal_code: string; city: string; country: string; location: string } => {
  console.log('🏠 Extracting address from text...');
  
  const addressPatterns = [
    /(\d+[\w\s,-]+?)\s*,?\s*(\d{5})\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s*,\s*(France|Suisse|Belgique))?/gi,
    /([A-Za-zÀ-ÿ\s-]+?)\s*,\s*(France|Suisse|Belgique|Luxembourg)/gi
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match && match[0]) {
      const parts = match[0].split(',').map(p => p.trim());
      return {
        address: parts[0] || '',
        postal_code: (parts[1] || '').match(/\d{5}/)?.[0] || '',
        city: parts[1]?.replace(/\d{5}/, '').trim() || '',
        country: parts[2] || 'France',
        location: match[0]
      };
    }
  }
  
  return { address: '', postal_code: '', city: '', country: '', location: '' };
};

/**
 * NOUVELLE VERSION: Parsing JSON simplifié avec meilleur logging
 */
const parseAIResponse = (content: string): any => {
  console.log('🧹 === DEBUT DU PARSING AI ===');
  console.log('📝 Contenu brut reçu d\'OpenAI:', content);
  console.log('📊 Longueur du contenu:', content.length);
  
  if (!content || content.trim() === '') {
    console.error('❌ Contenu vide reçu d\'OpenAI');
    throw new Error('Contenu vide reçu d\'OpenAI');
  }
  
  // Étape 1: Chercher les patterns JSON courants
  const jsonPatterns = [
    /```json\s*(\{[\s\S]*?\})\s*```/,  // JSON dans des blocs markdown
    /```\s*(\{[\s\S]*?\})\s*```/,      // JSON dans des blocs génériques
    /(\{[\s\S]*\})/                     // JSON simple
  ];
  
  let jsonContent = content.trim();
  
  for (const pattern of jsonPatterns) {
    const match = jsonContent.match(pattern);
    if (match) {
      jsonContent = match[1] || match[0];
      console.log('✅ Pattern JSON trouvé avec:', pattern.source);
      break;
    }
  }
  
  console.log('🎯 Contenu JSON extrait:', jsonContent.substring(0, 500) + '...');
  
  // Étape 2: Tentative de parsing direct
  try {
    const parsed = JSON.parse(jsonContent);
    console.log('✅ JSON parsé avec succès!');
    console.log('📋 Structure trouvée:', Object.keys(parsed));
    
    // Validation basique de la structure
    if (parsed.candidate_data && typeof parsed.candidate_data === 'object') {
      console.log('✅ Structure candidate_data valide trouvée');
      console.log('👤 Données candidat:', Object.keys(parsed.candidate_data));
      return parsed;
    } else {
      console.warn('⚠️ Structure candidate_data manquante ou invalide');
      console.log('📊 Structure reçue:', parsed);
    }
    
    return parsed;
  } catch (parseError) {
    console.error('❌ Erreur de parsing JSON:', parseError.message);
    console.error('📝 Contenu qui a échoué (premiers 1000 chars):', jsonContent.substring(0, 1000));
    
    // Tentative de nettoyage léger et re-parsing
    try {
      const cleanedContent = jsonContent
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Supprimer caractères de contrôle
        .replace(/,\s*}/g, '}')                        // Supprimer virgules en fin d'objet
        .replace(/,\s*]/g, ']');                       // Supprimer virgules en fin de tableau
      
      console.log('🧽 Tentative avec contenu nettoyé...');
      const secondTryParsed = JSON.parse(cleanedContent);
      console.log('✅ JSON parsé après nettoyage!');
      return secondTryParsed;
    } catch (secondError) {
      console.error('❌ Échec même après nettoyage:', secondError.message);
      throw new Error(`Impossible de parser la réponse JSON: ${parseError.message}`);
    }
  }
};

/**
 * Prompt optimisé et simplifié pour l'extraction
 */
const createOptimizedPrompt = (resumeText: string): string => {
  return `Extraire les informations du CV suivant et retourner un JSON valide:

{
  "candidate_data": {
    "first_name": "prénom",
    "last_name": "nom",
    "email": "email ou chaîne vide",
    "phone": "téléphone ou chaîne vide", 
    "position": "poste actuel ou recherché",
    "location": "localisation/ville",
    "address": "adresse complète",
    "postal_code": "code postal",
    "city": "ville",
    "country": "pays",
    "years_experience": nombre_années,
    "company": "entreprise actuelle/dernière",
    "skills": ["compétence1", "compétence2"],
    "experiences": [{"title": "poste", "company": "entreprise", "duration": "durée", "description": "description"}],
    "education": [{"degree": "diplôme", "school": "école", "year": "année"}],
    "languages": [{"language": "langue", "level": "niveau"}],
    "availability": "disponibilité",
    "mobility": "mobilité géographique", 
    "career_objectives": "objectifs de carrière"
  },
  "scoring": {
    "overall_score": note_sur_100,
    "explanation": "explication du score",
    "breakdown": {
      "education": note_sur_20,
      "experience": note_sur_20,
      "skills": note_sur_20,
      "languages": note_sur_10,
      "location": note_sur_10,
      "profileSummary": note_sur_10,
      "cvStructure": note_sur_10
    }
  }
}

CV:
${resumeText.slice(0, 4000)}

Répondre uniquement avec le JSON, sans texte explicatif.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting IMPROVED resume-ai-analysis');
    
    const requestData = await req.json();
    const { resumeId, resumeText, overwriteExisting } = requestData;
    
    console.log('📋 Request data:', {
      resumeId,
      textLength: resumeText?.length || 0,
      overwriteExisting
    });
    
    if (!resumeId || !resumeText) {
      console.error('❌ Missing required data');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing resumeId or resume text'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuration missing'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les données du CV
    console.log('📄 Fetching resume data...');
    const resumeDataResult = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();

    if (resumeDataResult.error) {
      console.error('❌ Failed to fetch resume:', resumeDataResult.error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch resume data'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Resume data fetched for user:', resumeDataResult.data.user_id);

    // Appel à OpenAI avec prompt simplifié
    console.log('🤖 Calling OpenAI with simplified prompt...');
    
    const optimizedPrompt = createOptimizedPrompt(resumeText);
    
    const openAIPayload = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant d\'extraction de données de CV. Tu réponds toujours avec du JSON valide uniquement.'
        },
        {
          role: 'user',
          content: optimizedPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    };

    console.log('📤 Sending request to OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('✅ OpenAI response received');
    console.log('📊 Response usage:', aiResponse.usage);
    
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      console.error('❌ No content from AI');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No content received from AI'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📝 Processing AI response with improved parsing...');
    let extractedData;
    try {
      extractedData = parseAIResponse(content);
      console.log('✅ AI response parsed successfully');
      console.log('📊 Extracted data keys:', Object.keys(extractedData));
      
      if (extractedData.candidate_data) {
        console.log('👤 Candidate data keys:', Object.keys(extractedData.candidate_data));
        console.log('📝 Sample data:', {
          first_name: extractedData.candidate_data.first_name,
          last_name: extractedData.candidate_data.last_name,
          position: extractedData.candidate_data.position,
          company: extractedData.candidate_data.company,
          skills_count: Array.isArray(extractedData.candidate_data.skills) ? extractedData.candidate_data.skills.length : 0
        });
      }
    } catch (parseError) {
      console.error('❌ JSON parse error even with improved parsing:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to parse AI response: ${parseError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraction d'adresse de fallback si nécessaire
    const candidateData = extractedData.candidate_data || {};
    if (!candidateData.address || !candidateData.city) {
      console.log('🏠 Extracting address fallback...');
      const addressInfo = extractAddressFromText(resumeText);
      Object.assign(candidateData, addressInfo);
    }

    // Validation des données avant insertion
    console.log('🔍 Validating extracted data...');
    const hasValidData = candidateData.first_name || candidateData.last_name || candidateData.position || candidateData.company;
    
    if (!hasValidData) {
      console.error('❌ No meaningful data extracted from CV');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No meaningful candidate data could be extracted from the CV'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Préparation des données pour insertion avec validation stricte
    console.log('📊 Preparing candidate data for insertion...');
    const candidateInsertData = {
      resume_id: resumeId,
      user_id: resumeDataResult.data.user_id,
      first_name: candidateData.first_name || '',
      last_name: candidateData.last_name || '',
      email: candidateData.email || null,
      phone: candidateData.phone || null,
      position: candidateData.position || null,
      location: candidateData.location || null,
      address: candidateData.address || null,
      postal_code: candidateData.postal_code || null,
      city: candidateData.city || null,
      country: candidateData.country || null,
      years_experience: candidateData.years_experience || 0,
      company: candidateData.company || null,
      skills: Array.isArray(candidateData.skills) ? candidateData.skills : [],
      experiences: Array.isArray(candidateData.experiences) ? candidateData.experiences : [],
      education: Array.isArray(candidateData.education) ? candidateData.education : [],
      languages: Array.isArray(candidateData.languages) ? candidateData.languages : [],
      availability: candidateData.availability || null,
      mobility: candidateData.mobility || null,
      career_objectives: candidateData.career_objectives || null
    };

    console.log('💾 Inserting candidate into database...');
    const { data: candidate, error: insertError } = await supabase
      .from('candidates')
      .insert(candidateInsertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Candidate insertion error:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to create candidate: ${insertError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Candidate created successfully:', candidate.id);

    // Sauvegarde du score AI
    const scoringData = extractedData.scoring || {};
    if (scoringData && scoringData.overall_score !== undefined) {
      console.log('💯 Saving AI score...');
      
      const scoreInsertData = {
        candidate_id: candidate.id,
        user_id: resumeDataResult.data.user_id,
        score: scoringData.overall_score,
        explanation: scoringData.explanation || '',
        breakdown: scoringData.breakdown || {},
        calculated_at: new Date().toISOString()
      };

      const { error: scoreError } = await supabase
        .from('ai_candidate_scores')
        .insert(scoreInsertData);

      if (scoreError) {
        console.error('⚠️ Score insertion error (non-critical):', scoreError);
      } else {
        console.log('✅ AI score saved successfully');
      }
    }

    console.log('🎉 Improved analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        candidateId: candidate.id,
        scoring: scoringData,
        message: 'CV analyzed successfully with improved data extraction'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 CRITICAL ERROR in improved analysis:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: `Unexpected error: ${error.message}`,
        details: error.stack?.substring(0, 500)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
