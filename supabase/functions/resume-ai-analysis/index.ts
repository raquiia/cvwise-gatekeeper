import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.2";

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

// Truncate text to avoid token limit issues with OpenAI
function truncateText(text: string, maxLength = 30000): string {
  if (!text || text.length <= maxLength) return text;
  
  console.log(`Truncating text from ${text.length} characters to ${maxLength} characters`);
  
  // Extract the first part for basic info
  const firstPart = text.substring(0, maxLength * 0.3);
  
  // Try to find important sections like experience, education, skills
  const experienceMatch = text.match(/expérience|experience|professional|professionnel/i);
  const educationMatch = text.match(/education|formation|études|etudes/i);
  const skillsMatch = text.match(/compétences|competences|skills|skillset/i);
  const languagesMatch = text.match(/langues|languages|language/i);
  const projectsMatch = text.match(/projets|projects|réalisations/i);
  const certificationsMatch = text.match(/certifications|certificats|diplômes/i);
  
  let experiencePart = "";
  let educationPart = "";
  let skillsPart = "";
  let languagesPart = "";
  let projectsPart = "";
  let certificationsPart = "";
  
  // Get experience section if found (up to 40% of max length)
  if (experienceMatch && experienceMatch.index !== undefined) {
    const start = experienceMatch.index;
    const end = Math.min(start + (maxLength * 0.4), text.length);
    experiencePart = text.substring(start, end);
  }
  
  // Get education section if found (up to 15% of max length)
  if (educationMatch && educationMatch.index !== undefined) {
    const start = educationMatch.index;
    const end = Math.min(start + (maxLength * 0.15), text.length);
    educationPart = text.substring(start, end);
  }
  
  // Get skills section if found (up to 15% of max length)
  if (skillsMatch && skillsMatch.index !== undefined) {
    const start = skillsMatch.index;
    const end = Math.min(start + (maxLength * 0.15), text.length);
    skillsPart = text.substring(start, end);
  }
  
  // Get languages section if found
  if (languagesMatch && languagesMatch.index !== undefined) {
    const start = languagesMatch.index;
    const end = Math.min(start + (maxLength * 0.1), text.length);
    languagesPart = text.substring(start, end);
  }
  
  // Get projects section if found
  if (projectsMatch && projectsMatch.index !== undefined) {
    const start = projectsMatch.index;
    const end = Math.min(start + (maxLength * 0.15), text.length);
    projectsPart = text.substring(start, end);
  }
  
  // Get certifications section if found
  if (certificationsMatch && certificationsMatch.index !== undefined) {
    const start = certificationsMatch.index;
    const end = Math.min(start + (maxLength * 0.1), text.length);
    certificationsPart = text.substring(start, end);
  }
  
  // Combine parts with markers
  return [
    "--- DÉBUT DU CV (PREMIÈRES INFORMATIONS) ---",
    firstPart,
    "--- SECTION EXPÉRIENCE ---",
    experiencePart,
    "--- SECTION ÉDUCATION ---",
    educationPart,
    "--- SECTION COMPÉTENCES ---",
    skillsPart,
    "--- SECTION LANGUES ---",
    languagesPart,
    "--- SECTION PROJETS ---",
    projectsPart,
    "--- SECTION CERTIFICATIONS ---",
    certificationsPart,
    "--- FIN DU CV (TRONQUÉ POUR L'ANALYSE) ---"
  ].join("\n\n");
}

// Extract JSON content from potential markdown-formatted responses
function extractJsonFromMarkdown(text: string): string {
  // Check if response contains markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    console.log("Extracted JSON from markdown code block");
    return jsonMatch[1];
  }
  
  // If no code blocks, try to find JSON object directly
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    console.log("Extracted JSON object directly from response");
    return objectMatch[0];
  }
  
  // Return original text if no JSON pattern found
  return text;
}

// Fonction pour garantir que toutes les propriétés complexes sont au bon format
function ensureProperDataFormat(data: any): any {
  // Fonction interne pour vérifier et convertir les données
  const ensureArray = (value: any): any[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch (e) {
        return [value];
      }
    }
    return [value];
  };

  // Convertir les propriétés qui devraient être des tableaux
  const arrayProperties = [
    'skills', 'experiences', 'education', 'certifications', 
    'languages', 'projects', 'professional_references', 
    'professional_networks', 'industries'
  ];
  
  arrayProperties.forEach(prop => {
    if (prop in data) {
      data[prop] = ensureArray(data[prop]);
      
      // Log de debugging pour les propriétés importantes
      if (prop === 'experiences' || prop === 'education' || prop === 'languages' || prop === 'certifications') {
        console.log(`Formatting ${prop}, final result:`, JSON.stringify(data[prop]));
      }
    }
  });

  return data;
}

