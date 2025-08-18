import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl } = await req.json();
    
    if (!linkedinUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'LinkedIn URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Extracting LinkedIn profile from URL:', linkedinUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Basic URL validation
    if (!linkedinUrl.includes('linkedin.com')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid LinkedIn URL' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use a web scraping service or API to extract LinkedIn profile
    // For now, we'll use a simple fetch approach with user-agent
    let profileData = '';
    
    try {
      const response = await fetch(linkedinUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch LinkedIn profile');
      }

      const html = await response.text();
      
      // Extract basic information from HTML (simplified approach)
      const nameMatch = html.match(/<title>([^|]+)\s*\|/);
      const name = nameMatch ? nameMatch[1].trim() : '';
      
      // Extract other information using basic regex patterns
      const headlineMatch = html.match(/headline['"]:['"]([^'"]+)['"]/);
      const headline = headlineMatch ? headlineMatch[1] : '';
      
      const locationMatch = html.match(/location['"]:['"]([^'"]+)['"]/);
      const location = locationMatch ? locationMatch[1] : '';

      // Create a structured text representation
      profileData = `
LinkedIn Profile Analysis:

Name: ${name}
Professional Headline: ${headline}
Location: ${location}
Profile URL: ${linkedinUrl}

Note: This profile was extracted from LinkedIn. Some detailed information may not be available.
For a complete analysis, consider uploading a detailed CV.
      `.trim();

    } catch (fetchError) {
      console.error('Error fetching LinkedIn profile:', fetchError);
      
      // Fallback: create basic profile structure with just the URL
      profileData = `
LinkedIn Profile Analysis:

Profile URL: ${linkedinUrl}

Note: Profile data could not be automatically extracted. Please manually provide additional information or upload a CV for complete analysis.
      `.trim();
    }

    console.log('Extracted LinkedIn profile data:', profileData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        profileText: profileData,
        source: 'linkedin',
        url: linkedinUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in extract-linkedin-profile function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to extract LinkedIn profile' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});