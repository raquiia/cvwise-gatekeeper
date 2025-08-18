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

    // Use intelligent web scraping with AI-powered extraction
    let profileData = '';
    let extractionSuccess = false;
    
    // Try Firecrawl API if available
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (firecrawlApiKey) {
      try {
        console.log('Attempting Firecrawl API extraction...');
        
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: linkedinUrl,
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
          })
        });

        if (firecrawlResponse.ok) {
          const result = await firecrawlResponse.json();
          
          if (result.success && result.data?.extract) {
            const data = result.data.extract;
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
        } else {
          console.log('Firecrawl API error:', await firecrawlResponse.text());
        }
      } catch (firecrawlError) {
        console.error('Firecrawl extraction failed:', firecrawlError);
      }
    }
    
    // Enhanced fallback scraping if Firecrawl fails
    if (!extractionSuccess) {
      console.log('Attempting enhanced intelligent scraping...');
      
      const advancedUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ];
      
      for (const userAgent of advancedUserAgents) {
        try {
          console.log(`Intelligent scraping attempt with UA: ${userAgent.substring(0, 50)}...`);
          
          const response = await fetch(linkedinUrl, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none'
            }
          });

          if (!response.ok) {
            console.log(`HTTP error: ${response.status} ${response.statusText}`);
            continue;
          }

          const html = await response.text();
          console.log(`Received HTML content length: ${html.length}`);
          
          // Advanced extraction patterns with better regex
          let name = '';
          let headline = '';
          let location = '';
          let about = '';
          let experience = '';
          let education = '';
          let skills = '';
          
          // Extract name from multiple sources
          const namePatterns = [
            /<title>([^|•\-\n]+?)(?:\s*[\|\-•]|\s*on LinkedIn)/i,
            /"profile":.*?"firstName":"([^"]+)".*?"lastName":"([^"]+)"/,
            /"firstName":"([^"]+)".*?"lastName":"([^"]+)"/,
            /<h1[^>]*class="[^"]*profile[^"]*"[^>]*>([^<]+)/i
          ];
          
          for (const pattern of namePatterns) {
            const match = html.match(pattern);
            if (match) {
              if (match[2]) {
                name = `${match[1]} ${match[2]}`.trim();
              } else {
                name = match[1].trim();
              }
              if (name && name.length > 1) break;
            }
          }
          
          // Extract headline with better patterns
          const headlinePatterns = [
            /"headline":"([^"]+)"/,
            /"occupation":"([^"]+)"/,
            /<div[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)/i,
            /<span[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)/i
          ];
          
          for (const pattern of headlinePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              headline = match[1]
                .replace(/\\u[\dA-F]{4}/gi, '')
                .replace(/\\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              if (headline && headline.length > 5) break;
            }
          }
          
          // Extract location
          const locationPatterns = [
            /"geoLocationName":"([^"]+)"/,
            /"location":"([^"]+)"/,
            /"defaultLocalizedName":"([^"]+)"/,
            /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)/i
          ];
          
          for (const pattern of locationPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              location = match[1]
                .replace(/\\u[\dA-F]{4}/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
              if (location && location.length > 2) break;
            }
          }
          
          // Extract about/summary
          const aboutPatterns = [
            /"summary":"([^"]+)"/,
            /"description":"([^"]{50,500})"/
          ];
          
          for (const pattern of aboutPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              about = match[1]
                .replace(/\\u[\dA-F]{4}/gi, '')
                .replace(/\\n/g, '\n')
                .replace(/\s+/g, ' ')
                .trim();
              if (about && about.length > 20) break;
            }
          }
          
          // Try to extract structured data from JSON-LD or embedded JSON
          const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gi);
          if (jsonLdMatches) {
            for (const jsonLdMatch of jsonLdMatches) {
              try {
                const jsonText = jsonLdMatch.replace(/<\/?script[^>]*>/gi, '');
                const jsonData = JSON.parse(jsonText);
                
                if (jsonData.name && !name) {
                  name = jsonData.name;
                }
                if (jsonData.jobTitle && !headline) {
                  headline = jsonData.jobTitle;
                }
                if (jsonData.address && !location) {
                  location = typeof jsonData.address === 'string' ? jsonData.address : 
                    (jsonData.address.addressLocality || jsonData.address.addressRegion || '');
                }
              } catch (e) {
                // Ignore JSON parsing errors
              }
            }
          }
          
          // Check if we have meaningful extracted data
          if (name && (headline || location || about)) {
            extractionSuccess = true;
            
            profileData = `
LinkedIn Profile Analysis:

Personal Information:
- Full Name: ${name}
- Professional Headline: ${headline || 'Non spécifié'}
- Location: ${location || 'Non spécifié'}

${about ? `About:\n${about}\n` : ''}

Profile URL: ${linkedinUrl}

Note: Data extracted using intelligent web scraping. Some advanced details may require manual completion.
            `.trim();
            
            console.log('Enhanced extraction successful');
            break;
          }
          
        } catch (fetchError) {
          console.error(`Error with enhanced extraction:`, fetchError);
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