// Importer les fonctions depuis notre fichier d'utilitaires
// Note: les edge functions ne peuvent pas importer directement du projet frontend,
// donc nous avons besoin de recréer la fonction ici
function calculateCandidateQualityScore(candidateData: any): number {
  if (!candidateData) return 0;
  
  // Base score starts at 50
  let baseScore = 50;
  
  // Skills quality - award points for relevant/in-demand skills
  const inDemandSkills = [
    'javascript', 'python', 'react', 'nodejs', 'typescript', 'aws', 'azure', 
    'docker', 'kubernetes', 'machine learning', 'data science', 'devops',
    'product management', 'ui/ux', 'agile', 'scrum', 'java', 'c#', '.net',
    'sql', 'nosql', 'mongodb', 'postgresql', 'leadership'
  ];
  
  const candidateSkills = candidateData.skills || [];
  const normalizedCandidateSkills = candidateSkills.map((skill: string) => 
    typeof skill === 'string' ? skill.toLowerCase() : String(skill).toLowerCase()
  );
  
  // Count in-demand skills (with partial matching)
  let inDemandSkillCount = 0;
  for (const skill of normalizedCandidateSkills) {
    if (inDemandSkills.some(inDemandSkill => 
      skill === inDemandSkill || 
      skill.includes(inDemandSkill) || 
      inDemandSkill.includes(skill)
    )) {
      inDemandSkillCount++;
    }
  }
  
  // Award up to 20 points for in-demand skills (capped at 20 points)
  const skillsScore = Math.min(20, inDemandSkillCount * 2);
  
  // Experience quality - award points for years of experience
  const experienceYears = candidateData.years_experience || 0;
  // 0-15 points based on years of experience (capped at 15 years)
  const experienceScore = Math.min(15, experienceYears);
  
  // Education quality - award points for education level
  let educationScore = 0;
  const education = candidateData.education || [];
  
  // Check for highest education level
  if (education.length > 0) {
    // Award points based on highest education (simplified)
    const degrees = education.map((edu: any) => 
      (edu.degree || '').toLowerCase()
    );
    
    if (degrees.some(d => d.includes('phd') || d.includes('doctorate'))) {
      educationScore = 15;
    } else if (degrees.some(d => d.includes('master') || d.includes('mba'))) {
      educationScore = 12;
    } else if (degrees.some(d => d.includes('bachelor') || d.includes('license'))) {
      educationScore = 10;
    } else if (degrees.some(d => d.includes('associate') || d.includes('certificate'))) {
      educationScore = 7;
    } else {
      educationScore = 5; // Some education listed but not recognized
    }
  }
  
  // Calculate final score
  const finalScore = Math.min(95, 
    baseScore + skillsScore + experienceScore + educationScore
  );
  
  return Math.round(finalScore);
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { resumeId, resumeText, extractText, pdfUrl, fullAnalysis = false } = await req.json();
    
    if (!resumeId) {
      throw new Error("L'ID du CV est requis");
    }
    
    console.log("Démarrage de l'analyse AI pour le CV:", resumeId);
    console.log("Taille du texte reçu:", resumeText?.length || 0, "caractères");
    console.log("Analyse complète demandée:", fullAnalysis ? "Oui" : "Non");
    console.log("Échantillon du texte:", resumeText?.substring(0, 200) + "...");

    // Créer un client Supabase avec la clé service
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les données du CV pour le contexte
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();
      
    if (resumeError) {
      console.error("Erreur lors de la récupération du CV:", resumeError);
      throw new Error("CV introuvable");
    }
    
    // Récupérer ou créer le candidat associé
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("*")
      .eq("resume_id", resumeId)
      .maybeSingle();
    
    console.log("Candidat existant:", existingCandidate ? "Oui" : "Non");
    
    // Extraire ou utiliser le texte du CV
    let textToAnalyze = resumeText;
    
    if (!textToAnalyze && pdfUrl) {
      console.log("URL PDF fournie, tentative d'extraction du texte");
      
      try {
        // Appeler notre fonction d'extraction de texte avec l'URL
        const extractResponse = await fetch(`${supabaseUrl}/functions/v1/extract-cv-text`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ pdfUrl, resumeId })
        });
        
        if (!extractResponse.ok) {
          throw new Error(`Échec de l'extraction: ${extractResponse.status} ${extractResponse.statusText}`);
        }
        
        const extractData = await extractResponse.json();
        
        if (!extractData.success) {
          throw new Error(extractData.error || "Échec de l'extraction du texte");
        }
        
        textToAnalyze = extractData.data.text;
        console.log("Texte extrait avec succès, longueur:", textToAnalyze.length);
      } catch (extractError) {
        console.error("Erreur lors de l'extraction du texte:", extractError);
        // On continue avec l'ancienne méthode d'extraction si disponible
      }
    }
    
    if (!textToAnalyze && extractText) {
      console.log("Extraction du texte côté serveur demandée");
      
      try {
        // Télécharger le fichier du storage avec des privilèges élevés
        const { data: fileData, error: fileError } = await supabase.storage
          .from("resumes")
          .download(resumeData.file_path);
          
        if (fileError || !fileData) {
          console.error("Erreur lors du téléchargement du fichier:", fileError);
          throw new Error("Impossible de télécharger le fichier du CV");
        }
        
        // Convertir le blob en texte
        textToAnalyze = await fileData.text();
        console.log("Texte extrait côté serveur, longueur:", textToAnalyze.length);
      } catch (extractError) {
        console.error("Erreur lors de l'extraction du texte:", extractError);
        throw new Error("Échec de l'extraction du texte du CV");
      }
    }
    
    if (!textToAnalyze) {
      throw new Error("Le texte du CV est requis pour l'analyse");
    }
    
    console.log("Texte à analyser, longueur:", textToAnalyze.length);
    
    // IMPORTANT: Tronquer le texte pour respecter les limites de tokens d'OpenAI
    const truncatedText = truncateText(textToAnalyze, 30000);
    
    // Utiliser OpenAI pour analyser le CV
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("Clé API OpenAI non configurée");
    }
    
    // Construire la requête vers l'API OpenAI
    console.log("Envoi de la requête à OpenAI");
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Tu es un expert en analyse de CV avec une grande capacité de détail. Tu dois extraire TOUTES les informations structurées du CV fourni, en accordant une attention particulière aux détails. Voici les informations à extraire:

