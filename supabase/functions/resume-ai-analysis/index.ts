
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
 * NOUVELLE FONCTION: Validation intelligente des données d'adresse améliorée
 */
const validateAndCorrectAddressData = (extractedData: any): any => {
  console.log('🔍 Advanced address validation and correction...');
  
  if (!extractedData.candidate_data) return extractedData;
  
  const candidateData = extractedData.candidate_data;
  
  // Patterns d'erreurs courantes à détecter (améliorés)
  const agePatterns = [
    /^\d{1,2}\s*ans?$/i,
    /^\d{1,2}$/, 
    /age\s*:\s*\d{1,2}/i,
    /\b\d{1,2}\s*years?\s*old\b/i
  ];
  
  const phonePatterns = [
    /^\+?\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{1,4}[\s\-\(\)]*\d{0,4}$/,
    /^0\d{9,10}$/,
    /^\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/,
    /mobile\s*:\s*\+?\d/i,
    /tel\s*:\s*\+?\d/i,
    /phone\s*:\s*\+?\d/i
  ];
  
  const emailPatterns = [
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    /email\s*:\s*[^\s@]+@/i,
    /mail\s*:\s*[^\s@]+@/i
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
    if (candidateData.address) {
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
    }
    
    // Vérifier si l'adresse contient un email par erreur
    if (candidateData.address) {
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
  }
  
  // Extraction intelligente d'adresse à partir de la localisation si l'adresse est vide
  if (!candidateData.address && candidateData.location) {
    const location = String(candidateData.location);
    console.log(`🏠 Trying to extract address from location: "${location}"`);
    
    // Patterns améliorés pour extraire adresse complète
    const addressPatterns = [
      // Pattern 1: Code postal + ville + pays
      /(\d{5})\s+([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg))?/i,
      // Pattern 2: Ville, Pays  
      /([A-Za-zÀ-ÿ\s\-']+?)\s*,\s*(France|Suisse|Switzerland|Belgique|Belgium|Luxembourg)/i,
      // Pattern 3: Juste une ville connue
      /(Geneva|Genève|Lausanne|Zurich|Bern|Berne|Basel|Bâle|Paris|Lyon|Marseille|Toulouse|Nice)/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = location.match(pattern);
      if (match) {
        if (pattern.source.includes('\\d{5}')) {
          // Pattern avec code postal
          candidateData.postal_code = match[1];
          candidateData.city = match[2]?.trim();
          candidateData.country = match[3] || 'France';
        } else if (pattern.source.includes(',')) {
          // Pattern ville, pays
          candidateData.city = match[1]?.trim();
          candidateData.country = match[2];
        } else {
          // Pattern ville seule
          candidateData.city = match[1]?.trim();
          // Auto-détection du pays basé sur la ville
          const cityLower = match[1]?.toLowerCase();
          if (['geneva', 'genève', 'lausanne', 'zurich', 'bern', 'berne', 'basel', 'bâle'].includes(cityLower)) {
            candidateData.country = 'Switzerland';
          } else {
            candidateData.country = candidateData.country || 'France';
          }
        }
        console.log(`✅ Extracted from location - postal: ${candidateData.postal_code}, city: ${candidateData.city}, country: ${candidateData.country}`);
        break;
      }
    }
  }
  
  console.log('✅ Advanced address validation completed');
  return extractedData;
};

/**
 * NOUVELLE FONCTION: Extraction d'adresse et de données manquantes améliorée
 */
const extractMissingDataFromText = (text: string, currentData: any): any => {
  console.log('🔍 Advanced missing data extraction from text...');
  
  const missingData = { ...currentData };
  
  // Patterns améliorés pour l'extraction de données manquantes
  const patterns = {
    email: [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      /e-?mail\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ],
    phone: [
      /(?:tel|phone|mobile|portable)\s*:?\s*(\+?[\d\s\-\(\)\.]{8,20})/gi,
      /(\+?33\s?[1-9](?:[\s\-\.]?\d{2}){4})/g,
      /(\+?41\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2})/g,
      /(0[1-9](?:[\s\-\.]?\d{2}){4})/g,
      /(\d{2}\s\d{2}\s\d{2}\s\d{2}\s\d{2})/g
    ],
    address: [
      // Adresses avec numéro + rue + ville
      /(?:^|\n)\s*(\d+[\w\s]*(?:rue|avenue|boulevard|place|chemin|allée|impasse|passage)[^,\n]*?)[\s,]*(\d{5})?\s*([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium))?/gim,
      // Adresses sans numéro mais avec indication de rue
      /(?:^|\n)\s*((?:rue|avenue|boulevard|place|chemin|allée|impasse|passage)\s+[^,\n]+?)[\s,]*(\d{5})?\s*([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium))?/gim
    ],
    postalCode: [
      /\b(\d{5})\s+([A-Za-zÀ-ÿ\s\-']+?)(?:\s*,?\s*(France|Suisse|Switzerland|Belgique|Belgium))?/gi
    ]
  };
  
  // Extraction des emails manquants
  if (!missingData.email) {
    for (const pattern of patterns.email) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const email = match[1] || match[0];
        if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          missingData.email = email;
          console.log(`📧 Found missing email: ${email}`);
          break;
        }
      }
      if (missingData.email) break;
    }
  }
  
  // Extraction des téléphones manquants
  if (!missingData.phone) {
    for (const pattern of patterns.phone) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const phone = match[1] || match[0];
        if (phone && phone.replace(/\D/g, '').length >= 8) {
          missingData.phone = phone.trim();
          console.log(`📱 Found missing phone: ${phone}`);
          break;
        }
      }
      if (missingData.phone) break;
    }
  }
  
  // Extraction des adresses manquantes
  if (!missingData.address) {
    for (const pattern of patterns.address) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const potentialAddress = match[1];
        if (potentialAddress && potentialAddress.length > 5) {
          // Vérifier que ce n'est pas un âge ou autre donnée
          if (!/^\d{1,2}\s*ans?$/i.test(potentialAddress) && 
              !/^[a-zA-Z0-9._%+-]+@/.test(potentialAddress)) {
            missingData.address = potentialAddress.trim();
            if (match[2]) missingData.postal_code = match[2];
            if (match[3]) missingData.city = match[3].trim();
            if (match[4]) missingData.country = match[4];
            console.log(`🏠 Found missing address: ${potentialAddress}`);
            break;
          }
        }
      }
      if (missingData.address) break;
    }
  }
  
  // Extraction des codes postaux et villes manquants
  if (!missingData.postal_code || !missingData.city) {
    for (const pattern of patterns.postalCode) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (!missingData.postal_code && match[1]) {
          missingData.postal_code = match[1];
          console.log(`📮 Found missing postal code: ${match[1]}`);
        }
        if (!missingData.city && match[2]) {
          missingData.city = match[2].trim();
          console.log(`🏙️ Found missing city: ${match[2]}`);
        }
        if (!missingData.country && match[3]) {
          missingData.country = match[3];
          console.log(`🌍 Found missing country: ${match[3]}`);
        }
        if (missingData.postal_code && missingData.city) break;
      }
      if (missingData.postal_code && missingData.city) break;
    }
  }
  
  console.log('✅ Missing data extraction completed');
  return missingData;
};

