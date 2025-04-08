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

// Function to ensure proper data format
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
      if (prop === 'experiences' || prop === 'education') {
        console.log(`Formatting ${prop}, final result:`, JSON.stringify(data[prop]));
      }
    }
  });

  return data;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { resumeId, resumeText, extractText, pdfUrl } = await req.json();
    
    if (!resumeId) {
      throw new Error("L'ID du CV est requis");
    }
    
    console.log("Démarrage de l'analyse AI pour le CV:", resumeId);
    console.log("Taille du texte reçu:", resumeText?.length || 0, "caractères");
    console.log("Échantillon du texte:", resumeText?.substring(0, 200) + "...");

    // Créer un client Supabase avec la clé service
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Récupérer les données du CV pour le contexte - USING DIRECT QUERY
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .single();
      
    if (resumeError) {
      console.error("Erreur lors de la récupération du CV:", resumeError);
      throw new Error("CV introuvable");
    }
    
    // Récupérer ou créer le candidat associé - USING DIRECT QUERY
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("*")
      .eq("resume_id", resumeId)
      .maybeSingle();
    
    console.log("Candidat existant:", existingCandidate);
    
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Utiliser gpt-4o-mini qui est plus efficace avec les tokens
        messages: [
          {
            role: "system",
            content: `Tu es un expert en analyse de CV avec une grande capacité de détail. Tu dois extraire TOUTES les informations structurées du CV fourni, en accordant une attention particulière aux détails. Voici les informations à extraire:

1. Informations personnelles:
   - Prénom et nom
   - Email et téléphone
   - Adresse/localisation complète
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

Retourne ces informations sous forme d'un objet JSON structuré:

{
  "first_name": "...",
  "last_name": "...",
  "email": "...",
  "phone": "...",
  "position": "...",
  "years_experience": number,
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
            content: `Voici le texte extrait d'un CV. Analyse-le et extrait toutes les informations structurées demandées, en étant aussi exhaustif que possible:\n\n${truncatedText}`
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
      console.log("Expériences:", JSON.stringify(parsedData.experiences || parsedData.experience || []));
      console.log("Éducation:", JSON.stringify(parsedData.education || []));
      console.log("Langues:", JSON.stringify(parsedData.languages || []));
      console.log("Certifications:", JSON.stringify(parsedData.certifications || []));
      console.log("Projets:", JSON.stringify(parsedData.projects || []));
    } catch (error) {
      console.error("Erreur lors du parsing de la réponse OpenAI:", error);
      throw new Error("Impossible de traiter la réponse de l'IA");
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
      // Calcul du score basé sur la complétude et la qualité des données
      score: Math.min(95, 50 + 
        (Array.isArray(parsedData.skills) ? parsedData.skills.length * 3 : 0) + 
        (Array.isArray(parsedData.experiences || parsedData.experience) ? (parsedData.experiences || parsedData.experience).length * 5 : 0) +
        (Array.isArray(parsedData.education) ? parsedData.education.length * 3 : 0)),
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
    
    console.log("Données du candidat préparées:", JSON.stringify({
      experiences: formattedCandidateData.experiences,
      education: formattedCandidateData.education,
      languages: formattedCandidateData.languages
    }));
    
    // Upsert du candidat dans la base de données - USING DIRECT MUTATION
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
    
    // Marquer le CV comme analysé - USING DIRECT MUTATION
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
  } catch (error: any) {
    console.error("Erreur lors de l'analyse IA du CV:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Une erreur est survenue lors de l'analyse IA du CV"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
