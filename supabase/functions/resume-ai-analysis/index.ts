
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Fonction pour nettoyer et décoder les textes avec caractères spéciaux (améliorée)
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
 * Fonction pour traduire les noms de pays de l'anglais vers le français
 */
const translateCountryToFrench = (country: string): string => {
  if (!country) return '';
  
  const countryTranslations: { [key: string]: string } = {
    'Switzerland': 'Suisse',
    'SWITZERLAND': 'Suisse',
    'France': 'France',
    'FRANCE': 'France',
    'Germany': 'Allemagne',
    'GERMANY': 'Allemagne',
    'Belgium': 'Belgique',
    'BELGIUM': 'Belgique',
    'Spain': 'Espagne',
    'SPAIN': 'Espagne',
    'Italy': 'Italie',
    'ITALY': 'Italie',
    'Luxembourg': 'Luxembourg',
    'LUXEMBOURG': 'Luxembourg',
    'Netherlands': 'Pays-Bas',
    'NETHERLANDS': 'Pays-Bas',
    'United Kingdom': 'Royaume-Uni',
    'UNITED KINGDOM': 'Royaume-Uni',
    'UK': 'Royaume-Uni',
    'Austria': 'Autriche',
    'AUSTRIA': 'Autriche',
    'Portugal': 'Portugal',
    'PORTUGAL': 'Portugal',
    'Canada': 'Canada',
    'CANADA': 'Canada',
    'United States': 'États-Unis',
    'USA': 'États-Unis',
    'US': 'États-Unis'
  };
  
  const cleanCountry = country.trim();
  return countryTranslations[cleanCountry] || cleanCountry;
};

/**
 * Fonction améliorée pour décomposer une adresse complète en champs structurés
 */
const parseLocationToStructuredAddress = (location: string): {
  address: string;
  postal_code: string;
  city: string;
  country: string;
} => {
  if (!location) return { address: '', postal_code: '', city: '', country: '' };
  
  console.log('🏠 Parsing location:', location);
  const cleanLocation = cleanAndDecodeText(location);
  
  // Patterns améliorés
  const postalCodePattern = /\b\d{4,5}\b/;
  const countryPattern = /\b(France|FRANCE|Allemagne|ALLEMAGNE|Belgique|BELGIQUE|Suisse|SUISSE|Espagne|ESPAGNE|Italie|ITALIE|Luxembourg|LUXEMBOURG|Royaume-Uni|ROYAUME-UNI|UK|Switzerland|Germany|Belgium|Spain|Italy|Netherlands|Austria|Portugal)\b/i;
  
  let address = '';
  let postal_code = '';
  let city = '';
  let country = '';
  
  // Extraire le pays
  const countryMatch = cleanLocation.match(countryPattern);
  if (countryMatch) {
    country = translateCountryToFrench(countryMatch[0]);
    console.log('🌍 Country found:', country);
  }
  
  // Extraire le code postal
  const postalMatch = cleanLocation.match(postalCodePattern);
  if (postalMatch) {
    postal_code = postalMatch[0];
    console.log('📮 Postal code found:', postal_code);
  }
  
  // Stratégie améliorée : diviser par virgules ou retours à la ligne
  const separators = /[,\n\r]/;
  const segments = cleanLocation.split(separators).map(s => s.trim()).filter(s => s.length > 0);
  
  console.log('📋 Address segments:', segments);
  
  if (segments.length >= 2) {
    // Stratégie : premier segment = adresse de rue
    let potentialAddress = segments[0];
    
    // Nettoyer l'adresse de rue des éléments qui n'y appartiennent pas
    if (postal_code) {
      potentialAddress = potentialAddress.replace(postal_code, '').trim();
    }
    if (country && countryMatch) {
      potentialAddress = potentialAddress.replace(new RegExp(countryMatch[0], 'gi'), '').trim();
    }
    
    // Si ce qui reste ressemble à une adresse de rue (contient des chiffres ou certains mots clés)
    if (potentialAddress && (
      /\d+/.test(potentialAddress) || 
      /\b(rue|avenue|boulevard|place|chemin|route|impasse|allée|square|cours|quai)\b/i.test(potentialAddress)
    )) {
      address = potentialAddress;
      console.log('🏠 Street address found:', address);
    }
    
    // Trouver la ville dans les segments restants
    for (let i = 1; i < segments.length; i++) {
      let segment = segments[i];
      
      // Nettoyer le segment
      if (postal_code) {
        segment = segment.replace(postal_code, '').trim();
      }
      if (country && countryMatch) {
        segment = segment.replace(new RegExp(countryMatch[0], 'gi'), '').trim();
      }
      
      // Si ce qui reste n'est pas vide et ne ressemble pas à une adresse de rue
      if (segment && segment.length > 1 && 
          !(/\d+\s*(rue|avenue|boulevard)/i.test(segment))) {
        city = segment;
        console.log('🏙️ City found:', city);
        break;
      }
    }
    
  } else if (segments.length === 1) {
    // Un seul segment - essayer de deviner la structure
    let remaining = cleanLocation;
    
    // Retirer le pays et le code postal
    if (country && countryMatch) {
      remaining = remaining.replace(new RegExp(countryMatch[0], 'gi'), '').trim();
    }
    if (postal_code) {
      remaining = remaining.replace(postal_code, '').trim();
    }
    
    // Diviser par espaces et essayer de séparer
    const words = remaining.split(/\s+/);
    
    if (words.length > 4) {
      // Si on a beaucoup de mots, essayer de diviser intelligemment
      // Chercher des indices d'adresse de rue (numéros + mots clés)
      let addressWords = [];
      let cityWords = [];
      let foundStreetIndicator = false;
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        if (/\d+/.test(word) || /\b(rue|avenue|boulevard|place|chemin|route)\b/i.test(word)) {
          foundStreetIndicator = true;
          addressWords.push(word);
        } else if (foundStreetIndicator && addressWords.length < 4) {
          // Continuer à ajouter des mots à l'adresse si on n'a pas trop de mots
          addressWords.push(word);
        } else {
          // Les mots restants vont à la ville
          cityWords.push(word);
        }
      }
      
      if (addressWords.length > 0) {
        address = addressWords.join(' ');
      }
      if (cityWords.length > 0) {
        city = cityWords.join(' ');
      }
    } else {
      // Peu de mots - probablement juste une ville
      city = remaining;
    }
  }
  
  // Nettoyage final
  address = address.replace(/[,;]/g, '').trim();
  city = city.replace(/[,;]/g, '').trim();
  
  const result = {
    address: address || '',
    postal_code: postal_code || '',
    city: city || '',
    country: country || ''
  };
  
  console.log('✅ Final parsed address:', result);
  return result;
};