1. Informations personnelles:
   - Prénom et nom
   - Email et téléphone (TRÈS IMPORTANT - cherche tous les formats possibles : +33, 0X XX XX XX XX, etc.)
   - **ADRESSE STRUCTURÉE** : Tu dois absolument décomposer l'adresse complète en :
     * "address" : numéro et nom de rue (ex: "123 rue de la Paix")
     * "postal_code" : code postal uniquement (ex: "75001")
     * "city" : ville uniquement (ex: "Paris")
     * "country" : pays (ex: "France")
     * "location" : adresse complète pour compatibilité (ex: "123 rue de la Paix, 75001 Paris, France")
   - LinkedIn ou autres profils professionnels

2. Profil professionnel:
   - Titre/position actuelle précis
   - Années d'expérience totales (estimation si non spécifiée)
   - Entreprise actuelle/dernière
   - Secteurs d'activité/industries
   - Mobilité et préférences de travail (télétravail, déplacements)
   - Attentes salariales (si mentionnées)

3. Compétences techniques:
   - Liste EXHAUSTIVE de toutes les compétences techniques mentionnées
   - Niveau d'expertise pour chaque compétence (si précisé)
   - Technologies, outils, méthodologies
   - Compétences clés mises en avant

4. Expériences professionnelles:
   - POUR CHAQUE expérience, TOUS les détails suivants:
     * Titre exact du poste
     * Nom complet de l'entreprise
     * Dates précises (mois/année de début et fin)
     * Localisation
     * Description détaillée des responsabilités et réalisations
     * Technologies et compétences utilisées
     * Résultats quantifiables ou projets notables

5. Formation académique:
   - POUR CHAQUE formation:
     * Diplôme/certification obtenu(e) (titre exact)
     * Nom complet de l'établissement
     * Dates précises (année de début et fin)
     * Localisation
     * Spécialisation/domaine d'étude
     * Mentions ou résultats notables

