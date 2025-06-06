
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight handler
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Scoring request:', await req.json());

    // Re-parse since first read consumed the body
    const { candidateId, jobOfferId, scoringType } = await req.json();
    
    console.log('AI Scoring request:', { candidateId, jobOfferId, scoringType });
    
    if (!candidateId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'candidateId is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get configuration from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing environment variables' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Create Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();
    
    if (candidateError || !candidate) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: candidateError?.message || 'Candidate not found' 
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch job offer data if provided
    let jobOffer = null;
    if (jobOfferId && scoringType === 'job_matching') {
      const { data: jobData, error: jobError } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', jobOfferId)
        .single();
      
      if (jobError || !jobData) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: jobError?.message || 'Job offer not found' 
        }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      jobOffer = jobData;
    }
    
    // Check for existing AI score in the database
    const { data: existingScore } = await supabase
      .from('ai_candidate_scores')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_offer_id', jobOfferId || null)
      .order('calculated_at', { ascending: false })
      .limit(1);
    
    // If we have a recent score (less than 1 hour old), return it
    if (existingScore && existingScore.length > 0) {
      const score = existingScore[0];
      const scoreAge = Date.now() - new Date(score.calculated_at).getTime();
      const oneHour = 60 * 60 * 1000;
      
      // Use cached score if it's recent
      if (scoreAge < oneHour) {
        console.log('Using cached AI score:', score);
        return new Response(JSON.stringify({ 
          success: true, 
          score: score.score,
          explanation: score.explanation,
          breakdown: score.breakdown
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }
    
    console.log('Calling OpenAI for scoring analysis');
    
    // Prepare data for AI analysis
    const candidateData = {
      id: candidate.id,
      name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
      position: candidate.position,
      company: candidate.company,
      years_experience: candidate.years_experience,
      skills: Array.isArray(candidate.skills) ? candidate.skills : [],
      education: Array.isArray(candidate.education) ? candidate.education : [],
      experiences: Array.isArray(candidate.experiences) ? candidate.experiences : [],
      certifications: Array.isArray(candidate.certifications) ? candidate.certifications : [],
      languages: Array.isArray(candidate.languages) ? candidate.languages : [],
      location: candidate.location,
      availability: candidate.availability,
      mobility: candidate.mobility,
      remote_preference: candidate.remote_preference,
      contract_type: candidate.contract_type,
      career_objectives: candidate.career_objectives,
      detailed_status: candidate.detailed_status
    };
    
    let jobOfferData = null;
    if (jobOffer) {
      jobOfferData = {
        id: jobOffer.id,
        title: jobOffer.title,
        company: jobOffer.company,
        location: jobOffer.location,
        description: jobOffer.description,
        required_skills: Array.isArray(jobOffer.required_skills) ? jobOffer.required_skills : [],
        preferred_skills: Array.isArray(jobOffer.preferred_skills) ? jobOffer.preferred_skills : [],
        experience_years_min: jobOffer.experience_years_min,
        experience_years_max: jobOffer.experience_years_max,
        education_level: jobOffer.education_level,
        required_languages: Array.isArray(jobOffer.required_languages) ? jobOffer.required_languages : []
      };
    }
    
    // Get candidate notes if available
    const { data: notes } = await supabase
      .from('candidate_notes')
      .select('*')
      .eq('candidate_id', candidateId);
    
    // Call OpenAI with different prompts based on scoring type
    const prompt = scoringType === 'job_matching'
      ? generateMatchingPrompt(candidateData, jobOfferData, notes || [])
      : generateCompletenessPrompt(candidateData, notes || []);
    
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an AI expert in candidate evaluation and job matching.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });
    
    if (!aiResponse.ok) {
      const errorData = await aiResponse.json();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Error from AI service: ' + (errorData.error?.message || 'Unknown error') 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const aiData = await aiResponse.json();
    console.log('AI analysis received');
    
    if (!aiData.choices || !aiData.choices[0]) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid response from AI service' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    let scoreData;
    try {
      const aiText = aiData.choices[0].message.content;
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || aiText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('AI response does not contain valid JSON data');
      }
      
      const jsonText = jsonMatch[1] || jsonMatch[0];
      scoreData = JSON.parse(jsonText);
      
      if (!scoreData.score || !scoreData.explanation) {
        throw new Error('AI response is missing required fields');
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to parse AI evaluation: ' + error.message,
        aiResponse: aiData.choices[0].message.content
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Ensure breakdown has consistent structure
    const breakdown = scoreData.breakdown || {
      skills: 0,
      experience: 0,
      education: 0,
      cvStructure: 0,
      profileSummary: 0
    };
    
    // Store the score in the database
    const { data: savedScore, error: saveError } = await supabase
      .from('ai_candidate_scores')
      .upsert({
        candidate_id: candidateId,
        job_offer_id: jobOfferId || null,
        user_id: candidate.user_id,
        score: scoreData.score,
        explanation: scoreData.explanation,
        breakdown: breakdown,
        calculated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Error saving AI score to database:', saveError);
    }
    
    console.log('AI scoring completed successfully');
    
    return new Response(JSON.stringify({ 
      success: true, 
      score: scoreData.score,
      explanation: scoreData.explanation,
      breakdown: breakdown
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Unexpected error in AI scoring function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

function generateMatchingPrompt(candidate, jobOffer, notes) {
  const noteTexts = notes.map(note => note.content).join('\n\n');
  
  return `
  # JOB MATCHING ANALYSIS

  Analyze how well this candidate matches the job requirements. Provide:
  1. A score from 0 to 100
  2. A brief explanation
  3. A breakdown of component scores

  ## Job Details
  Title: ${jobOffer.title}
  Company: ${jobOffer.company || 'Not specified'}
  Location: ${jobOffer.location || 'Not specified'}
  Required Skills: ${JSON.stringify(jobOffer.required_skills)}
  Preferred Skills: ${JSON.stringify(jobOffer.preferred_skills)}
  Required Experience: ${jobOffer.experience_years_min || 0} - ${jobOffer.experience_years_max || 'Not specified'} years
  Education Level: ${jobOffer.education_level || 'Not specified'}
  Required Languages: ${JSON.stringify(jobOffer.required_languages)}
  Description: ${jobOffer.description || 'Not provided'}

  ## Candidate Details
  Name: ${candidate.name}
  Current Position: ${candidate.position || 'Not specified'}
  Current Company: ${candidate.company || 'Not specified'}
  Years of Experience: ${candidate.years_experience || 'Not specified'}
  Skills: ${JSON.stringify(candidate.skills)}
  Education: ${JSON.stringify(candidate.education)}
  Work Experiences: ${JSON.stringify(candidate.experiences)}
  Certifications: ${JSON.stringify(candidate.certifications)}
  Languages: ${JSON.stringify(candidate.languages)}
  Location: ${candidate.location || 'Not specified'}
  Mobility: ${candidate.mobility || 'Not specified'}
  Remote Preference: ${candidate.remote_preference || 'Not specified'}
  Contract Type Preference: ${candidate.contract_type || 'Not specified'}
  Career Objectives: ${candidate.career_objectives || 'Not specified'}

  ${notes.length > 0 ? `## Interview Notes\n${noteTexts}` : ''}

  Output your analysis in the following JSON format only, no other text:
  \`\`\`json
  {
    "score": 85,
    "explanation": "Clear explanation here...",
    "breakdown": {
      "skills": 80,
      "experience": 90,
      "education": 70,
      "location": 65,
      "cultural": 85
    }
  }
  \`\`\`
  `;
}

function generateCompletenessPrompt(candidate, notes) {
  const noteTexts = notes.map(note => note.content).join('\n\n');
  
  return `
  # CANDIDATE PROFILE COMPLETENESS ANALYSIS

  Analyze this candidate's profile completeness and quality. Provide:
  1. A score from 0 to 100
  2. A brief explanation
  3. A breakdown of component scores

  ## Candidate Details
  Name: ${candidate.name}
  Current Position: ${candidate.position || 'Not specified'}
  Current Company: ${candidate.company || 'Not specified'}
  Years of Experience: ${candidate.years_experience || 'Not specified'}
  Skills: ${JSON.stringify(candidate.skills)}
  Education: ${JSON.stringify(candidate.education)}
  Work Experiences: ${JSON.stringify(candidate.experiences)}
  Certifications: ${JSON.stringify(candidate.certifications)}
  Languages: ${JSON.stringify(candidate.languages)}
  Location: ${candidate.location || 'Not specified'}
  Mobility: ${candidate.mobility || 'Not specified'}
  Remote Preference: ${candidate.remote_preference || 'Not specified'}
  Contract Type Preference: ${candidate.contract_type || 'Not specified'}
  Career Objectives: ${candidate.career_objectives || 'Not specified'}

  ${notes.length > 0 ? `## Interview Notes\n${noteTexts}` : ''}

  Output your analysis in the following JSON format only, no other text:
  \`\`\`json
  {
    "score": 85,
    "explanation": "Clear explanation here...",
    "breakdown": {
      "skills": 80,
      "experience": 90,
      "education": 70,
      "cvStructure": 65,
      "profileSummary": 85
    }
  }
  \`\`\`
  `;
}
