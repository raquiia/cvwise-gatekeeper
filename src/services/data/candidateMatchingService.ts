// Import the necessary libraries and services
import { JobOffer } from "./jobOfferService";
import { jobOfferService } from "./jobOfferService";
import type { CandidateData } from "./resumeDataService";

/**
 * Interface for JobOfferSuggestion
 */
export interface JobOfferSuggestion extends Partial<JobOffer> {
  description?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  education?: string;
  experience?: {
    min?: number;
    max?: number;
  };
  contractType?: string;
  remotePreference?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  benefits?: string[];
  industrySectors?: string[];
}

/**
 * Interface for CandidateJobMatch
 */
export interface CandidateJobMatch {
  id: string;
  candidate_id: string;
  job_offer_id: string;
  match_score: number;
  skills_match_score: number;
  experience_match_score: number;
  education_match_score: number;
  location_match_score: number;
  match_details?: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for CandidateMatch (combination of candidate and match data)
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
    // Implementation would be here
    console.log(`Calculating matches for job offer: ${jobOfferId}`);
    // Mock implementation for now
    return true;
  },

  /**
   * Get match details between a candidate and job offer
   */
  getCandidateJobMatch: async (candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> => {
    console.log(`Getting match between candidate ${candidateId} and job offer ${jobOfferId}`);
    // Mock implementation for now
    return null;
  },

  /**
   * Get all candidate matches for a job offer
   */
  getMatchesForJobOffer: async (jobOfferId: string): Promise<CandidateMatch[]> => {
    console.log(`Getting all candidate matches for job offer: ${jobOfferId}`);
    // Mock implementation for now
    return [];
  },

  /**
   * Get top candidates for a job offer
   */
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 5): Promise<CandidateMatch[]> => {
    console.log(`Getting top ${limit} candidates for job offer: ${jobOfferId}`);
    // Mock implementation for now
    return [];
  },

  /**
   * Generate job offer suggestions based on title and location
   */
  generateJobOfferSuggestions: async (title: string, location?: string): Promise<JobOfferSuggestion> => {
    console.log(`Generating job offer suggestions for: ${title} in ${location || 'unspecified location'}`);
    
    let country = 'France'; // Default country
    let currency = 'EUR';   // Default currency
    
    // Determine country and currency based on location
    if (location) {
      country = jobOfferService.getCountryFromLocation(location);
      currency = jobOfferService.getCurrencyFromCountry(country);
    }
    
    // Default salary ranges by country/currency
    const salarySuggestions: Record<string, { min: number, max: number }> = {
      'EUR': { min: 45000, max: 65000 },
      'CHF': { min: 90000, max: 120000 },
      'GBP': { min: 40000, max: 60000 },
      'USD': { min: 70000, max: 110000 }
    };
    
    // Career level adjectives to detect in the title
    const juniorKeywords = ['junior', 'débutant', 'assistant', 'stagiaire'];
    const seniorKeywords = ['senior', 'expert', 'lead', 'principal', 'chef', 'responsable', 'manager', 'directeur'];
    
    // Adjust salary based on career level suggested in the title
    let salaryMultiplier = 1;
    const titleLower = title.toLowerCase();
    
    if (juniorKeywords.some(word => titleLower.includes(word))) {
      salaryMultiplier = 0.8; // 20% lower for junior positions
    } else if (seniorKeywords.some(word => titleLower.includes(word))) {
      salaryMultiplier = 1.3; // 30% higher for senior positions
    }
    
    // Apply the multiplier to the salary range
    const baseSalary = salarySuggestions[currency] || salarySuggestions['EUR'];
    const salaryMin = Math.round(baseSalary.min * salaryMultiplier);
    const salaryMax = Math.round(baseSalary.max * salaryMultiplier);
    
    // Generate skills and other suggestions based on job title
    const suggestions = generateSuggestionsBasedOnJobTitle(title);
    
    // Combine everything into the job offer suggestion
    return {
      title: title,
      description: suggestions.description,
      requiredSkills: suggestions.requiredSkills,
      preferredSkills: suggestions.preferredSkills,
      experience: {
        min: suggestions.experienceYearsMin,
        max: suggestions.experienceYearsMax
      },
      education: suggestions.educationLevel,
      salary: {
        min: salaryMin,
        max: salaryMax,
        currency: currency
      },
      contractType: suggestions.contractType,
      remotePreference: suggestions.remotePreference,
      benefits: suggestions.benefits,
      industrySectors: suggestions.industrySectors
    };
  }
};

