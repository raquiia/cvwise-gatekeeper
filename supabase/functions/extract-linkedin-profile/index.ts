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

    // Enhanced web scraping with multiple approaches
    let profileData = '';
    let extractionSuccess = false;
    
    // Try multiple user agents and approaches
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    
    for (const userAgent of userAgents) {
      try {
        console.log(`Trying extraction with user agent: ${userAgent.substring(0, 50)}...`);
        
        const response = await fetch(linkedinUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });

        if (!response.ok) {
          console.log(`HTTP error: ${response.status} ${response.statusText}`);
          continue;
        }

        const html = await response.text();
        console.log(`Received HTML content length: ${html.length}`);
        
        // Enhanced extraction with multiple patterns
        let name = '';
        let headline = '';
        let location = '';
        let experience = '';
        let education = '';
        let skills = '';
        
        // Try different patterns for name extraction
        const namePatterns = [
          /<title>([^|]+)\s*\|/,
          /"firstName":"([^"]+)"/,
          /"lastName":"([^"]+)"/,
          /<h1[^>]*>([^<]+)<\/h1>/
        ];
        
        for (const pattern of namePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            name = match[1].trim();
            break;
          }
        }
        
        // Try different patterns for headline
        const headlinePatterns = [
          /"headline":"([^"]+)"/,
          /<h2[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)<\/h2>/,
          /"occupation":"([^"]+)"/
        ];
        
        for (const pattern of headlinePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            headline = match[1].replace(/\\u[\dA-F]{4}/gi, '').trim();
            break;
          }
        }
        
        // Try different patterns for location
        const locationPatterns = [
          /"geoLocationName":"([^"]+)"/,
          /"location":"([^"]+)"/,
          /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/
        ];
        
        for (const pattern of locationPatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            location = match[1].replace(/\\u[\dA-F]{4}/gi, '').trim();
            break;
          }
        }
        
        // Look for experience data
        const experienceMatches = html.match(/"experience":\s*\[([^\]]+)\]/);
        if (experienceMatches) {
          experience = experienceMatches[1].substring(0, 500); // Limit length
        }
        
        // Look for education data
        const educationMatches = html.match(/"education":\s*\[([^\]]+)\]/);
        if (educationMatches) {
          education = educationMatches[1].substring(0, 500); // Limit length
        }
        
        // Look for skills
        const skillsMatches = html.match(/"skills":\s*\[([^\]]+)\]/);
        if (skillsMatches) {
          skills = skillsMatches[1].substring(0, 300); // Limit length
        }
        
        // Check if we extracted meaningful data
        if (name && (headline || location || experience || education)) {
          extractionSuccess = true;
          
          // Create comprehensive profile data
          profileData = `
LinkedIn Profile Analysis:

Personal Information:
- Full Name: ${name}
- Professional Headline: ${headline || 'Non spécifié'}
- Location: ${location || 'Non spécifié'}

${experience ? `Professional Experience:\n${experience.replace(/[{}"]/g, '').replace(/,/g, '\n')}\n` : ''}
${education ? `Education:\n${education.replace(/[{}"]/g, '').replace(/,/g, '\n')}\n` : ''}
${skills ? `Skills:\n${skills.replace(/[{}"]/g, '').replace(/,/g, ', ')}\n` : ''}

Profile URL: ${linkedinUrl}

Note: Data extracted automatically from LinkedIn profile. Some details may be incomplete.
          `.trim();
          
          console.log('Successfully extracted LinkedIn profile data');
          break;
        }
        
      } catch (fetchError) {
        console.error(`Error with user agent ${userAgent}:`, fetchError);
        continue;
      }
    }
    
    // If extraction failed, return a flag for manual input
    if (!extractionSuccess) {
      console.log('All extraction attempts failed, returning extraction failure flag');
      
      return new Response(
        JSON.stringify({ 
          success: false,
          extractionFailed: true,
          error: 'Automatic extraction failed. Manual input required.',
          url: linkedinUrl
        }),
        { 
          status: 200, // Not a server error, just extraction limitation
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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