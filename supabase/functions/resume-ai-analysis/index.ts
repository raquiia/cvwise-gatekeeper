
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
 * Prompt simplifié pour l'analyse
 */
const createSimplifiedPrompt = (resumeText: string): string => {
  return `Analyse ce CV et retourne un JSON avec cette structure exacte :
{
  "candidate_data": {
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
    "languages": [],
    "availability": "",
    "mobility": "",
    "career_objectives": ""
  },
  "scoring": {
    "overall_score": 0,
    "explanation": "Brève analyse avec points forts et améliorations",
    "breakdown": {
      "education": 0,
      "experience": 0,
      "skills": 0,
      "languages": 0,
      "location": 0,
      "profileSummary": 0,
      "cvStructure": 0
    }
  }
}

Score sur 100 : Education(20) + Expérience(20) + Compétences(20) + Langues(10) + Localisation(10) + Résumé(10) + Structure(10)
Extraire l'adresse complète si disponible. Pays francophones privilégiés.

CV: ${resumeText.slice(0, 3000)}`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting SIMPLIFIED resume-ai-analysis');
    
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

    // CACHE TEMPORAIREMENT DÉSACTIVÉ POUR DÉBOGAGE
    console.log('⚠️ Cache temporarily disabled for debugging');

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
    
    const simplifiedPrompt = createSimplifiedPrompt(resumeText);
    
    const openAIPayload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: simplifiedPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
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

    console.log('📝 Parsing AI response...');
    let extractedData;
    try {
      extractedData = JSON.parse(content);
      console.log('✅ AI response parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON response from AI'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraction d'adresse de fallback si nécessaire
    const candidateData = extractedData.candidate_data;
    if (!candidateData.address || !candidateData.city) {
      console.log('🏠 Extracting address fallback...');
      const addressInfo = extractAddressFromText(resumeText);
      Object.assign(candidateData, addressInfo);
    }

    // Préparation des données pour insertion avec validation
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

    // Sauvegarde du score AI (SIMPLIFIÉ)
    const scoringData = extractedData.scoring;
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
        // Ne pas faire échouer toute l'opération pour une erreur de score
      } else {
        console.log('✅ AI score saved successfully');
      }
    }

    console.log('🎉 Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        candidateId: candidate.id,
        scoring: scoringData,
        message: 'CV analyzed successfully with simplified pipeline'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 CRITICAL ERROR in simplified analysis:', error);
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