/**
 * Helper function to generate suggestions based on job title
 */
function generateSuggestionsBasedOnJobTitle(title: string): any {
  const titleLower = title.toLowerCase();
  
  // Base template
  const baseSuggestion = {
    description: `Nous recherchons un(e) ${title} talentueux(se) pour rejoindre notre équipe.`,
    requiredSkills: [],
    preferredSkills: [],
    experienceYearsMin: 2,
    experienceYearsMax: 5,
    educationLevel: "Bac+5",
    contractType: "CDI",
    remotePreference: "Hybride",
    benefits: ["Tickets restaurant", "Mutuelle d'entreprise", "RTT"],
    industrySectors: ["Conseil"]
  };

  // Developer/Engineer roles
  if (titleLower.includes('développeur') || titleLower.includes('developpeur') || 
      titleLower.includes('developer') || titleLower.includes('ingénieur') || 
      titleLower.includes('ingenieur') || titleLower.includes('engineer')) {
    
    baseSuggestion.description = `Nous recherchons un(e) ${title} talentueux(se) pour concevoir, développer et maintenir des applications innovantes. Le/la candidat(e) idéal(e) devra avoir une solide expérience en développement logiciel, une bonne compréhension des principes de conception et être à l'aise pour travailler en équipe dans un environnement agile.`;
    
    // Add general development skills
    baseSuggestion.requiredSkills = [
      { name: "Algorithmes et structures de données", level: "Confirmé" },
      { name: "Git", level: "Confirmé" },
      { name: "Tests unitaires", level: "Intermédiaire" },
      { name: "Méthodologies Agile/Scrum", level: "Intermédiaire" }
    ];
    
    baseSuggestion.preferredSkills = [
      { name: "DevOps", level: "Notions" },
      { name: "Architecture logicielle", level: "Intermédiaire" }
    ];
    
    // Frontend developer
    if (titleLower.includes('front') || titleLower.includes('web') || titleLower.includes('ui')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} talentueux(se) pour concevoir et développer des interfaces utilisateur modernes et réactives. Le/la candidat(e) idéal(e) possède une solide expérience en développement frontend, maîtrise HTML, CSS et JavaScript, et a travaillé avec des frameworks modernes comme React ou Vue.js.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "HTML5", level: "Confirmé" },
        { name: "CSS3/SASS", level: "Confirmé" },
        { name: "JavaScript", level: "Confirmé" },
        { name: "React", level: "Confirmé" },
        { name: "Responsive Design", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "TypeScript", level: "Intermédiaire" },
        { name: "Redux", level: "Intermédiaire" },
        { name: "Next.js", level: "Intermédiaire" },
        { name: "UX/UI Design", level: "Notions" },
        { name: "Jest", level: "Intermédiaire" }
      );
    }
    
    // Backend developer
    if (titleLower.includes('back') || titleLower.includes('api') || titleLower.includes('server')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour concevoir, développer et maintenir nos systèmes backend et APIs. Le/la candidat(e) idéal(e) doit avoir une solide expérience dans le développement de services backend performants, sécurisés et évolutifs.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Conception d'API RESTful", level: "Confirmé" },
        { name: "SQL", level: "Confirmé" },
        { name: "Node.js", level: "Confirmé" },
        { name: "Express.js", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "MongoDB", level: "Intermédiaire" },
        { name: "GraphQL", level: "Intermédiaire" },
        { name: "Docker", level: "Intermédiaire" },
        { name: "Microservices", level: "Intermédiaire" },
        { name: "AWS/Azure/GCP", level: "Intermédiaire" }
      );
    }
    
    // Fullstack developer
    if (titleLower.includes('full') || titleLower.includes('stack')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} polyvalent(e) capable de travailler à la fois sur le frontend et le backend de nos applications. Le/la candidat(e) idéal(e) doit avoir une solide expérience dans le développement web complet, avec la capacité de passer d'une couche à l'autre de l'application en fonction des besoins du projet.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "HTML5/CSS3", level: "Confirmé" },
        { name: "JavaScript", level: "Confirmé" },
        { name: "React ou Angular", level: "Confirmé" },
        { name: "Node.js", level: "Confirmé" },
        { name: "SQL", level: "Confirmé" },
        { name: "Conception d'API RESTful", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "TypeScript", level: "Intermédiaire" },
        { name: "MongoDB", level: "Intermédiaire" },
        { name: "Docker", level: "Intermédiaire" },
        { name: "CI/CD", level: "Intermédiaire" },
        { name: "AWS/Azure/GCP", level: "Intermédiaire" }
      );
    }
    
    // Java developer
    if (titleLower.includes('java') && !titleLower.includes('javascript')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour concevoir, développer et maintenir nos applications Java. Le/la candidat(e) idéal(e) doit avoir une solide connaissance de l'écosystème Java et de ses frameworks, ainsi qu'une bonne compréhension des principes de conception orientée objet.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Java SE", level: "Confirmé" },
        { name: "Spring Boot", level: "Confirmé" },
        { name: "Hibernate/JPA", level: "Confirmé" },
        { name: "SQL", level: "Confirmé" },
        { name: "Maven/Gradle", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "Microservices", level: "Intermédiaire" },
        { name: "Docker", level: "Intermédiaire" },
        { name: "Kubernetes", level: "Notions" },
        { name: "JUnit", level: "Intermédiaire" },
        { name: "CI/CD", level: "Intermédiaire" }
      );
    }
    
    // .NET developer
    if (titleLower.includes('.net') || titleLower.includes('c#') || titleLower.includes('asp.net')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour concevoir, développer et maintenir nos applications .NET. Le/la candidat(e) idéal(e) doit avoir une solide expérience avec l'écosystème Microsoft et une bonne compréhension des principes de conception orientée objet.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "C#", level: "Confirmé" },
        { name: "ASP.NET Core", level: "Confirmé" },
        { name: "Entity Framework", level: "Confirmé" },
        { name: "SQL Server", level: "Confirmé" },
        { name: "LINQ", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "Azure", level: "Intermédiaire" },
        { name: "Microservices", level: "Intermédiaire" },
        { name: "Docker", level: "Intermédiaire" },
        { name: "Xamarin/MAUI", level: "Notions" },
        { name: "CI/CD", level: "Intermédiaire" }
      );
    }
    
    // Python developer
    if (titleLower.includes('python') || titleLower.includes('django') || titleLower.includes('flask')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour développer et maintenir nos applications Python. Le/la candidat(e) idéal(e) doit avoir une solide expérience en développement Python et une bonne connaissance des frameworks comme Django ou Flask.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Python", level: "Confirmé" },
        { name: "Django/Flask", level: "Confirmé" },
        { name: "SQL", level: "Confirmé" },
        { name: "API RESTful", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "Docker", level: "Intermédiaire" },
        { name: "Pandas/NumPy", level: "Intermédiaire" },
        { name: "Pytest", level: "Intermédiaire" },
        { name: "CI/CD", level: "Intermédiaire" },
        { name: "AWS/Azure/GCP", level: "Intermédiaire" }
      );
    }
  }
  
  // Data roles (Data Scientist, Data Analyst, etc.)
  else if (titleLower.includes('data')) {
    baseSuggestion.description = `Nous recherchons un(e) ${title} talentueux(se) pour rejoindre notre équipe. Le/la candidat(e) idéal(e) aura une solide compréhension des méthodes d'analyse de données et des technologies associées, avec la capacité de traduire des données complexes en insights actionnables.`;
    
    // Common data skills
    baseSuggestion.requiredSkills = [
      { name: "SQL", level: "Confirmé" },
      { name: "Excel avancé", level: "Confirmé" },
      { name: "Visualisation de données", level: "Confirmé" }
    ];
    
    // Data Scientist
    if (titleLower.includes('scientist') || titleLower.includes('machine learning') || 
        titleLower.includes('ml') || titleLower.includes('ai')) {
      
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour développer des modèles d'apprentissage automatique et d'intelligence artificielle innovants. Le/la candidat(e) idéal(e) possède une solide formation en statistiques, mathématiques et informatique, avec une expérience pratique dans le développement et le déploiement de modèles de machine learning.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Python", level: "Confirmé" },
        { name: "Scikit-learn", level: "Confirmé" },
        { name: "TensorFlow/PyTorch", level: "Confirmé" },
        { name: "Pandas/NumPy", level: "Confirmé" },
        { name: "Machine Learning", level: "Confirmé" },
        { name: "Statistiques", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "Deep Learning", level: "Intermédiaire" },
        { name: "NLP", level: "Intermédiaire" },
        { name: "Computer Vision", level: "Notions" },
        { name: "MLOps", level: "Intermédiaire" },
        { name: "Big Data (Spark)", level: "Intermédiaire" }
      );
      
      baseSuggestion.educationLevel = "Bac+5/Doctorat";
    }
    
    // Data Analyst
    else if (titleLower.includes('analyst') || titleLower.includes('analyste')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour analyser et interpréter des ensembles de données complexes afin d'en extraire des insights pertinents pour l'entreprise. Le/la candidat(e) idéal(e) possède de solides compétences analytiques, une maîtrise des outils d'analyse de données et d'excellentes capacités de communication.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Python/R", level: "Intermédiaire" },
        { name: "Tableau/Power BI", level: "Confirmé" },
        { name: "Analyse statistique", level: "Confirmé" },
        { name: "Reporting", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "ETL", level: "Notions" },
        { name: "A/B Testing", level: "Intermédiaire" },
        { name: "Google Analytics", level: "Intermédiaire" }
      );
    }
    
    // Data Engineer
    else if (titleLower.includes('engineer') || titleLower.includes('ingénieur') || 
             titleLower.includes('ingenieur')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour concevoir, construire et maintenir nos infrastructures de données. Le/la candidat(e) idéal(e) possède une solide expérience dans la création de pipelines de données robustes, évolutifs et efficaces, avec une bonne compréhension des technologies big data.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Python", level: "Confirmé" },
        { name: "ETL/ELT", level: "Confirmé" },
        { name: "Big Data (Hadoop, Spark)", level: "Confirmé" },
        { name: "Data Warehousing", level: "Confirmé" },
        { name: "Cloud (AWS/Azure/GCP)", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "Kafka/RabbitMQ", level: "Intermédiaire" },
        { name: "Airflow", level: "Intermédiaire" },
        { name: "Docker/Kubernetes", level: "Intermédiaire" },
        { name: "NoSQL", level: "Intermédiaire" }
      );
    }
  }
  
  // Project Manager / Product Owner
  else if (titleLower.includes('project manager') || titleLower.includes('chef de projet') || 
           titleLower.includes('product owner') || titleLower.includes('scrum master')) {
    
    if (titleLower.includes('product owner')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour gérer le backlog produit et assurer la liaison entre les parties prenantes et l'équipe de développement. Le/la candidat(e) idéal(e) doit avoir une solide expérience en gestion de produits agiles, avec d'excellentes compétences en communication et une bonne compréhension technique.`;
      
      baseSuggestion.requiredSkills = [
        { name: "Méthodologies Agile/Scrum", level: "Confirmé" },
        { name: "Gestion de backlog", level: "Confirmé" },
        { name: "User Stories", level: "Confirmé" },
        { name: "Jira", level: "Confirmé" },
        { name: "Communication", level: "Confirmé" }
      ];
      
      baseSuggestion.preferredSkills = [
        { name: "Certification Scrum Product Owner", level: "Confirmé" },
        { name: "UX/UI", level: "Intermédiaire" },
        { name: "Analyse de données", level: "Intermédiaire" },
        { name: "Présentation", level: "Confirmé" },
        { name: "Connaissances techniques", level: "Intermédiaire" }
      ];
    } else if (titleLower.includes('scrum master')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour faciliter les processus Agile/Scrum au sein de nos équipes de développement. Le/la candidat(e) idéal(e) doit avoir une solide connaissance des méthodologies agiles, d'excellentes compétences en facilitation et la capacité d'aider l'équipe à s'améliorer continuellement.`;
      
      baseSuggestion.requiredSkills = [
        { name: "Méthodologies Agile/Scrum", level: "Confirmé" },
        { name: "Facilitation d'équipe", level: "Confirmé" },
        { name: "Résolution de problèmes", level: "Confirmé" },
        { name: "Jira", level: "Confirmé" },
        { name: "Communication", level: "Confirmé" }
      ];
      
      baseSuggestion.preferredSkills = [
        { name: "Certification Scrum Master", level: "Confirmé" },
        { name: "Kanban", level: "Intermédiaire" },
        { name: "Coaching", level: "Intermédiaire" },
        { name: "Connaissances techniques", level: "Intermédiaire" }
      ];
    } else {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour diriger et coordonner nos projets de bout en bout. Le/la candidat(e) idéal(e) possède une solide expérience en gestion de projet, d'excellentes compétences en communication et en coordination, et la capacité de mener des projets à bien dans les délais et le budget impartis.`;
      
      baseSuggestion.requiredSkills = [
        { name: "Méthodologies de gestion de projet", level: "Confirmé" },
        { name: "MS Project/Jira/Trello", level: "Confirmé" },
        { name: "Gestion des parties prenantes", level: "Confirmé" },
        { name: "Planification et budgétisation", level: "Confirmé" },
        { name: "Communication", level: "Confirmé" }
      ];
      
      baseSuggestion.preferredSkills = [
        { name: "Certification PMP/Prince2", level: "Intermédiaire" },
        { name: "Méthodologies Agile/Scrum", level: "Intermédiaire" },
        { name: "Gestion des risques", level: "Intermédiaire" },
        { name: "Présentation", level: "Confirmé" },
        { name: "Connaissances techniques", level: "Intermédiaire" }
      ];
    }
    
    baseSuggestion.experienceYearsMin = 3;
    baseSuggestion.experienceYearsMax = 8;
  }
  
  // Consultant
  else if (titleLower.includes('consultant')) {
    baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour accompagner nos clients dans leurs projets de transformation. Le/la candidat(e) idéal(e) possède une solide expertise dans son domaine, d'excellentes compétences en communication et en résolution de problèmes, ainsi que la capacité de travailler efficacement avec les clients.`;
    
    baseSuggestion.requiredSkills = [
      { name: "Analyse de besoins", level: "Confirmé" },
      { name: "Résolution de problèmes", level: "Confirmé" },
      { name: "Communication", level: "Confirmé" },
      { name: "Présentation", level: "Confirmé" },
      { name: "Microsoft Office", level: "Confirmé" }
    ];
    
    baseSuggestion.preferredSkills = [
      { name: "Gestion de projet", level: "Intermédiaire" },
      { name: "Méthodologies Agile", level: "Intermédiaire" },
      { name: "Analyse de données", level: "Intermédiaire" }
    ];
    
    baseSuggestion.experienceYearsMin = 3;
    baseSuggestion.experienceYearsMax = 8;
    
    // Management consultant
    if (titleLower.includes('management')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour accompagner nos clients dans l'amélioration de leurs performances organisationnelles et opérationnelles. Le/la candidat(e) idéal(e) possède une solide expertise en stratégie d'entreprise, en optimisation des processus et en gestion du changement.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Stratégie d'entreprise", level: "Confirmé" },
        { name: "Optimisation des processus", level: "Confirmé" },
        { name: "Gestion du changement", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "Lean/Six Sigma", level: "Intermédiaire" },
        { name: "Business Analysis", level: "Confirmé" },
        { name: "Modélisation financière", level: "Intermédiaire" }
      );
    }
    
    // IT consultant
    if (titleLower.includes('it') || titleLower.includes('système') || titleLower.includes('technologie')) {
      baseSuggestion.description = `Nous recherchons un(e) ${title} expérimenté(e) pour accompagner nos clients dans leurs projets de transformation digitale et d'optimisation des systèmes d'information. Le/la candidat(e) idéal(e) possède une solide expertise technique et une bonne compréhension des enjeux business.`;
      
      baseSuggestion.requiredSkills.push(
        { name: "Architecture IT", level: "Confirmé" },
        { name: "Analyse de systèmes", level: "Confirmé" },
        { name: "Cloud (AWS/Azure/GCP)", level: "Confirmé" }
      );
      
      baseSuggestion.preferredSkills.push(
        { name: "DevOps", level: "Intermédiaire" },
        { name: "Cybersécurité", level: "Intermédiaire" },
        { name: "ITIL", level: "Intermédiaire" }
      );
    }
  }
  
  // If no specific role was matched, keep the default template
  
  // Set more appropriate experience years for senior roles
  if (title.toLowerCase().includes('senior') || title.toLowerCase().includes('lead') || 
      title.toLowerCase().includes('principal') || title.toLowerCase().includes('manager')) {
    baseSuggestion.experienceYearsMin = 5;
    baseSuggestion.experienceYearsMax = 10;
  }
  
  // Set more appropriate experience years for junior roles
  if (title.toLowerCase().includes('junior') || title.toLowerCase().includes('assistant') || 
      title.toLowerCase().includes('débutant')) {
    baseSuggestion.experienceYearsMin = 0;
    baseSuggestion.experienceYearsMax = 2;
  }
  
  return baseSuggestion;
}
