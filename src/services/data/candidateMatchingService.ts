// Import the necessary libraries and services
import { JobOffer } from "./jobOfferService";
import { jobOfferService } from "./jobOfferService";
import { candidateService } from "./candidateService";
import type { CandidateData } from "./resumeDataService";

/**
 * Interface for JobOfferSuggestion
 */
export interface JobOfferSuggestion {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  education?: string;
  experience?: {
    min?: number;
    max?: number;
  };
  contractType?: string;
  remotePreference?: string;
  location?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

/**
 * Interface for skill match details
 */
export interface SkillsDetails {
  score: number;
  matchedSkills?: string[];
  missingSkills?: string[];
}

/**
 * Interface for match details
 */
export interface MatchDetails {
  skills_details: SkillsDetails;
  experience_details: { score: number };
  education_details: { score: number };
  location_details: { score: number };
}

/**
 * Interface for CandidateJobMatch
 */
export interface CandidateJobMatch {
  id?: string;
  candidate_id?: string;
  job_offer_id?: string;
  match_score: number;
  skills_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  match_details: MatchDetails; // Now required, not optional
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for CandidateMatch
 */
export interface CandidateMatch {
  candidate: CandidateData;
  match: CandidateJobMatch;
}

/**
 * Service for candidate matching operations
 */
export const candidateMatchingService = {
  /**
   * Calculate matches for a job offer
   */
  calculateMatchesForJobOffer: async (jobOfferId: string): Promise<boolean> => {
    try {
      console.log(`Calculating matches for job offer: ${jobOfferId}`);
      // Implementation would involve comparing candidates to the job offer
      return true;
    } catch (error) {
      console.error("Error calculating matches:", error);
      throw error;
    }
  },

  /**
   * Get specific candidate-job match
   */
  getCandidateJobMatch: async (candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> => {
    console.log(`Getting match between candidate ${candidateId} and job offer ${jobOfferId}`);
    // Mock implementation for now
    return null;
  },

  /**
   * Get all matches for a job offer
   */
  getMatchesForJobOffer: async (jobOfferId: string): Promise<CandidateMatch[]> => {
    console.log(`Getting all candidate matches for job offer: ${jobOfferId}`);
    // Mock implementation that returns an empty array with the required structure
    return [];
  },

  /**
   * Get top candidates for a job offer
   */
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 5): Promise<CandidateMatch[]> => {
    console.log(`Getting top ${limit} candidates for job offer: ${jobOfferId}`);
    // Mock implementation that returns an empty array with the required structure
    return [];
  },

  /**
   * Generate suggestions for job offer based on title and location
   * @param title Job title
   * @param location Job location (optional)
   * @param freeformText Free-form description text (optional)
   * @returns Suggestions for the job offer
   */
  generateJobOfferSuggestions: async (title: string, location?: string, freeformText?: string): Promise<JobOfferSuggestion> => {
    console.log(`Generating suggestions for job offer: ${title}, ${location || 'No location'}`);
    console.log(`Freeform text provided: ${freeformText ? 'Yes' : 'No'}`);
    
    try {
      // Default assumptions
      let suggestedExperienceMin = 2;
      let suggestedExperienceMax = 5;
      let suggestedEducation = "Bac+5";
      let suggestedSkills: string[] = [];
      let suggestedContractType = "CDI";
      let suggestedRemotePreference = "Hybride";
      let suggestedDescription = "";
      let suggestedLocation = location || "";
      let suggestedTitle = title || "";
      let suggestedSalaryMin = 0;
      let suggestedSalaryMax = 0;
      let suggestedSalaryCurrency = "EUR";
      
      // Process freeform text if provided
      if (freeformText) {
        console.log("Analyzing freeform text...");
        
        // Extract experience information
        const experienceRegex = /(\d+)[ -]*(?:à|to|-|et)[ -]*(\d+)\s*ans|(\d+)\s*ans?\s*(?:d'expérience|d'exp|expérience|exp|minimum|min|maximum|max)/gi;
        const experienceMatches = [...freeformText.matchAll(experienceRegex)];
        
        if (experienceMatches.length > 0) {
          const match = experienceMatches[0];
          if (match[1] && match[2]) {
            // Range format: "X à Y ans"
            suggestedExperienceMin = parseInt(match[1]);
            suggestedExperienceMax = parseInt(match[2]);
          } else if (match[3]) {
            // Single value format: "X ans d'expérience"
            if (freeformText.toLowerCase().includes("minimum") || freeformText.toLowerCase().includes("min")) {
              suggestedExperienceMin = parseInt(match[3]);
              suggestedExperienceMax = parseInt(match[3]) + 3; // Assume a range
            } else if (freeformText.toLowerCase().includes("maximum") || freeformText.toLowerCase().includes("max")) {
              suggestedExperienceMax = parseInt(match[3]);
              suggestedExperienceMin = Math.max(0, parseInt(match[3]) - 2); // Assume a range
            } else {
              suggestedExperienceMin = parseInt(match[3]);
              suggestedExperienceMax = parseInt(match[3]) + 2; // Assume a range
            }
          }
        }
        
        // Extract education information
        const educationRegex = /bac\s*\+\s*(\d+)|bac|master|licence|doctorat|diplôme|diplome|ingénieur|ingenieur/i;
        const educationMatch = freeformText.match(educationRegex);
        
        if (educationMatch) {
          const educationText = educationMatch[0].toLowerCase();
          if (educationText.includes("bac+5") || educationText.includes("bac +5") || educationText.includes("master") || educationText.includes("ingenieur") || educationText.includes("ingénieur")) {
            suggestedEducation = "Bac+5";
          } else if (educationText.includes("bac+3") || educationText.includes("bac +3") || educationText.includes("licence")) {
            suggestedEducation = "Bac+3";
          } else if (educationText.includes("bac+2") || educationText.includes("bac +2")) {
            suggestedEducation = "Bac+2";
          } else if (educationText.includes("doctorat")) {
            suggestedEducation = "Doctorat";
          } else if (educationText.includes("bac") && !educationText.includes("+")) {
            suggestedEducation = "Bac";
          }
        }
        
        // Extract contract type
        const contractRegex = /cdi|cdd|intérim|interim|stage|alternance|freelance|consultant/i;
        const contractMatch = freeformText.match(contractRegex);
        
        if (contractMatch) {
          const contractText = contractMatch[0].toLowerCase();
          if (contractText.includes("cdi")) {
            suggestedContractType = "CDI";
          } else if (contractText.includes("cdd")) {
            suggestedContractType = "CDD";
          } else if (contractText.includes("intérim") || contractText.includes("interim")) {
            suggestedContractType = "Intérim";
          } else if (contractText.includes("stage")) {
            suggestedContractType = "Stage";
          } else if (contractText.includes("alternance")) {
            suggestedContractType = "Alternance";
          } else if (contractText.includes("freelance") || contractText.includes("consultant")) {
            suggestedContractType = "Freelance";
          }
        }
        
        // Extract remote preference
        const remoteRegex = /télétravail|teletravail|remote|à distance|a distance|sur site|présentiel|presentiel|hybride|hybrid/i;
        const remoteMatch = freeformText.match(remoteRegex);
        
        if (remoteMatch) {
          const remoteText = remoteMatch[0].toLowerCase();
          if ((remoteText.includes("télétravail") || remoteText.includes("teletravail") || remoteText.includes("remote") || 
               remoteText.includes("à distance") || remoteText.includes("a distance")) && 
              (remoteText.includes("total") || remoteText.includes("complet") || remoteText.includes("full"))) {
            suggestedRemotePreference = "Full remote";
          } else if (remoteText.includes("hybride") || remoteText.includes("hybrid") || 
                    (remoteText.includes("télétravail") || remoteText.includes("teletravail")) && 
                    (remoteText.includes("partiel") || remoteText.includes("possible"))) {
            suggestedRemotePreference = "Hybride";
          } else if (remoteText.includes("sur site") || remoteText.includes("présentiel") || remoteText.includes("presentiel")) {
            suggestedRemotePreference = "Sur site";
          }
        }
        
        // Extract salary information
        const salaryRegex = /(\d+[\s\.,]?(?:\d+)?)\s*(?:k€|k\s*€|k|€|euros|euro|EUR|CHF|£|GBP|USD|\$)(?:\s*[-à]\s*(\d+[\s\.,]?(?:\d+)?)\s*(?:k€|k\s*€|k|€|euros|euro|EUR|CHF|£|GBP|USD|\$))?/i;
        const salaryMatch = freeformText.match(salaryRegex);
        
        if (salaryMatch) {
          const fullMatch = salaryMatch[0].toLowerCase();
          const min = salaryMatch[1]?.replace(/[\s\.]/g, '').replace(',', '');
          const max = salaryMatch[2]?.replace(/[\s\.]/g, '').replace(',', '');
          
          // Determine currency
          if (fullMatch.includes('chf')) {
            suggestedSalaryCurrency = "CHF";
          } else if (fullMatch.includes('£') || fullMatch.includes('gbp')) {
            suggestedSalaryCurrency = "GBP";
          } else if (fullMatch.includes('$') || fullMatch.includes('usd')) {
            suggestedSalaryCurrency = "USD";
          } else {
            suggestedSalaryCurrency = "EUR";
          }
          
          // Determine if it's K (thousands)
          const isK = fullMatch.includes('k');
          const multiplier = isK ? 1000 : 1;
          
          if (min) {
            suggestedSalaryMin = parseInt(min) * multiplier;
          }
          
          if (max) {
            suggestedSalaryMax = parseInt(max) * multiplier;
          } else if (min) {
            // If only min is provided, set max to min + 20%
            suggestedSalaryMax = suggestedSalaryMin * 1.2;
          }
        }
        
        // Extract location if not provided
        if (!suggestedLocation) {
          const locationRegex = /\b(?:à|a|en|au|dans|près de|proche de)\s+([A-Z][a-zÀ-ÿ-]+(?:\s+[A-Z][a-zÀ-ÿ-]+)*)/;
          const locationMatch = freeformText.match(locationRegex);
          
          if (locationMatch && locationMatch[1]) {
            suggestedLocation = locationMatch[1];
            
            // Try to determine country if not explicitly mentioned
            if (!suggestedLocation.includes(",")) {
              // List of major cities and their countries
              const cityToCountry: Record<string, string> = {
                "Paris": "France",
                "Lyon": "France",
                "Marseille": "France",
                "Toulouse": "France",
                "Bordeaux": "France",
                "Lille": "France",
                "Nice": "France",
                "Nantes": "France",
                "Strasbourg": "France",
                "London": "UK",
                "Londres": "UK",
                "Manchester": "UK",
                "Liverpool": "UK",
                "Birmingham": "UK",
                "Geneva": "Switzerland",
                "Genève": "Suisse",
                "Zurich": "Switzerland",
                "Basel": "Switzerland",
                "Bâle": "Suisse",
                "Bern": "Switzerland",
                "Berne": "Suisse",
                "Brussels": "Belgium",
                "Bruxelles": "Belgique",
                "Antwerp": "Belgium",
                "Anvers": "Belgique",
                "Ghent": "Belgium",
                "Gand": "Belgique",
                "Luxembourg": "Luxembourg",
                "Madrid": "Spain",
                "Barcelone": "Espagne",
                "Berlin": "Germany",
                "Munich": "Allemagne",
                "Frankfort": "Germany",
                "Francfort": "Allemagne",
                "Hamburg": "Germany",
                "Hambourg": "Allemagne",
                "Rome": "Italy",
                "Milan": "Italie",
                "Amsterdam": "Netherlands",
                "Rotterdam": "Pays-Bas"
              };
              
              // Check if city is in our known list
              const cityName = suggestedLocation.split(" ")[0]; // Take just the first word
              if (cityToCountry[cityName]) {
                suggestedLocation = `${suggestedLocation}, ${cityToCountry[cityName]}`;
              }
            }
          }
        }
        
        // Extract job title if not provided
        if (!suggestedTitle) {
          // Try to extract a job title from the first sentence
          const firstSentence = freeformText.split(/[.!?]/)[0].trim();
          const commonTitlePatterns = [
            /recherche\s+(?:d['']un|d['']une|de|du|des)\s+([^,\.]+)/i,
            /offre\s+(?:d['']un|d['']une|de|du|des)\s+([^,\.]+)/i,
            /poste\s+(?:d['']un|d['']une|de|du|des)\s+([^,\.]+)/i,
            /(?:^|\s+)([a-zÀ-ÿ]+(?:\s+[a-zÀ-ÿ]+){0,3}(?:\s+senior|\s+junior|\s+confirmé|\s+débutant)?)/i
          ];
          
          for (const pattern of commonTitlePatterns) {
            const match = firstSentence.match(pattern);
            if (match && match[1]) {
              suggestedTitle = match[1].trim();
              // Capitalize first letter of each word
              suggestedTitle = suggestedTitle.replace(/\b\w/g, c => c.toUpperCase());
              break;
            }
          }
          
          // If still no title, use first few words
          if (!suggestedTitle && firstSentence.length < 50) {
            suggestedTitle = firstSentence;
          } else if (!suggestedTitle) {
            suggestedTitle = firstSentence.split(" ").slice(0, 5).join(" ") + "...";
          }
        }
        
        // Extract skills from text
        const techSkillsList = [
          // Programming languages
          "Java", "JavaScript", "TypeScript", "Python", "C#", "C++", "C", "Go", "Golang", "Ruby", "PHP", "Swift", 
          "Kotlin", "Rust", "Scala", "Perl", "Shell", "Bash", "PowerShell", "SQL", "PL/SQL", "T-SQL", "R", 
          "MATLAB", "Objective-C", "Assembly", "Dart", "F#", "Visual Basic", "VB.NET", "COBOL", "Fortran",
          
          // Web technologies
          "HTML", "CSS", "SASS", "SCSS", "Less", "XML", "JSON", "AJAX", "REST", "GraphQL", "gRPC", "WebSockets",
          "Web Services", "API", "HTTP", "HTTPS", "OAuth", "JWT", "SOAP", "WebRTC", "PWA", "Web Components",
          
          // Frameworks & libraries
          "React", "Angular", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "Gatsby", "Express", "Node.js", "Django",
          "Flask", "Spring", "Spring Boot", "Hibernate", "JPA", ".NET", "ASP.NET", "ASP.NET Core", "Rails", "Laravel",
          "Symfony", "CodeIgniter", "Bootstrap", "Tailwind CSS", "Material UI", "jQuery", "Backbone.js", "Ember.js",
          "Redux", "MobX", "Vue Router", "React Router", "Jest", "Mocha", "Chai", "Cypress", "Playwright", "Selenium",
          "TensorFlow", "PyTorch", "Keras", "scikit-learn", "pandas", "NumPy", "SciPy", "Redux Toolkit", "Vuex",
          
          // DevOps & infrastructure
          "Docker", "Kubernetes", "Helm", "Jenkins", "Travis CI", "CircleCI", "GitHub Actions", "GitLab CI/CD",
          "AWS", "Azure", "GCP", "Google Cloud", "Terraform", "Ansible", "Chef", "Puppet", "Vagrant", "Prometheus",
          "Grafana", "ELK Stack", "Elastic Stack", "Nginx", "Apache", "IIS", "Traefik", "HAProxy", "Linux", "Unix",
          "Windows Server", "CI/CD", "DevOps", "SRE", "Serverless", "Microservices", "Service Mesh", "Istio", 
          "Consul", "Envoy", "Vault", "Artifactory", "Nexus", "Git", "Subversion", "SVN", "Mercurial",
          
          // Databases
          "MySQL", "PostgreSQL", "SQL Server", "Oracle", "SQLite", "MongoDB", "Cassandra", "Redis", "Elasticsearch",
          "DynamoDB", "Firebase", "Neo4j", "MariaDB", "CouchDB", "RethinkDB", "InfluxDB", "Fauna", "MS SQL", "NoSQL",
          
          // Cloud services
          "S3", "EC2", "Lambda", "ECS", "EKS", "RDS", "DynamoDB", "SQS", "SNS", "CloudFront", "API Gateway",
          "App Engine", "Cloud Functions", "Cloud Run", "BigQuery", "Cloud Storage", "Azure Functions", "Azure SQL",
          "Cosmos DB", "Blob Storage", "App Service", "IAM", "Cognito", "Active Directory", "Heroku", "Netlify", "Vercel",
          
          // Mobile development
          "iOS", "Android", "React Native", "Flutter", "Xamarin", "Ionic", "Cordova", "Swift UI", "Jetpack Compose",
          "Kotlin Multiplatform", "Mobile Development", "Progressive Web Apps", "PWA", "Mobile-First Design",
          
          // Data & analytics
          "Big Data", "Hadoop", "Spark", "Kafka", "Airflow", "ETL", "Data Warehouse", "Data Lake", "Business Intelligence",
          "BI", "Tableau", "Power BI", "Looker", "QlikView", "Qlik Sense", "OLAP", "Data Mining", "Data Visualization",
          
          // Other skills & tools
          "JIRA", "Confluence", "Trello", "Asana", "Notion", "Slack", "Teams", "Agile", "Scrum", "Kanban", "SAFe",
          "Waterfall", "MS Office", "Excel", "SharePoint", "WordPress", "Drupal", "Magento", "Shopify", "Adobe Creative Suite",
          "Figma", "Sketch", "Adobe XD", "InVision", "Photoshop", "Illustrator", "UX", "UI", "UX/UI", "Design Thinking",
          "SEO", "A/B Testing", "Accessibility", "WCAG", "W3C", "Responsive Design", "Mobile-First Design", "Usability Testing",
          "SaaS", "CRM", "ERP", "CMS", "Sales Force", "HubSpot", "Zendesk"
        ];
        
        // Match skills in the text
        const extractedSkills = new Set<string>();
        for (const skill of techSkillsList) {
          const skillRegex = new RegExp(`\\b${skill}\\b`, 'i');
          if (skillRegex.test(freeformText)) {
            extractedSkills.add(skill);
          }
        }
        
        // Fix casing of skills
        suggestedSkills = Array.from(extractedSkills);
        
        // Create a default description from the information we have
        if (suggestedTitle && suggestedSkills.length > 0) {
          suggestedDescription = `# ${suggestedTitle}\n\n`;
          
          // Add location if available
          if (suggestedLocation) {
            suggestedDescription += `## Localisation\n${suggestedLocation}\n\n`;
          }
          
          // Introduction
          suggestedDescription += `## Description du poste\nNous recherchons un${suggestedTitle.match(/^[aeiouyéèêAEIOUYÉÈÊ]/i) ? "'" : " "}${suggestedTitle} `;
          suggestedDescription += `${suggestedExperienceMin > 0 ? `avec au moins ${suggestedExperienceMin} ans d'expérience ` : ""}`;
          suggestedDescription += `pour rejoindre notre équipe `;
          suggestedDescription += `${suggestedRemotePreference === "Sur site" ? "sur site" : 
                                    suggestedRemotePreference === "Hybride" ? "en mode hybride" : "en full remote"}.\n\n`;
          
          // Add random responsibilities based on title
          suggestedDescription += "### Responsabilités\n";
          const responsibilities = [
            "Concevoir et développer des solutions innovantes",
            "Collaborer avec l'équipe pour atteindre les objectifs du projet",
            "Participer aux réunions d'équipe et aux revues de code",
            "Assurer la qualité et la maintenabilité du code",
            "Résoudre les problèmes techniques et optimiser les performances",
            "Participer à l'architecture technique des solutions",
            "Rester à la pointe des dernières technologies et tendances"
          ];
          
          // Add 3-5 random responsibilities
          const selectedResponsibilities = responsibilities.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 3);
          suggestedDescription += selectedResponsibilities.map(r => `- ${r}`).join("\n") + "\n\n";
          
          // Add skills section
          suggestedDescription += "### Compétences requises\n";
          suggestedDescription += suggestedSkills.map(skill => `- ${skill}`).join("\n") + "\n\n";
          
          // Add education and experience
          suggestedDescription += "### Profil recherché\n";
          suggestedDescription += `- Formation : ${suggestedEducation}\n`;
          if (suggestedExperienceMin === suggestedExperienceMax) {
            suggestedDescription += `- Expérience : ${suggestedExperienceMin} ans\n`;
          } else {
            suggestedDescription += `- Expérience : ${suggestedExperienceMin} à ${suggestedExperienceMax} ans\n`;
          }
          suggestedDescription += `- Type de contrat : ${suggestedContractType}\n`;
          suggestedDescription += `- Mode de travail : ${suggestedRemotePreference}\n`;
          
          // Add salary if available
          if (suggestedSalaryMin > 0 || suggestedSalaryMax > 0) {
            suggestedDescription += "\n### Rémunération\n";
            if (suggestedSalaryMin > 0 && suggestedSalaryMax > 0) {
              suggestedDescription += `Salaire : ${suggestedSalaryMin.toLocaleString()} à ${suggestedSalaryMax.toLocaleString()} ${suggestedSalaryCurrency} par an\n`;
            } else if (suggestedSalaryMin > 0) {
              suggestedDescription += `Salaire : À partir de ${suggestedSalaryMin.toLocaleString()} ${suggestedSalaryCurrency} par an\n`;
            } else if (suggestedSalaryMax > 0) {
              suggestedDescription += `Salaire : Jusqu'à ${suggestedSalaryMax.toLocaleString()} ${suggestedSalaryCurrency} par an\n`;
            }
          }
        } else {
          // If we couldn't extract enough information, use the freeform text directly
          suggestedDescription = freeformText;
        }
      } else {
        // If no freeform text, create suggestions based on title and location
        // Process title to determine suggested skills and other parameters
        const titleLower = title.toLowerCase();
        
        // Developer roles
        if (titleLower.includes('développeur') || titleLower.includes('developer') || titleLower.includes('dev')) {
          if (titleLower.includes('front') || titleLower.includes('frontend') || titleLower.includes('front-end')) {
            suggestedSkills = ['JavaScript', 'HTML', 'CSS', 'React', 'Vue.js', 'Angular', 'TypeScript', 'Responsive Design'];
          } else if (titleLower.includes('back') || titleLower.includes('backend') || titleLower.includes('back-end')) {
            suggestedSkills = ['Java', 'Spring', 'Python', 'Node.js', 'SQL', 'API', 'Microservices', 'AWS'];
          } else if (titleLower.includes('full') || titleLower.includes('fullstack') || titleLower.includes('full-stack')) {
            suggestedSkills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'REST API', 'Git'];
          } else if (titleLower.includes('mobile')) {
            suggestedSkills = ['Swift', 'Kotlin', 'Java', 'React Native', 'Android', 'iOS', 'Mobile UI/UX', 'API Integration'];
          } else if (titleLower.includes('web')) {
            suggestedSkills = ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js', 'SEO', 'Performance Optimization', 'Responsive Design'];
          } else {
            suggestedSkills = ['JavaScript', 'Java', 'Python', 'SQL', 'Cloud', 'Git', 'Agile', 'Problem Solving'];
          }
        }
        // Data roles
        else if (titleLower.includes('data')) {
          if (titleLower.includes('scientist')) {
            suggestedSkills = ['Python', 'R', 'Machine Learning', 'SQL', 'Statistics', 'TensorFlow', 'scikit-learn', 'Data Visualization'];
            suggestedExperienceMin = 3;
            suggestedExperienceMax = 8;
          } else if (titleLower.includes('analyst')) {
            suggestedSkills = ['SQL', 'Excel', 'BI Tools', 'Tableau', 'Power BI', 'Data Visualization', 'Statistical Analysis', 'Reporting'];
          } else if (titleLower.includes('engineer')) {
            suggestedSkills = ['Python', 'SQL', 'ETL', 'Spark', 'Hadoop', 'Cloud Platforms', 'Data Pipelines', 'Big Data'];
            suggestedExperienceMin = 3;
            suggestedExperienceMax = 7;
          } else {
            suggestedSkills = ['SQL', 'Python', 'Data Analysis', 'Data Modeling', 'ETL', 'Reporting', 'BI Tools', 'Problem Solving'];
          }
        }
        // DevOps roles
        else if (titleLower.includes('devops') || titleLower.includes('sre') || titleLower.includes('reliability')) {
          suggestedSkills = ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform', 'Scripting', 'Monitoring'];
          suggestedExperienceMin = 3;
          suggestedExperienceMax = 8;
        }
        // Product roles
        else if (titleLower.includes('product')) {
          if (titleLower.includes('manager')) {
            suggestedSkills = ['Product Strategy', 'Roadmapping', 'User Stories', 'Agile', 'Stakeholder Management', 'Market Research', 'Analytics', 'UX'];
            suggestedExperienceMin = 4;
            suggestedExperienceMax = 10;
          } else if (titleLower.includes('owner')) {
            suggestedSkills = ['Agile', 'Scrum', 'Backlog Management', 'User Stories', 'Roadmapping', 'Stakeholder Management', 'Jira', 'Requirements Gathering'];
            suggestedExperienceMin = 3;
            suggestedExperienceMax = 8;
          } else {
            suggestedSkills = ['Product Development', 'Agile', 'Roadmapping', 'User Research', 'Analytics', 'Stakeholder Management', 'Market Analysis', 'Communication'];
          }
        }
        // Designer roles
        else if (titleLower.includes('design') || titleLower.includes('ux') || titleLower.includes('ui')) {
          suggestedSkills = ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'User Testing', 'Visual Design'];
        }
        // Project management roles
        else if (titleLower.includes('project') || titleLower.includes('program') || (titleLower.includes('manager') && !titleLower.includes('product'))) {
          suggestedSkills = ['Project Planning', 'Agile', 'Scrum', 'Stakeholder Management', 'Risk Management', 'Budgeting', 'Team Leadership', 'MS Project'];
          suggestedExperienceMin = 3;
          suggestedExperienceMax = 10;
        }
        // Security roles
        else if (titleLower.includes('security') || titleLower.includes('cyber')) {
          suggestedSkills = ['Network Security', 'Cyber Security', 'Penetration Testing', 'Security Audits', 'SIEM', 'Risk Assessment', 'Compliance', 'Incident Response'];
          suggestedExperienceMin = 3;
          suggestedExperienceMax = 8;
        }
        // Cloud roles
        else if (titleLower.includes('cloud') || titleLower.includes('aws') || titleLower.includes('azure') || titleLower.includes('gcp')) {
          suggestedSkills = ['AWS', 'Azure', 'GCP', 'IaC', 'Terraform', 'Cloud Architecture', 'Containers', 'Serverless'];
          suggestedExperienceMin = 3;
          suggestedExperienceMax = 8;
        }
        // Default for other roles
        else {
          suggestedSkills = ['Communication', 'Problem Solving', 'Teamwork', 'Adaptability', 'Time Management', 'Collaboration', 'Technical Skills', 'Industry Knowledge'];
        }
        
        // Generate salary based on location and experience
        if (location) {
          const locationLower = location.toLowerCase();
          
          // Switzerland locations (higher salaries)
          if (locationLower.includes('suisse') || locationLower.includes('switzerland') || 
              locationLower.includes('genève') || locationLower.includes('geneva') || 
              locationLower.includes('zurich') || locationLower.includes('bern') || 
              locationLower.includes('basel') || locationLower.includes('lausanne')) {
            suggestedSalaryMin = 70000 + (suggestedExperienceMin * 5000);
            suggestedSalaryMax = 100000 + (suggestedExperienceMax * 7000);
            suggestedSalaryCurrency = "CHF";
          }
          // UK locations
          else if (locationLower.includes('uk') || locationLower.includes('united kingdom') || 
                  locationLower.includes('london') || locationLower.includes('londres') || 
                  locationLower.includes('manchester') || locationLower.includes('birmingham')) {
            suggestedSalaryMin = 35000 + (suggestedExperienceMin * 3000);
            suggestedSalaryMax = 50000 + (suggestedExperienceMax * 5000);
            suggestedSalaryCurrency = "GBP";
          }
          // France locations
          else if (locationLower.includes('france') || locationLower.includes('paris') || 
                  locationLower.includes('lyon') || locationLower.includes('marseille') || 
                  locationLower.includes('toulouse') || locationLower.includes('nice')) {
            suggestedSalaryMin = 35000 + (suggestedExperienceMin * 2000);
            suggestedSalaryMax = 45000 + (suggestedExperienceMax * 3000);
            suggestedSalaryCurrency = "EUR";
            
            // Paris has higher salaries
            if (locationLower.includes('paris')) {
              suggestedSalaryMin += 5000;
              suggestedSalaryMax += 10000;
            }
          }
          // USA locations (higher salaries)
          else if (locationLower.includes('usa') || locationLower.includes('united states') || 
                  locationLower.includes('us') || locationLower.includes('états-unis') || 
                  locationLower.includes('new york') || locationLower.includes('san francisco') || 
                  locationLower.includes('seattle') || locationLower.includes('boston')) {
            suggestedSalaryMin = 70000 + (suggestedExperienceMin * 5000);
            suggestedSalaryMax = 100000 + (suggestedExperienceMax * 10000);
            suggestedSalaryCurrency = "USD";
            
            // Adjust for tech hubs
            if (locationLower.includes('san francisco') || locationLower.includes('silicon valley') || 
                locationLower.includes('new york') || locationLower.includes('seattle')) {
              suggestedSalaryMin += 20000;
              suggestedSalaryMax += 50000;
            }
          }
          // Default to EUR with moderate salaries
          else {
            suggestedSalaryMin = 30000 + (suggestedExperienceMin * 2000);
            suggestedSalaryMax = 45000 + (suggestedExperienceMax * 2500);
            suggestedSalaryCurrency = "EUR";
          }
        }
        
        // Generate a default description
        suggestedDescription = `# ${title}\n\n`;
        if (location) {
          suggestedDescription += `## Localisation\n${location}\n\n`;
        }
        
        suggestedDescription += `## Description du poste\nNous recherchons un${title.match(/^[aeiouyéèêAEIOUYÉÈÊ]/i) ? "'" : " "}${title} `;
        suggestedDescription += `avec au moins ${suggestedExperienceMin} ans d'expérience `;
        suggestedDescription += `pour rejoindre notre équipe. `;
        suggestedDescription += `Vous travaillerez sur des projets passionnants dans un environnement `;
        suggestedDescription += `${suggestedRemotePreference === "Sur site" ? "collaboratif sur site" : 
                               suggestedRemotePreference === "Hybride" ? "flexible en mode hybride" : "entièrement en télétravail"}.\n\n`;
        
        suggestedDescription += "### Responsabilités\n";
        suggestedDescription += "- Concevoir et développer des solutions innovantes\n";
        suggestedDescription += "- Collaborer avec l'équipe pour atteindre les objectifs du projet\n";
        suggestedDescription += "- Participer aux réunions d'équipe et aux revues de code\n";
        suggestedDescription += "- Assurer la qualité et la maintenabilité du code\n";
        suggestedDescription += "- Résoudre les problèmes techniques et optimiser les performances\n\n";
        
        suggestedDescription += "### Compétences requises\n";
        suggestedDescription += suggestedSkills.map(skill => `- ${skill}`).join("\n") + "\n\n";
        
        suggestedDescription += "### Profil recherché\n";
        suggestedDescription += `- Formation : ${suggestedEducation}\n`;
        suggestedDescription += `- Expérience : ${suggestedExperienceMin} à ${suggestedExperienceMax} ans\n`;
        suggestedDescription += `- Type de contrat : ${suggestedContractType}\n`;
        suggestedDescription += `- Mode de travail : ${suggestedRemotePreference}\n\n`;
        
        suggestedDescription += "### Rémunération\n";
        suggestedDescription += `Salaire : ${suggestedSalaryMin.toLocaleString()} à ${suggestedSalaryMax.toLocaleString()} ${suggestedSalaryCurrency} par an\n`;
      }
      
      // Construct the suggestion object
      return {
        title: suggestedTitle,
        description: suggestedDescription,
        requiredSkills: suggestedSkills,
        education: suggestedEducation,
        experience: {
          min: suggestedExperienceMin,
          max: suggestedExperienceMax
        },
        contractType: suggestedContractType,
        remotePreference: suggestedRemotePreference,
        location: suggestedLocation,
        salary: {
          min: suggestedSalaryMin,
          max: suggestedSalaryMax,
          currency: suggestedSalaryCurrency
        }
      };
    } catch (error) {
      console.error("Error generating job offer suggestions:", error);
      throw error;
    }
  }
};