6. Certifications professionnelles:
   - Intitulé exact de chaque certification
   - Organisme de certification
   - Date d'obtention et validité
   - Numéro ou référence (si mentionné)

7. Langues:
   - Chaque langue maîtrisée
   - Niveau précis pour chaque langue (CECRL: A1/A2/B1/B2/C1/C2 ou débutant/intermédiaire/courant/bilingue)

8. Projets professionnels ou personnels:
   - Nom et description de chaque projet
   - Technologies et outils utilisés
   - Rôle dans le projet
   - Date ou période
   - Résultats ou impacts

9. Centres d'intérêt et activités:
   - Loisirs, sports, activités communautaires
   - Engagements associatifs ou bénévoles
   - Publications ou contributions

10. Autres informations pertinentes:
    - Permis ou autorisations spéciales
    - Publications académiques ou professionnelles
    - Références professionnelles
    - Disponibilité
    - Objectifs de carrière
    - Valeurs professionnelles

IMPORTANT: 
- Pour chaque information extraite, sois EXTRÊMEMENT PRÉCIS et EXHAUSTIF.
- N'invente JAMAIS d'informations qui ne sont pas présentes dans le CV.
- Si tu n'es pas sûr d'une information, indique-le clairement.
- Pour les expériences professionnelles et formations, assure-toi de capturer TOUS les détails fournis dans le texte original.
- Les expériences et éducation doivent TOUJOURS être des tableaux d'objets, même s'il n'y a qu'un seul élément.
- Ne laisse pas de champs vides - si l'information n'est pas disponible, tu peux utiliser null pour les valeurs numériques ou des chaînes vides pour le texte.
- TÉLÉPHONE : Cherche absolument TOUS les formats de numéros de téléphone possibles dans le texte.
- **ADRESSE : DÉCOMPOSE OBLIGATOIREMENT l'adresse en composants séparés (address, postal_code, city, country)**

Retourne ces informations sous forme d'un objet JSON structuré:

{
  "first_name": "...",
  "last_name": "...",
  "email": "...",
  "phone": "...",
  "position": "...",
  "years_experience": number,
  "address": "...",
  "postal_code": "...",
  "city": "...",
  "country": "...",
  "location": "...",
  "skills": ["skill1", "skill2", ...],
  "company": "...",
  "experiences": [
    {
      "title": "...",
      "company": "...",
      "start_date": "...",
      "end_date": "...",
      "location": "...",
      "description": "..."
    },
    ...
  ],
  "education": [
    {
      "degree": "...",
      "institution": "...",
      "start_date": "...",
      "end_date": "...",
      "location": "...",
      "description": "..."
    },
    ...
  ],
  "certifications": [
    {
      "name": "...",
      "issuer": "...",
      "date": "...",
      "description": "..."
    },
    ...
  ],
  "languages": [
    {
      "language": "...",
      "level": "..."
    },
    ...
  ],
  "projects": [
    {
      "name": "...",
      "description": "...",
      "technologies": "...",
      "date": "...",
      "role": "...",
      "url": "..."
    },
    ...
  ],
  "interests": "...",
  "professional_networks": [
    {
      "platform": "...",
      "url": "..."
    },
    ...
  ],
  "availability": "...",
  "salary_expectations": "...",
  "mobility": "...",
  "contract_type": "...",
  "remote_preference": "...",
  "travel_willingness": "...",
  "professional_references": [
    {
      "name": "...",
      "position": "...",
      "company": "...",
      "contact": "..."
    },
    ...
  ],
  "career_objectives": "...",
  "professional_values": "...",
  "work_authorization": "...",
  "industries": ["industry1", "industry2", ...]
}

