
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
 * Fonction pour décomposer une adresse complète en champs structurés
 */
const parseLocationToStructuredAddress = (location: string): {
  address: string;
  postal_code: string;
  city: string;
  country: string;
} => {
  if (!location) return { address: '', postal_code: '', city: '', country: '' };
  
  const cleanLocation = cleanAndDecodeText(location);
  
  const postalCodePattern = /\b\d{5}\b/;
  const countryPattern = /\b(France|FRANCE|Allemagne|ALLEMAGNE|Belgique|BELGIQUE|Suisse|SUISSE|Espagne|ESPAGNE|Italie|ITALIE|Luxembourg|LUXEMBOURG|Royaume-Uni|ROYAUME-UNI|UK)\b/i;
  
  let address = '';
  let postal_code = '';
  let city = '';
  let country = '';
  
  const countryMatch = cleanLocation.match(countryPattern);
  if (countryMatch) {
    country = countryMatch[0];
  }
  
  const postalMatch = cleanLocation.match(postalCodePattern);
  if (postalMatch) {
    postal_code = postalMatch[0];
  }
  
  const segments = cleanLocation.split(',').map(s => s.trim());
  
  if (segments.length >= 2) {
    address = segments[0];
    let lastSegment = segments[segments.length - 1];
    
    if (country) {
      lastSegment = lastSegment.replace(new RegExp(country, 'i'), '').trim();
    }
    
    if (postal_code) {
      lastSegment = lastSegment.replace(postal_code, '').trim();
    }
    
    city = lastSegment;
    
    if (segments.length >= 3 && !city) {
      city = segments[1];
    }
  } else if (segments.length === 1) {
    let remaining = cleanLocation;
    
    if (country) {
      remaining = remaining.replace(new RegExp(country, 'i'), '').trim();
    }
    
    if (postal_code) {
      remaining = remaining.replace(postal_code, '').trim();
    }
    
    const parts = remaining.split(/\s+/);
    if (parts.length > 3) {
      address = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
      city = parts.slice(Math.ceil(parts.length / 2)).join(' ');
    } else {
      city = remaining;
    }
  }
  
  address = address.replace(/[,;]/g, '').trim();
  city = city.replace(/[,;]/g, '').trim();
  
  return {
    address: address || '',
    postal_code: postal_code || '',
    city: city || '',
    country: country || ''
  };
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
      
      // Vérifier si c'est "undefined" ou vide
      if (processedData[field] === 'undefined' || processedData[field] === 'null' || !processedData[field]) {
        processedData[field] = '';
      }
    }
  });
  
  // Traduire le pays en français s'il est en anglais
  if (processedData.country) {
    processedData.country = translateCountryToFrench(processedData.country);
  }
  
  // Décomposer l'adresse si nécessaire
  const hasStructuredAddress = processedData.address || processedData.postal_code || 
                               processedData.city || processedData.country;
  
  if (!hasStructuredAddress && processedData.location) {
    console.log('📍 Décomposing location into structured address:', processedData.location);
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
  } else if (hasStructuredAddress) {
    // Améliorer les données existantes
    processedData.address = cleanAndDecodeText(processedData.address);
    processedData.city = cleanAndDecodeText(processedData.city);
    processedData.country = translateCountryToFrench(processedData.country);
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
    console.log('📥 Request method:', req.method);
    console.log('📥 Request headers:', Object.fromEntries(req.headers.entries()));
    
    const requestData = await req.json();
    console.log('📦 Raw request data:', JSON.stringify(requestData, null, 2));
    
    // Support both 'text' and 'resumeText' for backward compatibility
    const { resumeId, text, resumeText, overwriteExisting, fullAnalysis } = requestData;
    const finalText = text || resumeText;
    
    console.log('🔍 Extracted parameters:');
    console.log('  - resumeId:', resumeId);
    console.log('  - text length:', finalText?.length || 0);
    console.log('  - overwriteExisting:', overwriteExisting);
    console.log('  - fullAnalysis:', fullAnalysis);
    
    if (!resumeId || !finalText) {
      console.error('❌ Missing required parameters');
      console.error('  - resumeId present:', !!resumeId);
      console.error('  - text present:', !!finalText);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing resumeId or resume text',
          details: {
            resumeId: !!resumeId,
            text: !!finalText,
            textLength: finalText?.length || 0
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔑 Checking environment variables...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('  - SUPABASE_URL present:', !!supabaseUrl);
    console.log('  - SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey);
    console.log('  - OPENAI_API_KEY present:', !!openaiApiKey);

    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not found in environment');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'OpenAI API key not configured',
          details: 'The OPENAI_API_KEY environment variable is missing'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase configuration missing');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Supabase configuration missing',
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔗 Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📄 Fetching resume data for ID:', resumeId);
    const resumeDataResult = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();

    if (resumeDataResult.error) {
      console.error('❌ Error fetching resume data:', resumeDataResult.error);
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
    console.log('✅ Resume data fetched successfully for user:', resumeData.user_id);

    console.log('🤖 Preparing OpenAI request...');
    console.log('📝 Text sample (first 200 chars):', finalText.substring(0, 200) + '...');
    
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
5. IMPORTANT - Pour l'adresse, décomposer intelligemment en champs séparés:
   - address: rue et numéro (ex: "Steinbachstrasse 45")
   - postal_code: code postal uniquement (ex: "8051")
   - city: ville uniquement (ex: "Zurich")
   - country: pays EN FRANÇAIS (ex: "Suisse", "France", "Allemagne", "Belgique", etc.)
6. IMPORTANT - Toujours utiliser les noms de pays en français:
   - Switzerland → Suisse
   - Germany → Allemagne
   - Belgium → Belgique
   - Spain → Espagne
   - Italy → Italie
   - etc.
7. Si l'adresse est dans un seul champ, la décomposer intelligemment
8. Ne pas mettre de caractères encodés (comme %20) dans les résultats

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
          content: `Analyse ce CV et extrais les informations:\n\n${finalText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    };

    console.log('🚀 Calling OpenAI API...');
    console.log('📊 Payload size:', JSON.stringify(openAIPayload).length, 'bytes');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIPayload),
    });

    console.log('📡 OpenAI response status:', response.status);
    console.log('📡 OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('✅ OpenAI response received');
    console.log('📊 Response structure:', {
      choices: aiResponse.choices?.length || 0,
      usage: aiResponse.usage || 'No usage data'
    });
    
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      console.error('❌ No content received from OpenAI');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No content received from AI',
          details: 'OpenAI response did not contain any content'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📝 Raw AI response content (first 500 chars):', content.substring(0, 500) + '...');

    let extractedData;
    try {
      extractedData = JSON.parse(content);
      console.log('✅ AI response parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
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

    // Traiter et nettoyer les données extraites
    console.log('🔧 Processing extracted data...');
    const processedData = processAIExtractedData(extractedData);

    console.log('💾 Inserting candidate into database...');
    const candidateInsertData = {
      resume_id: resumeId,
      user_id: resumeData.user_id,
      ...processedData
    };
    
    console.log('📋 Candidate data to insert:', JSON.stringify(candidateInsertData, null, 2));

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
          details: {
            dbError: insertError.message,
            code: insertError.code,
            hint: insertError.hint
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Candidate created successfully with ID:', candidate.id);

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
    console.error('💥 Unexpected error in resume analysis:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 1000)
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Unexpected error during resume analysis',
        details: {
          errorName: error.name,
          errorMessage: error.message,
          errorType: typeof error
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
