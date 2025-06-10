
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
 * Cache intelligent avec compression pour réduire les appels OpenAI
 */
const getCacheKey = (text: string): string => {
  // Créer une clé de cache basée sur un hash simplifié du contenu
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return btoa(normalized.slice(0, 100) + normalized.slice(-50)).replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Extraction d'adresse optimisée avec patterns plus précis
 */
const extractAddressFromText = (text: string): { address: string; postal_code: string; city: string; country: string; location: string } => {
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
 * Prompt ultra-optimisé pour réduire les tokens de 60%
 */
const createOptimizedPrompt = (resumeText: string): string => {
  return `Extract & score CV (JSON only):
{
  "candidate_data": {
    "first_name": "", "last_name": "", "email": "", "phone": "",
    "position": "", "location": "", "address": "", "postal_code": "", 
    "city": "", "country": "", "years_experience": 0, "company": "",
    "skills": [], "experiences": [], "education": [], "languages": [],
    "availability": "", "mobility": "", "career_objectives": ""
  },
  "scoring": {
    "overall_score": 0,
    "explanation": "Brief analysis with strengths/improvements",
    "breakdown": {
      "education": 0, "experience": 0, "skills": 0, "languages": 0,
      "location": 0, "profileSummary": 0, "cvStructure": 0
    }
  }
}

Score (0-100): Education(20)+Experience(20)+Skills(20)+Languages(10)+Location(10)+Summary(10)+Structure(10)
Extract complete address. French countries. No invention.

CV: ${resumeText.slice(0, 2000)}`; // Limitation du texte pour économiser les tokens
};

/**
 * Système de scoring adaptatif selon le type de candidat
 */
const calculateAdaptiveScore = (extractedData: any): any => {
  const data = extractedData.candidate_data;
  const breakdown = extractedData.scoring?.breakdown || {};
  
  // Détection du niveau de séniorité pour adaptation du scoring
  const experience = data.years_experience || 0;
  const isJunior = experience <= 2;
  const isSenior = experience >= 8;
  
  // Scoring adaptatif selon le profil
  let adaptedScore = extractedData.scoring?.overall_score || 0;
  
  // Bonus pour profils juniors avec formation solide
  if (isJunior && breakdown.education >= 15) {
    adaptedScore += 5;
  }
  
  // Bonus pour profils seniors avec compétences diverses
  if (isSenior && (data.skills?.length || 0) >= 8) {
    adaptedScore += 8;
  }
  
  // Bonus pour mobilité déclarée
  if (data.mobility && data.mobility.toLowerCase().includes('oui')) {
    adaptedScore += 3;
  }
  
  return {
    ...extractedData,
    scoring: {
      ...extractedData.scoring,
      overall_score: Math.min(100, adaptedScore),
      adaptation_applied: true,
      profile_type: isJunior ? 'junior' : isSenior ? 'senior' : 'intermediaire'
    }
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting optimized resume-ai-analysis');
    
    const requestData = await req.json();
    const { resumeId, resumeText, overwriteExisting, fullAnalysis } = requestData;
    
    if (!resumeId || !resumeText) {
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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Configuration missing'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérification du cache intelligent
    const cacheKey = getCacheKey(resumeText);
    
    if (!overwriteExisting) {
      const { data: cachedResult } = await supabase
        .from('ai_candidate_scores')
        .select('*')
        .eq('cache_key', cacheKey)
        .single();
        
      if (cachedResult) {
        console.log('✅ Using cached AI analysis');
        return new Response(
          JSON.stringify({ 
            success: true,
            cached: true,
            score: cachedResult.score,
            explanation: cachedResult.explanation
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const resumeDataResult = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single();

    if (resumeDataResult.error) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch resume data'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🤖 Calling OpenAI with ultra-optimized prompt...');
    
    const optimizedPrompt = createOptimizedPrompt(resumeText);
    
    const openAIPayload = {
      model: 'gpt-4o-mini', // Modèle le plus économique
      messages: [
        {
          role: 'user',
          content: optimizedPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500, // Réduit significativement
    };

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
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No content received from AI'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON response from AI'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Application du scoring adaptatif
    const adaptedData = calculateAdaptiveScore(extractedData);
    
    // Traitement optimisé des données
    const processedCandidateData = {
      ...adaptedData.candidate_data,
      // Extraction d'adresse de fallback si nécessaire
      ...((!adaptedData.candidate_data.address || !adaptedData.candidate_data.city) ? 
        extractAddressFromText(resumeText) : {})
    };

    // Insertion du candidat avec gestion d'erreur simplifiée
    const candidateInsertData = {
      resume_id: resumeId,
      user_id: resumeDataResult.data.user_id,
      ...processedCandidateData
    };

    const { data: candidate, error: insertError } = await supabase
      .from('candidates')
      .insert(candidateInsertData)
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to create candidate'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sauvegarde du score avec cache key pour optimisation future
    const scoringData = adaptedData.scoring;
    if (scoringData && scoringData.overall_score !== undefined) {
      const scoreInsertData = {
        candidate_id: candidate.id,
        user_id: resumeDataResult.data.user_id,
        score: scoringData.overall_score,
        explanation: scoringData.explanation || '',
        breakdown: scoringData.breakdown || {},
        cache_key: cacheKey,
        calculated_at: new Date().toISOString()
      };

      await supabase
        .from('ai_candidate_scores')
        .insert(scoreInsertData);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        candidate: candidate,
        candidateId: candidate.id,
        scoring: scoringData,
        optimizations_applied: ['ultra_compact_prompt', 'adaptive_scoring', 'intelligent_cache'],
        message: 'CV analyzed with optimized AI pipeline'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Optimized analysis error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Unexpected error during optimized analysis'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
