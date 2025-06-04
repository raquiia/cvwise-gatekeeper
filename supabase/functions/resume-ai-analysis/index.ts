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
    let cleaned = decodeURIComponent(text);
    cleaned = cleaned.replace(/%/g, '');
    return cleaned.trim();
  } catch (error) {
    return text.replace(/%/g, '').trim();
  }
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
 * Nettoie et valide les données extraites par l'IA
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
  }
  
  console.log('✅ Final processed data:', JSON.stringify(processedData, null, 2));
  return processedData;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resumeId, text } = await req.json();
    
    if (!resumeId || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing resumeId or text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing resume:', resumeId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resumeDataResult = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();

    if (resumeDataResult.error) {
      console.error('Error fetching resume data:', resumeDataResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch resume data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resumeData = resumeDataResult.data;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
5. Décomposer l'adresse en champs séparés quand possible:
   - address: rue et numéro
   - postal_code: code postal (5 chiffres en France)
   - city: ville
   - country: pays
6. Si l'adresse est dans un seul champ, essayer de la décomposer intelligemment

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
            content: `Analyse ce CV et extrais les informations:\n\n${text}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('Raw AI response:', content);

    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // Traiter et nettoyer les données extraites
    const processedData = processAIExtractedData(extractedData);

    const { data: candidate, error: insertError } = await supabase
      .from('candidates')
      .insert({
        resume_id: resumeId,
        user_id: resumeData.user_id,
        ...processedData
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting candidate:', insertError);
      throw insertError;
    }

    console.log('Candidate created successfully:', candidate.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidateId: candidate.id,
        extractedData: processedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in resume analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
