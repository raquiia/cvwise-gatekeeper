
import { SUPABASE_API_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { CandidateData } from './resumeDataService';

/**
 * Interface pour les résultats de matching
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
  match_details: {
    skills_details: { 
      score: number;
      matchedSkills?: string[];
      missingSkills?: string[];
    };
    experience_details: { score: number };
    education_details: { score: number };
    location_details: { score: number };
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface pour les suggestions générées par l'IA
 */
export interface JobOfferSuggestion {
  description?: string;
  requiredSkills?: string[];
  jobTitle?: string;
  additionalInfo?: string;
}

/**
 * Service responsable de la gestion des matchings entre candidats et offres d'emploi
 */
export const candidateMatchingService = {
  /**
   * Calculer les scores de matching pour tous les candidats d'un utilisateur par rapport à une offre d'emploi
   */
  calculateMatchesForJobOffer: async (jobOfferId: string): Promise<string[]> => {
    try {
      console.log(`Calculating matches for job offer ID: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/calculate_all_candidates_job_matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error calculating matches: ${errorText}`);
      }

      const data = await response.json();
      
      // Cast data to string[] type
      const typedData = (data || []) as string[];
      
      console.log(`Calculated matches for ${typedData.length} candidates`);
      return typedData;
    } catch (error: any) {
      console.error("Exception in calculateMatchesForJobOffer:", error);
      throw new Error(error.message || "Impossible de calculer les correspondances");
    }
  },
  
  /**
   * Récupérer les résultats de matching pour un candidat et une offre d'emploi spécifiques
   */
  getCandidateJobMatch: async (candidateId: string, jobOfferId: string): Promise<CandidateJobMatch | null> => {
    try {
      console.log(`Fetching match between candidate ${candidateId} and job offer ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_candidate_job_match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_candidate_id: candidateId,
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching candidate-job match: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data) {
        console.log(`No match found between candidate ${candidateId} and job offer ${jobOfferId}`);
        return null;
      }
      
      // Cast data to CandidateJobMatch type
      const typedData = data as CandidateJobMatch;
      
      console.log("Match retrieved successfully:", typedData);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getCandidateJobMatch:", error);
      throw new Error(error.message || "Impossible de récupérer le matching");
    }
  },
  
  /**
   * Récupérer tous les matchs pour une offre d'emploi spécifique, avec détails des candidats
   */
  getMatchesForJobOffer: async (jobOfferId: string): Promise<{candidate: CandidateData; match: CandidateJobMatch}[]> => {
    try {
      console.log(`Fetching all matches for job offer: ${jobOfferId}`);
      
      // Use direct fetch for the API call
      const response = await fetch(`${SUPABASE_API_URL}/rest/v1/rpc/get_matches_for_job_offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_job_offer_id: jobOfferId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching matches for job offer: ${errorText}`);
      }

      const data = await response.json();
      
      // Si aucune donnée n'est retournée, renvoyer un tableau vide
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      // Cast data to expected type
      const typedData = data as {candidate: CandidateData; match: CandidateJobMatch}[];
      
      // Trier par score de matching (du plus élevé au plus bas)
      typedData.sort((a, b) => b.match.match_score - a.match.match_score);
      
      console.log(`Retrieved ${typedData.length} matches for job offer ${jobOfferId}`);
      return typedData;
    } catch (error: any) {
      console.error("Exception in getMatchesForJobOffer:", error);
      throw new Error(error.message || "Impossible de récupérer les matchings");
    }
  },
  
  /**
   * Récupérer les meilleurs candidats pour une offre d'emploi spécifique
   */
  getTopCandidatesForJobOffer: async (jobOfferId: string, limit: number = 10): Promise<{candidate: CandidateData; match: CandidateJobMatch}[]> => {
    try {
      const allMatches = await candidateMatchingService.getMatchesForJobOffer(jobOfferId);
      return allMatches.slice(0, limit);
    } catch (error: any) {
      console.error("Exception in getTopCandidatesForJobOffer:", error);
      throw new Error(error.message || "Impossible de récupérer les meilleurs candidats");
    }
  },

  /**
   * Générer des suggestions pour une offre d'emploi à partir du titre de poste
   */
  generateJobOfferSuggestions: async (jobTitle: string): Promise<JobOfferSuggestion> => {
    try {
      console.log(`Generating suggestions for job title: ${jobTitle}`);
      
      // Simuler un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Suggestions par défaut pour des postes communs
      const defaultSuggestions: Record<string, JobOfferSuggestion> = {
        "Développeur Frontend": {
          description: `Nous recherchons un développeur Frontend talentueux pour rejoindre notre équipe. Vous serez responsable de la conception et de l'implémentation d'interfaces utilisateur réactives et intuitives pour nos applications web. Vous travaillerez en étroite collaboration avec notre équipe de design et nos développeurs backend pour créer des expériences utilisateur exceptionnelles.

Responsabilités:
- Développer des interfaces utilisateur réactives et intuitives
- Collaborer avec les designers pour implémenter fidèlement les maquettes
- Optimiser les applications pour une performance maximale sur différents navigateurs et appareils
- Assurer la maintenance et l'amélioration continue des interfaces existantes
- Participer aux revues de code et aux sessions de brainstorming`,
          requiredSkills: ["JavaScript", "HTML5", "CSS3", "React", "TypeScript", "Git", "Responsive Design", "Testing (Jest, RTL)"]
        },
        "Développeur Backend": {
          description: `Nous recherchons un développeur Backend expérimenté pour rejoindre notre équipe technique. Vous serez responsable de la conception, du développement et de la maintenance des composants serveur de nos applications. Vous travaillerez en étroite collaboration avec l'équipe frontend pour assurer une intégration fluide des fonctionnalités.

Responsabilités:
- Concevoir et développer des API RESTful performantes et sécurisées
- Implémenter des modèles de données et optimiser les requêtes de base de données
- Assurer la sécurité, la fiabilité et la scalabilité de nos services
- Participer à l'architecture technique et aux choix technologiques
- Mettre en place des tests automatisés pour garantir la qualité du code`,
          requiredSkills: ["Node.js", "Express", "PostgreSQL", "MongoDB", "Docker", "API REST", "Git", "Testing", "Sécurité des applications"]
        },
        "Data Scientist": {
          description: `Nous recherchons un Data Scientist passionné pour rejoindre notre équipe d'analyse de données. Vous serez responsable de l'analyse et de l'interprétation de grands ensembles de données pour extraire des insights précieux et guider les décisions stratégiques de l'entreprise.

Responsabilités:
- Collecter, nettoyer et prétraiter de grands ensembles de données
- Développer des modèles prédictifs et des algorithmes d'apprentissage automatique
- Analyser les données pour identifier des tendances et des opportunités
- Présenter les résultats d'analyse aux parties prenantes de manière claire et concise
- Collaborer avec les équipes produit pour intégrer des solutions basées sur les données`,
          requiredSkills: ["Python", "R", "SQL", "Machine Learning", "Statistiques", "Data Visualization", "TensorFlow/PyTorch", "Jupyter Notebooks"]
        },
        "Chef de Projet IT": {
          description: `Nous recherchons un Chef de Projet IT expérimenté pour gérer nos projets technologiques stratégiques. Vous serez responsable de la planification, de l'exécution et de la livraison des projets dans les délais et le budget impartis, tout en assurant la satisfaction des parties prenantes.

Responsabilités:
- Définir le périmètre, les objectifs et les livrables des projets
- Élaborer des plannings détaillés et gérer les ressources efficacement
- Coordonner les équipes techniques et fonctionnelles
- Identifier et gérer les risques liés aux projets
- Assurer une communication régulière avec les parties prenantes`,
          requiredSkills: ["Gestion de projet", "Méthodologies Agile (Scrum)", "MS Project", "Jira", "Budgétisation", "Analyse des risques", "Communication", "Connaissance technique IT"]
        }
      };
      
      // Chercher une correspondance dans les suggestions par défaut
      const suggestion = defaultSuggestions[jobTitle];
      
      // Si aucune correspondance exacte n'est trouvée, renvoyer des suggestions génériques
      if (!suggestion) {
        return {
          description: `Nous recherchons un(e) ${jobTitle} talentueux(se) pour rejoindre notre équipe. Le/la candidat(e) idéal(e) possède une solide expérience dans le domaine et est passionné(e) par l'innovation et l'excellence.

Responsabilités:
- Contribuer activement aux projets de l'entreprise
- Collaborer efficacement avec les différentes équipes
- Proposer des solutions innovantes face aux défis rencontrés
- Assurer une veille technologique et méthodologique
- Participer à l'amélioration continue des processus`,
          requiredSkills: ["Communication", "Travail d'équipe", "Résolution de problèmes", "Adaptabilité", "Organisation"]
        };
      }
      
      return suggestion;
    } catch (error: any) {
      console.error("Exception in generateJobOfferSuggestions:", error);
      throw new Error(error.message || "Impossible de générer des suggestions");
    }
  }
};
