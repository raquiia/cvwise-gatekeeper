
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
 * Fonction pour traduire les noms de pays de l'anglais vers le français
 */
const translateCountryToFrench = (country: string): string => {
  if (!country) return '';
  
  const countryTranslations: { [key: string]: string } = {
    'Switzerland': 'Suisse', 'SWITZERLAND': 'Suisse',
    'France': 'France', 'FRANCE': 'France',
    'Germany': 'Allemagne', 'GERMANY': 'Allemagne',
    'Belgium': 'Belgique', 'BELGIUM': 'Belgique',
    'Spain': 'Espagne', 'SPAIN': 'Espagne',
    'Italy': 'Italie', 'ITALY': 'Italie',
    'Luxembourg': 'Luxembourg', 'LUXEMBOURG': 'Luxembourg',
    'Netherlands': 'Pays-Bas', 'NETHERLANDS': 'Pays-Bas',
    'United Kingdom': 'Royaume-Uni', 'UNITED KINGDOM': 'Royaume-Uni',
    'UK': 'Royaume-Uni', 'Austria': 'Autriche', 'AUSTRIA': 'Autriche',
    'Portugal': 'Portugal', 'PORTUGAL': 'Portugal',
    'Canada': 'Canada', 'CANADA': 'Canada',
    'United States': 'États-Unis', 'USA': 'États-Unis', 'US': 'États-Unis'
  };
  
  const cleanCountry = country.trim();
  return countryTranslations[cleanCountry] || cleanCountry;
};

/**
 * Fonction pour extraire l'adresse du texte brut si l'IA n'a pas réussi
 */
const extractAddressFromText = (text: string): { address: string; postal_code: string; city: string; country: string; location: string } => {
  console.log('🔍 Tentative d\'extraction d\'adresse manuelle du texte...');
  
  // Patterns pour reconnaître les adresses françaises/européennes
  const addressPatterns = [
    /(\d+[\w\s,-]+?)\s*,?\s*(\d{5})\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s*,\s*(France|Suisse|Belgique|Luxembourg))?/gi,
    /(\d+\s+[^\d\n]+?)\n.*?(\d{5})\s+([A-Za-zÀ-ÿ\s-]+)/gi,
    /([A-Za-zÀ-ÿ\s-]+?)\s*,\s*(France|Suisse|Belgique|Luxembourg|Allemagne|Italie|Espagne)/gi
  ];
  
  let bestMatch = { address: '', postal_code: '', city: '', country: '', location: '' };
  
  for (const pattern of addressPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      console.log('📍 Match trouvé:', match);
      
      if (match.length >= 4) {
        const address = cleanAndDecodeText(match[1] || '');
        const postal_code = match[2] || '';
        const city = cleanAndDecodeText(match[3] || '');
        const country = translateCountryToFrench(match[4] || 'France');
        const location = `${address}${address && ', '}${postal_code} ${city}${country && ', ' + country}`.trim();
        
        if (address && postal_code && city) {
          bestMatch = { address, postal_code, city, country, location };
          console.log('✅ Adresse complète extraite:', bestMatch);
          break;
        } else if (city && !bestMatch.city) {
          bestMatch = { address, postal_code, city, country, location };
        }
      }
    }
    if (bestMatch.address && bestMatch.postal_code && bestMatch.city) break;
  }
  
  return bestMatch;
};

/**
 * Nettoie et valide les données extraites par l'IA
 */
