
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";
import * as pdfjs from "https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.min.js";

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

// Fonction pour extraire le texte d'un fichier PDF
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  try {
    console.log("Loading PDF document...");
    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = "";
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str);
      const pageText = textItems.join(" ");
      fullText += pageText + "\n";
    }
    
    console.log(`Successfully extracted ${fullText.length} characters of text`);
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    // Ne plus utiliser la fonction simulateCVText pour les fallbacks
    return "Erreur lors de l'extraction du texte du document PDF";
  }
}

// Fonction pour extraire les compétences à partir du texte du CV
function extractSkills(text: string) {
  // Liste de compétences courantes à rechercher
  const commonSkills = [
    "JavaScript", "React", "Vue", "Angular", "TypeScript", "Node.js", 
    "Python", "Java", "C#", "C++", "PHP", "Ruby", "Go", "Rust",
    "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "DevOps", "CI/CD", "Jenkins", "GitHub Actions", "CircleCI",
    "Agile", "Scrum", "Kanban", "Project Management", "Jira", "Confluence",
    "Machine Learning", "AI", "Data Science", "Data Analysis", "BigData",
    "Product Management", "UX/UI", "Design Thinking", "Figma", "Adobe XD",
    "SEO", "Marketing", "Content Strategy", "Social Media", "Analytics"
  ];
  
  // Recherche des compétences dans le texte
  const foundSkills = commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills.slice(0, 5); // Limiter à 5 compétences mais ne pas ajouter de compétences aléatoires
}