/**
 * PROMPT AMÉLIORÉ: Prompt optimisé pour capturer TOUTES les données disponibles
 */
const createEnhancedPrompt = (resumeText: string): string => {
  return `IMPORTANT: Extraire TOUTES les informations disponibles du CV suivant. Ne laisser aucune donnée importante de côté.

RÈGLES D'EXTRACTION STRICTES ET AMÉLIORÉES:
1. OBLIGATOIRE: Extraire EMAIL et TÉLÉPHONE s'ils sont présents dans le CV
2. Pour l'ADRESSE: Capturer la rue ET le numéro si disponibles, sinon extraire ce qui est disponible
3. VILLE et CODE POSTAL: Toujours les extraire s'ils sont mentionnés
4. PAYS: Déduire du contexte si non explicite (ex: codes postaux français = France)
5. Si une information semble manquer, relire le CV entièrement

EXEMPLES CONCRETS D'EXTRACTION CORRECTE:
- "clement.beauclair@gmail.com" → email: "clement.beauclair@gmail.com"
- "06 68 49 07 38" → phone: "06 68 49 07 38"  
- "Rue Philippe-Plantamour 17, 1201 Genève" → address: "Rue Philippe-Plantamour 17", postal_code: "1201", city: "Genève", country: "Switzerland"
- "74150 RUMILLY" → postal_code: "74150", city: "RUMILLY", country: "France"
- "Lausanne, Suisse" → city: "Lausanne", country: "Switzerland"

FORMAT JSON REQUIS (capturer TOUTES les données disponibles):
{
  "candidate_data": {
    "first_name": "prénom exact du CV",
    "last_name": "nom exact du CV", 
    "email": "OBLIGATOIRE: email exact trouvé dans le CV ou chaîne vide",
    "phone": "OBLIGATOIRE: téléphone exact trouvé dans le CV ou chaîne vide",
    "position": "poste actuel ou recherché",
    "location": "localisation générale mentionnée",
    "address": "adresse de rue complète si disponible ou chaîne vide",
    "postal_code": "code postal exact si trouvé ou chaîne vide",
    "city": "ville exacte si trouvée ou chaîne vide",
    "country": "pays exact ou déduit du contexte",
    "years_experience": nombre_années_expérience,
    "company": "entreprise actuelle/dernière",
    "skills": ["TOUTES les compétences mentionnées"],
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

ATTENTION: Ne pas confondre âge et adresse. "42 ans" n'est PAS une adresse.

Texte du CV à analyser (extraire TOUTES les informations disponibles):
${resumeText.slice(0, 4000)}

Répondre uniquement avec le JSON complet, sans texte explicatif.`;
};

