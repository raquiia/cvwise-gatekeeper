import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.16.1';

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

    // Get Firecrawl API key
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
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

    // Try Firecrawl first for intelligent extraction
    let profileData = '';
    let extractionSuccess = false;
    
    if (firecrawlApiKey) {
      try {
        console.log('Attempting Firecrawl extraction...');
        const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
        
        const result = await firecrawl.scrapeUrl(linkedinUrl, {
          formats: ['markdown', 'extract'],
          extract: {
            schema: {
              type: "object",
              properties: {
                fullName: { type: "string", description: "Full name of the person" },
                headline: { type: "string", description: "Professional headline or title" },
                location: { type: "string", description: "Current location" },
                about: { type: "string", description: "About/summary section" },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      duration: { type: "string" },
                      description: { type: "string" }
                    }
                  }
                },
                education: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      school: { type: "string" },
                      degree: { type: "string" },
                      duration: { type: "string" }
                    }
                  }
                },
                skills: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        });

        if (result.success && result.extract) {
          const data = result.extract;
          console.log('Firecrawl extraction successful:', data);
          
          if (data.fullName || data.headline) {
            extractionSuccess = true;
            
            // Create structured profile data
            profileData = `
LinkedIn Profile Analysis:

Personal Information:
- Full Name: ${data.fullName || 'Non spécifié'}
- Professional Headline: ${data.headline || 'Non spécifié'}
- Location: ${data.location || 'Non spécifié'}

${data.about ? `About:\n${data.about}\n` : ''}

${data.experience && data.experience.length > 0 ? `Professional Experience:\n${data.experience.map(exp => 
  `- ${exp.title || 'Poste'} at ${exp.company || 'Entreprise'} (${exp.duration || 'Durée non spécifiée'})\n  ${exp.description || ''}`
).join('\n')}\n` : ''}

${data.education && data.education.length > 0 ? `Education:\n${data.education.map(edu => 
  `- ${edu.degree || 'Diplôme'} at ${edu.school || 'École'} (${edu.duration || 'Période non spécifiée'})`
).join('\n')}\n` : ''}

${data.skills && data.skills.length > 0 ? `Skills:\n${data.skills.join(', ')}\n` : ''}

Profile URL: ${linkedinUrl}

Note: Data extracted automatically from LinkedIn profile using AI.
            `.trim();
          }
        }
      } catch (firecrawlError) {
        console.error('Firecrawl extraction failed:', firecrawlError);
      }
    }
    
    // Fallback to traditional scraping if Firecrawl fails
    if (!extractionSuccess) {
      console.log('Falling back to traditional scraping...');
      
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ];
      
      for (const userAgent of userAgents) {
        try {
          console.log(`Trying traditional extraction with user agent: ${userAgent.substring(0, 50)}...`);
          
          const response = await fetch(linkedinUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Connection': 'keep-alive',
            }
          });

          if (!response.ok) {
            console.log(`HTTP error: ${response.status} ${response.statusText}`);
            continue;
          }

          const html = await response.text();
          console.log(`Received HTML content length: ${html.length}`);
          
          // Basic extraction patterns
          let name = '';
          let headline = '';
          let location = '';
          
          // Try to extract name from title
          const titleMatch = html.match(/<title>([^|]+)\s*\|/);
          if (titleMatch && titleMatch[1]) {
            name = titleMatch[1].trim();
          }
          
          // Try to extract headline
          const headlineMatch = html.match(/"headline":"([^"]+)"/);
          if (headlineMatch && headlineMatch[1]) {
            headline = headlineMatch[1].replace(/\\u[\dA-F]{4}/gi, '').trim();
          }
          
          // Try to extract location
          const locationMatch = html.match(/"geoLocationName":"([^"]+)"/);
          if (locationMatch && locationMatch[1]) {
            location = locationMatch[1].replace(/\\u[\dA-F]{4}/gi, '').trim();
          }
          
          if (name && (headline || location)) {
            extractionSuccess = true;
            profileData = `
LinkedIn Profile Analysis:

Personal Information:
- Full Name: ${name}
- Professional Headline: ${headline || 'Non spécifié'}
- Location: ${location || 'Non spécifié'}

Profile URL: ${linkedinUrl}

Note: Basic data extracted from LinkedIn profile. Limited information available.
            `.trim();
            console.log('Traditional extraction successful');
            break;
          }
          
        } catch (fetchError) {
          console.error(`Error with traditional extraction:`, fetchError);
          continue;
        }
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