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
 * NOUVELLE FONCTION: Validation intelligente des données d'adresse
 */
const validateAndCorrectAddressData = (extractedData: any): any => {
  console.log('🔍 Validating and correcting address data...');
  
  if (!extractedData.candidate_data) return extractedData;
  
  const candidateData = extractedData.candidate_data;
  
  // Patterns d'erreurs courantes à détecter
  const agePatterns = [
    /^\d{1,2}\s*ans?$/i,
    /^\d{1,2}$/, // Juste un nombre seul (probablement un âge)
    /age\s*:\s*\d{1,2}/i
  ];
  
  const phonePatterns = [
    /^\+?\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}/,
    /^0\d{9,10}$/
  ];
  
  const emailPatterns = [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  ];
  
  // Vérification et correction du champ address
  if (candidateData.address) {
    const address = String(candidateData.address).trim();
    
    // Vérifier si l'adresse contient un âge par erreur
    for (const pattern of agePatterns) {
      if (pattern.test(address)) {
        console.log(`⚠️ Detected age "${address}" in address field, clearing it`);
        candidateData.address = '';
        break;
      }
    }
    
    // Vérifier si l'adresse contient un téléphone par erreur
    for (const pattern of phonePatterns) {
      if (pattern.test(address)) {
        console.log(`⚠️ Detected phone "${address}" in address field, moving to phone`);
        if (!candidateData.phone) {
          candidateData.phone = address;
        }
        candidateData.address = '';
        break;
      }
    }
    
    // Vérifier si l'adresse contient un email par erreur
    for (const pattern of emailPatterns) {
      if (pattern.test(address)) {
        console.log(`⚠️ Detected email "${address}" in address field, moving to email`);
        if (!candidateData.email) {
          candidateData.email = address;
        }
        candidateData.address = '';
        break;
      }
    }
  }
  
  // Extraction intelligente d'adresse à partir de la localisation si l'adresse est vide
  if (!candidateData.address && candidateData.location) {
    const location = String(candidateData.location);
    console.log(`🏠 Trying to extract address from location: "${location}"`);
    
    // Pattern pour extraire adresse complète: "Code postal Ville, Pays"
    const addressMatch = location.match(/(\d{5})\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg))?/i);
    if (addressMatch) {
      candidateData.postal_code = addressMatch[1];
      candidateData.city = addressMatch[2].trim();
      candidateData.country = addressMatch[3] || 'France';
      console.log(`✅ Extracted from location - postal: ${candidateData.postal_code}, city: ${candidateData.city}, country: ${candidateData.country}`);
    }
  }
  
  console.log('✅ Address validation completed');
  return extractedData;
};

/**
 * Extraction d'adresse améliorée à partir du texte brut
 */
const extractAddressFromText = (text: string): { address: string; postal_code: string; city: string; country: string; location: string } => {
  console.log('🏠 Advanced address extraction from text...');
  
  // Patterns améliorés pour l'extraction d'adresse
  const addressPatterns = [
    // Pattern 1: Adresse complète avec rue, code postal, ville
    /(?:^|\n)\s*(.+?)\s*(\d{5})\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg))?/gim,
    // Pattern 2: Code postal + ville
    /(\d{5})\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium))/gi,
    // Pattern 3: Ville, Pays
    /([A-Za-zÀ-ÿ\s-]+?)\s*,\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg)/gi
  ];
  
  for (const pattern of addressPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      // Vérifier que ce n'est pas un âge ou un téléphone
      const potentialAddress = match[1] || '';
      
      // Ignorer si c'est clairement un âge
      if (/^\d{1,2}\s*ans?$/i.test(potentialAddress)) {
        continue;
      }
      
      // Ignorer si c'est clairement un téléphone
      if (/^\+?\d{1,4}[\s\-\(\)]*\d/.test(potentialAddress)) {
        continue;
      }
      
      return {
        address: potentialAddress || '',
        postal_code: match[2] || '',
        city: match[3] || '',
        country: match[4] || 'France',
        location: match[0]
      };
    }
  }
  
  return { address: '', postal_code: '', city: '', country: '', location: '' };
};

/**
 * NOUVEAU PROMPT: Prompt optimisé et précis pour éviter les confusions
 */