Tu dois fournir un JSON valide sans utiliser de blocs de code markdown. Retourne UNIQUEMENT le JSON, sans texte supplémentaire.`
            },
            {
              role: "user",
              content: `Voici le texte extrait d'un CV. Analyse-le et extrait toutes les informations structurées demandées, en étant aussi exhaustif que possible. ATTENTION PARTICULIÈRE : cherche absolument le numéro de téléphone sous tous les formats possibles et DÉCOMPOSE OBLIGATOIREMENT l'adresse en composants séparés (address, postal_code, city, country):\n\n${truncatedText}`
            }
          ],
          temperature: 0.2,
          max_tokens: 3000
        })
      });
      
      // Traiter la réponse de l'API
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur OpenAI:", errorData);
        throw new Error(`Erreur lors de l'analyse IA: ${errorData.error?.message || response.statusText}`);
      }
      
      const aiResult = await response.json();
      console.log("Réponse d'OpenAI reçue");
      
      // Extraire le contenu JSON de la réponse
      let parsedData: any;
      try {
        const content = aiResult.choices[0].message.content;
        // Utiliser la fonction d'extraction JSON pour gérer le cas où OpenAI retourne un JSON encapsulé dans un bloc de code markdown
        const cleanedContent = extractJsonFromMarkdown(content);
        console.log("Contenu nettoyé:", cleanedContent.substring(0, 200) + "...");
        
        parsedData = JSON.parse(cleanedContent);
        console.log("Données structurées extraites avec succès");
        
        // Vérifions les expériences et l'éducation
        console.log("Expériences:", Array.isArray(parsedData.experiences) ? parsedData.experiences.length + " trouvées" : "Format invalide");
        console.log("Éducation:", Array.isArray(parsedData.education) ? parsedData.education.length + " trouvées" : "Format invalide");
        console.log("Langues:", Array.isArray(parsedData.languages) ? parsedData.languages.length + " trouvées" : "Format invalide");
        console.log("Certifications:", Array.isArray(parsedData.certifications) ? parsedData.certifications.length + " trouvées" : "Format invalide");
        console.log("Projets:", Array.isArray(parsedData.projects) ? parsedData.projects.length + " trouvés" : "Format invalide");
        console.log("Téléphone extrait:", parsedData.phone || "Non trouvé");
        console.log("Localisation extraite:", parsedData.location || "Non trouvée");
      } catch (error) {
        console.error("Erreur lors du parsing de la réponse OpenAI:", error);
        throw new Error("Impossible de traiter la réponse de l'IA");
      }
      
      // Si le candidat existe déjà, préserver certaines données existantes
      // en cas d'analyse incomplète
      if (existingCandidate && !fullAnalysis) {
        console.log("Préservation des données existantes en cas d'échec de l'analyse");
        
        // Préserver les tableaux s'ils sont vides dans les nouvelles données
        if (!parsedData.experiences || parsedData.experiences.length === 0) {
          parsedData.experiences = existingCandidate.experiences || [];
        }
        
        if (!parsedData.education || parsedData.education.length === 0) {
          parsedData.education = existingCandidate.education || [];
        }
        
        if (!parsedData.languages || parsedData.languages.length === 0) {
          parsedData.languages = existingCandidate.languages || [];
        }
        
        if (!parsedData.certifications || parsedData.certifications.length === 0) {
          parsedData.certifications = existingCandidate.certifications || [];
        }
        
        if (!parsedData.projects || parsedData.projects.length === 0) {
          parsedData.projects = existingCandidate.projects || [];
        }
        
        // Préserver le téléphone et la localisation si pas trouvés dans la nouvelle analyse
        if (!parsedData.phone && existingCandidate.phone) {
          parsedData.phone = existingCandidate.phone;
        }
        
        if (!parsedData.location && existingCandidate.location) {
          parsedData.location = existingCandidate.location;
        }
      }
      
      // Transformer les données pour correspondre au schéma de la base de données
      const candidateData = {
        resume_id: resumeId,
        user_id: resumeData.user_id,
        first_name: parsedData.first_name || parsedData.firstName || "",
        last_name: parsedData.last_name || parsedData.lastName || "",
        email: parsedData.email || "",
        phone: parsedData.phone || parsedData.phoneNumber || "",
        position: parsedData.position || parsedData.title || parsedData.currentPosition || "",
        years_experience: parsedData.years_experience || parsedData.yearsExperience || 0,
        location: parsedData.location || "",
        address: parsedData.address || "",
        postal_code: parsedData.postal_code || "",
        city: parsedData.city || "",
        country: parsedData.country || "",
        skills: parsedData.skills || [],
        company: parsedData.company || parsedData.currentCompany || "",
        experiences: parsedData.experiences || parsedData.experience || parsedData.professionalExperiences || [],
        education: parsedData.education || [],
        certifications: parsedData.certifications || [],
        languages: parsedData.languages || [],
        interests: parsedData.interests || parsedData.hobbies || "",
        projects: parsedData.projects || [],
        industries: parsedData.industries || [],
        professional_references: parsedData.professional_references || [],
        professional_networks: parsedData.professional_networks || [],
        availability: parsedData.availability || null,
        salary_expectations: parsedData.salary_expectations || null,
        mobility: parsedData.mobility || null,
        contract_type: parsedData.contract_type || null,
        remote_preference: parsedData.remote_preference || null,
        travel_willingness: parsedData.travel_willingness || null,
        career_objectives: parsedData.career_objectives || null,
        professional_values: parsedData.professional_values || null,
        work_authorization: parsedData.work_authorization || null,
        // Utiliser notre fonction de calcul de score de qualité
        score: calculateCandidateQualityScore({
          skills: parsedData.skills || [],
          years_experience: parsedData.years_experience || parsedData.yearsExperience || 0,
          education: parsedData.education || [],
          experiences: parsedData.experiences || parsedData.experience || []
        }),
        status: "qualification",
        profile_completeness: Math.min(95, 30 + 
          (Array.isArray(parsedData.skills) ? parsedData.skills.length * 3 : 0) + 
          (Array.isArray(parsedData.experiences || parsedData.experience) ? (parsedData.experiences || parsedData.experience).length * 5 : 0) +
          (Array.isArray(parsedData.education) ? parsedData.education.length * 3 : 0) +
          (Array.isArray(parsedData.languages) ? parsedData.languages.length * 2 : 0) +
          (Array.isArray(parsedData.certifications) ? parsedData.certifications.length * 2 : 0))
      };
      
      // S'assurer que toutes les propriétés complexes sont correctement formatées
      const formattedCandidateData = ensureProperDataFormat(candidateData);
      
      console.log("Données du candidat préparées avec succès");
      console.log("Nombre d'expériences:", Array.isArray(formattedCandidateData.experiences) ? formattedCandidateData.experiences.length : 0);
      console.log("Nombre de formations:", Array.isArray(formattedCandidateData.education) ? formattedCandidateData.education.length : 0);
      console.log("Nombre de langues:", Array.isArray(formattedCandidateData.languages) ? formattedCandidateData.languages.length : 0);
      console.log("Nombre de certifications:", Array.isArray(formattedCandidateData.certifications) ? formattedCandidateData.certifications.length : 0);
      console.log("Téléphone final:", formattedCandidateData.phone || "Non disponible");
      console.log("Localisation finale:", formattedCandidateData.location || "Non disponible");
      
      // Upsert du candidat dans la base de données
      console.log("Enregistrement du candidat dans la base de données");
      const { data: savedCandidate, error: candidateError } = await supabase
        .from("candidates")
        .upsert({
          ...(existingCandidate || {}),
          ...formattedCandidateData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (candidateError) {
        console.error("Erreur lors de l'enregistrement du candidat:", candidateError);
        throw new Error(`Impossible d'enregistrer le candidat: ${candidateError.message}`);
      }
      
      // Marquer le CV comme analysé
      const { error: updateError } = await supabase
        .from("resumes")
        .update({ parsed: true })
        .eq("id", resumeId);
        
      if (updateError) {
        console.error("Erreur lors de la mise à jour du statut du CV:", updateError);
        // Ne pas faire échouer l'opération entière pour cette erreur
      }
      
      console.log("Analyse IA du CV terminée avec succès");
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Analyse IA terminée avec succès",
          candidate: savedCandidate,
          parsed_data: parsedData
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    } catch (openaiError: any) {
      console.error("Erreur OpenAI:", openaiError);
      
      // Retourner une réponse avec succès=false mais avec un code 200 pour éviter les erreurs de non-2xx
      return new Response(
        JSON.stringify({
          success: false,
          error: openaiError.message || "Erreur lors de l'appel à OpenAI",
          message: "L'analyse a échoué mais sera réessayée"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 // Important: Always return 200 status even for errors
        }
      );
    }
    
  } catch (error: any) {
    console.error("Erreur lors de l'analyse IA du CV:", error);
    
    // Retourner une réponse avec succès=false mais avec un code 200 pour éviter les erreurs de non-2xx
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Une erreur est survenue lors de l'analyse IA du CV",
        message: "L'analyse a échoué mais sera réessayée"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 // Important: Always return 200 status even for errors
      }
    );
  }
});