/**
 * PARSING JSON amélioré avec validation renforcée
 */
const parseAIResponse = (content: string): any => {
  console.log('🧹 === DEBUT DU PARSING AI AMÉLIORÉ ===');
  console.log('📝 Contenu brut reçu d\'OpenAI:', content.substring(0, 500) + '...');
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
      console.log('✅ Pattern JSON trouvé avec:', pattern.source.substring(0, 50));
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
      
      // Validation des données critiques
      const criticalFields = ['email', 'phone', 'first_name', 'last_name'];
      const missingCritical = criticalFields.filter(field => 
        !parsed.candidate_data[field] || parsed.candidate_data[field] === ''
      );
      
      if (missingCritical.length > 0) {
        console.warn('⚠️ Champs critiques manquants:', missingCritical);
      }
      
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
    console.log('🚀 Starting ENHANCED resume-ai-analysis with comprehensive data extraction');
    
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
    console.log('🤖 Calling OpenAI with ENHANCED comprehensive prompt...');
    
    const enhancedPrompt = createEnhancedPrompt(resumeText);
    
    const openAIPayload = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un assistant expert en extraction de données de CV. Tu dois capturer TOUTES les informations disponibles sans exception. Jamais de données manquantes. Tu réponds toujours avec du JSON valide uniquement.'
        },
        {
          role: 'user',
          content: enhancedPrompt
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

    console.log('📝 Processing AI response with enhanced parsing and validation...');
    let extractedData;
    try {
      extractedData = parseAIResponse(content);
      console.log('✅ AI response parsed successfully');
      
      // ÉTAPE 1: Validation et correction des données
      extractedData = validateAndCorrectAddressData(extractedData);
      console.log('✅ Address data validated and corrected');
      
      // ÉTAPE 2: Extraction des données manquantes
      if (extractedData.candidate_data) {
        const enhancedData = extractMissingDataFromText(resumeText, extractedData.candidate_data);
        extractedData.candidate_data = enhancedData;
        console.log('✅ Missing data extraction completed');
      }
      
      console.log('📊 Final enhanced data keys:', Object.keys(extractedData));
      
      if (extractedData.candidate_data) {
        console.log('👤 Enhanced candidate data keys:', Object.keys(extractedData.candidate_data));
        console.log('📝 Final validation result:', {
          email: extractedData.candidate_data.email,
          phone: extractedData.candidate_data.phone,
          address: extractedData.candidate_data.address,
          postal_code: extractedData.candidate_data.postal_code,
          city: extractedData.candidate_data.city,
          country: extractedData.candidate_data.country,
          location: extractedData.candidate_data.location
        });
      }
    } catch (parseError) {
      console.error('❌ JSON parse error even with enhanced parsing:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to parse AI response: ${parseError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation finale des données avant insertion
    console.log('🔍 Final comprehensive validation of extracted data...');
    const candidateData = extractedData.candidate_data || {};
    
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

    // Log final des données extraites
    console.log('📋 Final comprehensive extraction results:', {
      email: candidateData.email,
      phone: candidateData.phone,
      address: candidateData.address,
      postal_code: candidateData.postal_code,
      city: candidateData.city,
      country: candidateData.country,
      location: candidateData.location,
      hasEmail: !!candidateData.email,
      hasPhone: !!candidateData.phone,
      hasAddress: !!candidateData.address
    });

    // Préparation des données pour insertion avec validation stricte
    console.log('📊 Preparing comprehensive candidate data for insertion...');
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

    console.log('💾 Inserting candidate with comprehensive extracted data...');
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

    console.log('✅ Candidate created successfully with comprehensive data:', candidate.id);

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

    console.log('🎉 ENHANCED comprehensive analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        candidateId: candidate.id,
        scoring: scoringData,
        message: 'CV analyzed successfully with enhanced comprehensive data extraction'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 CRITICAL ERROR in enhanced comprehensive analysis:', error);
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