const createOptimizedPrompt = (resumeText: string): string => {
  return `Extraire les informations du CV suivant et retourner un JSON valide.

IMPORTANT - RÈGLES D'EXTRACTION STRICTES:
1. L'ÂGE N'EST JAMAIS UNE ADRESSE - ne jamais mettre l'âge dans le champ "address"
2. Le TÉLÉPHONE n'est jamais une adresse - le mettre dans "phone"
3. L'EMAIL n'est jamais une adresse - le mettre dans "email"
4. L'adresse doit contenir une RUE et un NUMÉRO, pas juste une ville
5. Si pas d'adresse de rue trouvée, laisser "address" vide

Format JSON requis:
{
  "candidate_data": {
    "first_name": "prénom extrait",
    "last_name": "nom extrait", 
    "email": "email@exemple.com ou chaîne vide si non trouvé",
    "phone": "numéro de téléphone ou chaîne vide",
    "position": "poste actuel ou recherché",
    "location": "ville ou localisation générale",
    "address": "UNIQUEMENT adresse de rue avec numéro (ex: '123 Rue de la Paix') ou chaîne vide",
    "postal_code": "code postal (5 chiffres) ou chaîne vide",
    "city": "nom de la ville ou chaîne vide",
    "country": "nom du pays ou chaîne vide",
    "years_experience": nombre_années_expérience,
    "company": "entreprise actuelle/dernière",
    "skills": ["compétence1", "compétence2"],
    "experiences": [{"title": "poste", "company": "entreprise", "duration": "durée", "description": "description"}],
    "education": [{"degree": "diplôme", "school": "école", "year": "année"}],
    "languages": [{"language": "langue", "level": "niveau"}],
    "availability": "disponibilité ou chaîne vide",
    "mobility": "mobilité géographique ou chaîne vide",
    "career_objectives": "objectifs de carrière ou chaîne vide"
  },
  "scoring": {
    "overall_score": note_sur_100,
    "explanation": "explication détaillée du score",
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

EXEMPLES DE DISTINCTIONS IMPORTANTES:
- "42 ans" → c'est un ÂGE, ne PAS le mettre dans "address"
- "74150 RUMILLY" → postal_code: "74150", city: "RUMILLY"
- "Mobile: +33..." → c'est un TÉLÉPHONE, le mettre dans "phone"
- "Rue Philippe-Plantamour 17" → c'est une ADRESSE valide pour "address"

Texte du CV à analyser:
${resumeText.slice(0, 4000)}

Répondre uniquement avec le JSON, sans texte explicatif.`;
};

/**
 * PARSING JSON amélioré avec meilleur logging
 */
const parseAIResponse = (content: string): any => {
  console.log('🧹 === DEBUT DU PARSING AI AMÉLIORÉ ===');
  console.log('📝 Contenu brut reçu d\'OpenAI:', content);
  console.log('📊 Longueur du contenu:', content.length);
  
  if (!content || content.trim() === '') {
    console.error('❌ Contenu vide reçu d\'OpenAI');
    throw new Error('Contenu vide reçu d\'OpenAI');
  }
  
  // Étape 1: Chercher les patterns JSON courants
  const jsonPatterns = [
    /```json\s*(\{[\s\S]*?\})\s*```/,
    /```\s*(\{[\s\S]*?\})\s*```/,
    /(\{[\s\S]*\})/
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
  
  try {
    const parsed = JSON.parse(jsonContent);
    console.log('✅ JSON parsé avec succès!');
    console.log('📋 Structure trouvée:', Object.keys(parsed));
    
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
    
    try {
      const cleanedContent = jsonContent
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting IMPROVED resume-ai-analysis with address validation');
    
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

    // Appel à OpenAI avec prompt amélioré
    console.log('🤖 Calling OpenAI with IMPROVED prompt...');
    
    const optimizedPrompt = createOptimizedPrompt(resumeText);
    
    const openAIPayload = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en extraction de données de CV. Tu dois faire attention à ne JAMAIS confondre l\'âge avec l\'adresse. Tu réponds toujours avec du JSON valide uniquement.'
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

    console.log('📝 Processing AI response with improved parsing and validation...');
    let extractedData;
    try {
      extractedData = parseAIResponse(content);
      console.log('✅ AI response parsed successfully');
      
      // NOUVELLE ÉTAPE: Validation et correction des données
      extractedData = validateAndCorrectAddressData(extractedData);
      console.log('✅ Address data validated and corrected');
      
      console.log('📊 Final extracted data keys:', Object.keys(extractedData));
      
      if (extractedData.candidate_data) {
        console.log('👤 Candidate data keys:', Object.keys(extractedData.candidate_data));
        console.log('📝 Address validation result:', {
          address: extractedData.candidate_data.address,
          postal_code: extractedData.candidate_data.postal_code,
          city: extractedData.candidate_data.city,
          country: extractedData.candidate_data.country,
          location: extractedData.candidate_data.location
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
      console.log('🏠 Extracting address fallback with improved logic...');
      const addressInfo = extractAddressFromText(resumeText);
      
      // Ne remplacer que les champs vides
      if (!candidateData.address && addressInfo.address) {
        candidateData.address = addressInfo.address;
      }
      if (!candidateData.postal_code && addressInfo.postal_code) {
        candidateData.postal_code = addressInfo.postal_code;
      }
      if (!candidateData.city && addressInfo.city) {
        candidateData.city = addressInfo.city;
      }
      if (!candidateData.country && addressInfo.country) {
        candidateData.country = addressInfo.country;
      }
      if (!candidateData.location && addressInfo.location) {
        candidateData.location = addressInfo.location;
      }
    }

    // Validation finale des données avant insertion
    console.log('🔍 Final validation of extracted data...');
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

    // Log final des données d'adresse avant insertion
    console.log('🏠 Final address data before insertion:', {
      address: candidateData.address,
      postal_code: candidateData.postal_code,
      city: candidateData.city,
      country: candidateData.country,
      location: candidateData.location
    });

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

    console.log('💾 Inserting candidate with validated address data...');
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

    console.log('✅ Candidate created successfully with validated address:', candidate.id);

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

    console.log('🎉 Improved analysis with address validation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        candidateId: candidate.id,
        scoring: scoringData,
        message: 'CV analyzed successfully with improved address validation'
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