const processAIExtractedData = (data: any, originalText: string): any => {
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
  
  // Tentative d'extraction manuelle si l'adresse est manquante
  if (!processedData.address || !processedData.postal_code || !processedData.city) {
    console.log('⚠️ Adresse incomplète détectée, tentative d\'extraction manuelle...');
    const extractedAddress = extractAddressFromText(originalText);
    
    if (extractedAddress.address && !processedData.address) {
      processedData.address = extractedAddress.address;
      console.log('📍 Adresse extraite manuellement:', extractedAddress.address);
    }
    if (extractedAddress.postal_code && !processedData.postal_code) {
      processedData.postal_code = extractedAddress.postal_code;
      console.log('📮 Code postal extrait manuellement:', extractedAddress.postal_code);
    }
    if (extractedAddress.city && !processedData.city) {
      processedData.city = extractedAddress.city;
      console.log('🏙️ Ville extraite manuellement:', extractedAddress.city);
    }
    if (extractedAddress.country && !processedData.country) {
      processedData.country = extractedAddress.country;
      console.log('🌍 Pays extrait manuellement:', extractedAddress.country);
    }
    if (extractedAddress.location && !processedData.location) {
      processedData.location = extractedAddress.location;
      console.log('📍 Localisation complète extraite manuellement:', extractedAddress.location);
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

    // Log d'un échantillon du texte pour debug
    console.log('📋 Échantillon du texte CV (premiers 300 caractères):', resumeText.substring(0, 300));

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

    console.log('🤖 Preparing optimized OpenAI request...');
    
    // Prompt optimisé et plus concis
    const optimizedPrompt = `Analyse ce CV et extrais les données + calcule le score de complétude.

EXTRACTION (JSON précis):
- Informations personnelles: nom, prénom, email, téléphone, poste actuel
- Localisation: adresse COMPLÈTE (numéro rue, code postal, ville, pays en français)
- Expérience: années + postes détaillés
- Compétences: liste claire des skills techniques
- Formation: diplômes avec années
- Langues: avec niveaux si mentionnés
- Autres: disponibilité, mobilité, objectifs

SCORE DE COMPLÉTUDE (0-100):
1. Formations détaillées (20pts)
2. Expériences avec dates/postes (20pts) 
3. Compétences techniques listées (20pts)
4. Langues mentionnées (10pts)
5. Adresse + mobilité complètes (10pts)
6. Objectifs/résumé professionnel (10pts)
7. Structure générale du CV (10pts)

IMPORTANT:
- Cherche l'adresse partout dans le CV
- Décompose TOUJOURS: address, postal_code, city, country
- Ne jamais inventer d'info
- Retourne exactement cette structure JSON:

{
  "candidate_data": {
    "first_name": "", "last_name": "", "email": "", "phone": "",
    "position": "", "location": "", "address": "", "postal_code": "", 
    "city": "", "country": "", "years_experience": 0, "company": "",
    "skills": [], "experiences": [], "education": [], "certifications": [],
    "languages": [], "publications": [], "professional_references": [],
    "professional_networks": [], "continuous_training": [], "special_permits": [],
    "industries": [], "projects": [], "availability": "", "salary_expectations": "",
    "mobility": "", "contract_type": "", "remote_preference": "", "travel_willingness": "",
    "career_objectives": "", "professional_values": "", "work_authorization": "", "interests": ""
  },
  "scoring": {
    "overall_score": 0,
    "explanation": "Analyse du profil avec points forts/faibles et suggestions d'amélioration",
    "breakdown": {
      "education": 0, "experience": 0, "skills": 0, "languages": 0,
      "location": 0, "profileSummary": 0, "cvStructure": 0
    }
  }
}`;

    const openAIPayload = {
      model: 'gpt-4o-mini', // Modèle plus économique
      messages: [
        {
          role: 'system',
          content: optimizedPrompt
        },
        {
          role: 'user',
          content: `CV à analyser:\n\n${resumeText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 3000, // Réduit de 4000 à 3000
    };

    console.log('🚀 Calling OpenAI API with optimized prompt...');
    
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

    console.log('🔧 Processing extracted data with fallback address extraction...');
    const processedCandidateData = processAIExtractedData(extractedData.candidate_data, resumeText);
    const scoringData = extractedData.scoring;

    console.log('💾 Inserting candidate into database...');
    const candidateInsertData = {
      resume_id: resumeId,
      user_id: resumeData.user_id,
      ...processedCandidateData
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

    // Sauvegarder le score IA calculé
    if (scoringData && scoringData.overall_score !== undefined) {
      console.log('💾 Saving AI score to database...');
      
      const scoreInsertData = {
        candidate_id: candidate.id,
        user_id: resumeData.user_id,
        score: scoringData.overall_score,
        explanation: scoringData.explanation || '',
        breakdown: scoringData.breakdown || {},
        calculated_at: new Date().toISOString()
      };

      const { error: scoreError } = await supabase
        .from('ai_candidate_scores')
        .insert(scoreInsertData);

      if (scoreError) {
        console.error('⚠️ Error saving AI score:', scoreError);
        // Ne pas échouer complètement si le score ne peut pas être sauvé
      } else {
        console.log('✅ AI score saved successfully');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        candidateId: candidate.id,
        extractedData: processedCandidateData,
        scoring: scoringData,
        message: 'CV analyzed with optimized AI model, candidate created and score calculated successfully'
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