/**
 * Nettoie et valide les données extraites par l'IA (améliorée)
 */
const processAIExtractedData = (data: any): any => {
  console.log('🔧 Processing AI extracted data:', JSON.stringify(data, null, 2));
  
  const processedData = { ...data };
  
  // Nettoyer tous les champs texte
  const textFields = ['first_name', 'last_name', 'email', 'phone', 'position', 'location', 
                     'address', 'postal_code', 'city', 'country', 'company', 'availability',
                     'salary_expectations', 'mobility', 'contract_type', 'remote_preference',
                     'travel_willingness', 'career_objectives', 'professional_values',
                     'work_authorization', 'interests'];
  
  textFields.forEach(field => {
    if (processedData[field]) {
      if (typeof processedData[field] === 'string') {
        processedData[field] = cleanAndDecodeText(processedData[field]);
      } else if (typeof processedData[field] === 'object' && processedData[field].value) {
        processedData[field] = cleanAndDecodeText(String(processedData[field].value));
      } else {
        processedData[field] = '';
      }
      
      if (processedData[field] === 'undefined' || processedData[field] === 'null' || !processedData[field]) {
        processedData[field] = '';
      }
    }
  });
  
  // Traduire le pays en français s'il est en anglais
  if (processedData.country) {
    processedData.country = translateCountryToFrench(processedData.country);
  }
  
  // Logique améliorée pour la décomposition d'adresse
  const hasStructuredAddress = processedData.address || processedData.postal_code || 
                               processedData.city || processedData.country;
  
  // Si l'IA a fourni une adresse structurée, on la garde mais on l'améliore
  if (hasStructuredAddress) {
    console.log('📍 Using AI-provided structured address');
    processedData.address = cleanAndDecodeText(processedData.address || '');
    processedData.city = cleanAndDecodeText(processedData.city || '');
    processedData.postal_code = cleanAndDecodeText(processedData.postal_code || '');
    processedData.country = translateCountryToFrench(processedData.country || '');
  } 
  // Seulement si on n'a pas d'adresse structurée ET qu'on a une location complète
  else if (processedData.location && processedData.location.length > 10) {
    console.log('📍 Parsing location field into structured address');
    const structuredAddress = parseLocationToStructuredAddress(processedData.location);
    
    // Seulement remplacer si on a extrait des données valides
    if (structuredAddress.address || structuredAddress.postal_code || 
        structuredAddress.city || structuredAddress.country) {
      
      processedData.address = structuredAddress.address;
      processedData.postal_code = structuredAddress.postal_code;
      processedData.city = structuredAddress.city;
      processedData.country = structuredAddress.country;
      
      console.log('✅ Address decomposed successfully:', structuredAddress);
    }
  }
  
  console.log('✅ Final processed data:', JSON.stringify(processedData, null, 2));
  return processedData;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting resume-ai-analysis function');
    
    const requestData = await req.json();
    console.log('📦 Request data received');
    
    const { resumeId, resumeText, overwriteExisting, fullAnalysis } = requestData;
    
    console.log('🔍 Parameters:');
    console.log('  - resumeId:', resumeId);
    console.log('  - text length:', resumeText?.length || 0);
    console.log('  - overwriteExisting:', overwriteExisting);
    console.log('  - fullAnalysis:', fullAnalysis);
    
    if (!resumeId || !resumeText) {
      console.error('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing resumeId or resume text',
          details: {
            resumeId: !!resumeId,
            resumeText: !!resumeText,
            textLength: resumeText?.length || 0
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔑 Checking environment variables...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('  - Environment variables present:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey,
      openaiApiKey: !!openaiApiKey
    });

    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'OpenAI API key not configured'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Supabase configuration missing'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📄 Fetching resume data...');
    const resumeDataResult = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();

    if (resumeDataResult.error) {
      console.error('❌ Error fetching resume:', resumeDataResult.error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch resume data',
          details: resumeDataResult.error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resumeData = resumeDataResult.data;
    console.log('✅ Resume data fetched for user:', resumeData.user_id);

    console.log('🤖 Preparing OpenAI request...');
    
    const openAIPayload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en analyse de CV. Analyse le CV fourni et extrais UNIQUEMENT les informations présentes dans le document.

RÈGLES STRICTES:
1. Ne jamais inventer ou déduire d'informations non présentes
2. Si une information n'est pas présente, retourner une chaîne vide ""
3. Pour les tableaux, retourner un tableau vide [] si aucune information
4. Extraire les compétences sous forme de tableau de chaînes simples
5. IMPORTANT - Pour l'adresse, extraire les champs séparément et précisément:
   - address: adresse de rue complète avec numéro (ex: "45 Steinbachstrasse" ou "12 rue de la Paix")
   - postal_code: code postal uniquement (ex: "8051", "75001")
   - city: ville uniquement (ex: "Zurich", "Paris")
   - country: pays EN FRANÇAIS (ex: "Suisse", "France", "Allemagne", "Belgique", etc.)
6. IMPORTANT - Toujours utiliser les noms de pays en français
7. Si l'adresse est dans un seul champ, bien la décomposer
8. Ne pas mettre de caractères encodés (comme %20) dans les résultats
9. Être très précis sur l'extraction de l'adresse - ne pas mélanger rue et ville

Retourne un JSON avec EXACTEMENT cette structure:
{
  "first_name": "",
  "last_name": "",
  "email": "",
  "phone": "",
  "position": "",
  "location": "",
  "address": "",
  "postal_code": "",
  "city": "",
  "country": "",
  "years_experience": 0,
  "company": "",
  "skills": [],
  "experiences": [],
  "education": [],
  "certifications": [],
  "languages": [],
  "publications": [],
  "professional_references": [],
  "professional_networks": [],
  "continuous_training": [],
  "special_permits": [],
  "industries": [],
  "projects": [],
  "availability": "",
  "salary_expectations": "",
  "mobility": "",
  "contract_type": "",
  "remote_preference": "",
  "travel_willingness": "",
  "career_objectives": "",
  "professional_values": "",
  "work_authorization": "",
  "interests": ""
}`
        },
        {
          role: 'user',
          content: `Analyse ce CV et extrais les informations:\n\n${resumeText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    };

    console.log('🚀 Calling OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIPayload),
    });

    console.log('📡 OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      
      if (errorData.error?.code === 'rate_limit_exceeded') {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Limite de taux OpenAI atteinte: ${errorData.error.message}`,
            code: 'rate_limit_exceeded'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
          details: errorData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('✅ OpenAI response received');
    
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      console.error('❌ No content from OpenAI');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No content received from AI'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📝 AI response content sample:', content.substring(0, 200) + '...');

    let extractedData;
    try {
      extractedData = JSON.parse(content);
      console.log('✅ AI response parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON response from AI',
          details: {
            parseError: parseError.message,
            rawContent: content.substring(0, 1000)
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔧 Processing extracted data...');
    const processedData = processAIExtractedData(extractedData);

    console.log('💾 Inserting candidate into database...');
    const candidateInsertData = {
      resume_id: resumeId,
      user_id: resumeData.user_id,
      ...processedData
    };

    const { data: candidate, error: insertError } = await supabase
      .from('candidates')
      .insert(candidateInsertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting candidate:', insertError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create candidate',
          details: insertError
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Candidate created successfully:', candidate.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        candidateId: candidate.id,
        extractedData: processedData,
        message: 'CV analyzed and candidate created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Unexpected error during resume analysis',
        details: {
          errorName: error.name,
          errorMessage: error.message
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