// Fonction pour extraire les informations d'un CV
async function extractResumeInfo(resumeText: string, fileName: string) {
  console.log("Extracting resume information...");
  
  // Essayer d'extraire un nom du fichier (si format "Prénom_Nom.pdf")
  let firstName = "";
  let lastName = "";
  
  const fileNameParts = fileName.split('.')[0].split('_');
  if (fileNameParts.length >= 2) {
    firstName = fileNameParts[0].charAt(0).toUpperCase() + fileNameParts[0].slice(1).toLowerCase();
    lastName = fileNameParts[1].charAt(0).toUpperCase() + fileNameParts[1].slice(1).toLowerCase();
  } else {
    // Si le nom de fichier ne suit pas le format attendu, essayer d'extraire du texte
    const nameRegex = /(?:nom|name|je suis|je m'appelle|cv de)\s+([A-Z][a-z]+)\s+([A-Z][a-zÀ-ÿ-]+)/i;
    const nameMatch = resumeText.match(nameRegex);
    if (nameMatch) {
      firstName = nameMatch[1];
      lastName = nameMatch[2];
    } else {
      // Si aucun nom n'est trouvé, utiliser le nom du fichier comme base
      firstName = fileName.split('.')[0].replace(/_/g, ' ');
      lastName = "";
    }
  }
  
  // Essayer de trouver un email dans le texte
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = resumeText.match(emailRegex);
  const email = emailMatches ? emailMatches[0] : "";
  
  // Essayer de trouver un numéro de téléphone
  const phoneRegex = /(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|(\+\d{1,3}[\s.-]?)?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g;
  const phoneMatches = resumeText.match(phoneRegex);
  const phone = phoneMatches ? phoneMatches[0] : "";
  
  // Extraire des compétences du texte
  const skills = extractSkills(resumeText);
  
  // Extraire d'autres informations
  const position = extractPosition(resumeText) || "";
  const yearsExperience = estimateYearsExperience(resumeText) || 0;
  const location = extractLocation(resumeText) || "";
  
  // Calculer un score basé sur le contenu
  const score = calculateScore(resumeText, skills);
  
  return {
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: phone,
    position: position,
    years_experience: yearsExperience,
    location: location,
    skills: skills,
    score: score,
    status: "qualification"
  };
}

// Function to estimate years of experience from CV text
function estimateYearsExperience(text: string): number | null {
  // Look for patterns like "X years of experience" or "X ans d'expérience"
  const expMatches = text.match(/(\d+)(?:\+)?\s+(?:years|ans|year|an)(?:\s+of)?\s+(?:experience|expérience|d'expérience)/i);
  if (expMatches && expMatches[1]) {
    return parseInt(expMatches[1], 10);
  }
  
  // Try to extract work experience dates and calculate total duration
  const yearRanges = text.match(/\b(19|20)\d{2}\s*[-–—]\s*(?:(19|20)\d{2}|present|actuel|aujourd'hui|maintenant)\b/gi);
  if (yearRanges && yearRanges.length > 0) {
    let totalYears = 0;
    const currentYear = new Date().getFullYear();
    
    yearRanges.forEach(range => {
      const years = range.split(/[-–—]/);
      const startYear = parseInt(years[0].trim(), 10);
      const endYearText = years[1].trim().toLowerCase();
      const endYear = /^(19|20)\d{2}$/.test(endYearText) 
        ? parseInt(endYearText, 10) 
        : currentYear;
      
      if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
        totalYears += (endYear - startYear);
      }
    });
    
    return totalYears > 0 ? totalYears : null;
  }
  
  return null;
}

// Function to extract location from CV text
function extractLocation(text: string): string | null {
  // Common French cities with regex pattern
  const cities = [
    "Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Toulouse", "Nantes", 
    "Strasbourg", "Montpellier", "Nice", "Rennes", "Grenoble", "Angers"
  ];
  
  for (const city of cities) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) {
      return `${city}, France`;
    }
  }
  
  return null;
}

// Function to extract job position from CV text
function extractPosition(text: string): string | null {
  const positionPatterns = [
    /\b(développeur|developer)[\s-]*(full[\s-]*stack|frontend|backend|web|senior|junior|mobile)\b/i,
    /\b(ingénieur|engineer)[\s-]*(logiciel|software|développement|development)\b/i,
    /\b(chef|lead)[\s-]*(de projet|project|technique|technical)\b/i,
    /\b(architect|architecte)[\s-]*(logiciel|software|solution|système|system)\b/i,
    /\b(product|produit)[\s-]*(owner|manager)\b/i,
    /\b(ux|ui|ux\/ui)[\s-]*(designer|design)\b/i,
    /\b(data)[\s-]*(scientist|analyst|analyste|engineer|ingénieur)\b/i
  ];
  
  for (const pattern of positionPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Format the position nicely
      const position = match[0];
      return position.charAt(0).toUpperCase() + position.slice(1);
    }
  }
  
  return null;
}

// Function to calculate a score based on CV content
function calculateScore(text: string, skills: string[]): number {
  // Base score between 70-85
  let score = 70 + Math.floor(Math.random() * 15);
  
  // Adjust score based on skills quantity
  score += Math.min(skills.length * 2, 10);
  
  // Adjust score based on education level
  if (/master|msc|m\.sc|bac\+5/i.test(text)) {
    score += 5;
  } else if (/bachelor|licence|bsc|b\.sc|bac\+3/i.test(text)) {
    score += 3;
  }
  
  // Check for experience at well-known companies
  const topCompanies = [
    "google", "amazon", "microsoft", "apple", "facebook", "meta", "ibm", 
    "oracle", "sap", "salesforce", "accenture", "capgemini", "sopra", "atos"
  ];
  
  for (const company of topCompanies) {
    if (new RegExp(`\\b${company}\\b`, 'i').test(text)) {
      score += 3;
      break; // Only add the bonus once
    }
  }
  
  // Cap the score at 98 (leaving room for truly exceptional cases)
  return Math.min(score, 98);
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  try {
    const { resumeId } = await req.json();
    console.log(`Analyzing resume with ID: ${resumeId}`);
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les informations du CV depuis Supabase
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();
    
    if (resumeError || !resumeData) {
      throw new Error(resumeError?.message || "CV non trouvé");
    }
    
    console.log(`Found resume: ${resumeData.file_name}`);
    
    // Fetch the resume file from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from("resumes")
      .download(resumeData.file_path);
    
    if (fileError || !fileData) {
      throw new Error(fileError?.message || "Fichier CV non trouvé");
    }
    
    console.log(`Successfully downloaded file: ${resumeData.file_path}`);
    
    // Convert the file to a byte array
    const fileBytes = new Uint8Array(await fileData.arrayBuffer());
    
    // Extract text from the PDF if it's a PDF file
    let resumeText = "";
    if (resumeData.file_type === "application/pdf") {
      resumeText = await extractTextFromPDF(fileBytes);
    } else {
      // Pour les fichiers non-PDF, essayer de les traiter comme du texte
      const decoder = new TextDecoder('utf-8');
      resumeText = decoder.decode(fileBytes);
    }
    
    console.log(`Extracted ${resumeText.length} characters of text from the resume`);
    
    // Extraire les informations du CV
    const extractedInfo = await extractResumeInfo(resumeText, resumeData.file_name);
    
    console.log(`Extracted candidate info: ${extractedInfo.first_name} ${extractedInfo.last_name}`);
    
    // Créer ou mettre à jour le candidat dans la base de données
    const { data: candidateData, error: candidateError } = await supabase
      .from("candidates")
      .upsert({
        resume_id: resumeId,
        user_id: resumeData.user_id,
        ...extractedInfo,
      })
      .select()
      .single();
    
    if (candidateError) {
      throw new Error(candidateError.message);
    }
    
    // Marquer le CV comme analysé
    await supabase
      .from("resumes")
      .update({ parsed: true })
      .eq("id", resumeId);
    
    console.log("Resume analysis completed successfully");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "CV analysé avec succès",
        candidate: candidateData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Erreur lors de l'analyse du CV",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
