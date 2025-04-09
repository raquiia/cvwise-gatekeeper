
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
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  experience?: {
    min?: number;
    max?: number;
  };
  education?: string;
  contractType?: string;
  remotePreference?: string;
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
      
      // Simuler un délai de traitement pour créer l'effet d'une analyse IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Base de données de suggestions enrichies pour différents postes
      const detailedSuggestions: Record<string, JobOfferSuggestion> = {
        "Développeur Frontend": {
          description: `## À propos du poste
          
Nous recherchons un Développeur Frontend expérimenté pour rejoindre notre équipe technique. Dans ce rôle clé, vous serez responsable de transformer des maquettes en interfaces utilisateurs dynamiques et performantes, tout en collaborant étroitement avec nos designers et développeurs backend.

## Responsabilités
- Développer des interfaces utilisateurs réactives, accessibles et cross-browser selon les standards modernes du web
- Implémenter et maintenir des composants UI réutilisables et maintenables
- Optimiser les applications pour des performances optimales et une expérience utilisateur fluide
- Participer activement aux revues de code et à l'amélioration continue des processus de développement
- Collaborer avec l'équipe UX/UI pour traduire fidèlement les maquettes en code
- Résoudre les problèmes techniques complexes et proposer des solutions innovantes
- Assurer la qualité du code par des tests automatisés
- Participer à l'évolution de l'architecture frontend de nos applications

## Environnement de travail
Vous rejoindrez une équipe agile et pluridisciplinaire, où l'autonomie et la créativité sont encouragées. Nous valorisons la qualité du code, les bonnes pratiques et l'amélioration continue.`,
          requiredSkills: [
            // Hard skills techniques
            "JavaScript", "TypeScript", "React", "Redux", "HTML5", "CSS3", "SCSS/SASS", 
            "Webpack", "Responsive Design", "RESTful API", "GraphQL", "Jest", "React Testing Library",
            "Next.js", "Tailwind CSS", "Storybook", "Git", "CI/CD", "Performance Optimization",
            
            // Outils spécifiques
            "VSCode", "Chrome DevTools", "Figma", "NPM/Yarn", "ESLint", "Prettier",
            
            // Méthodologies
            "Agile/Scrum", "TDD", "BEM", "Atomic Design"
          ],
          education: "Bac+3 à Bac+5 en Informatique ou équivalent",
          experience: {
            min: 2,
            max: 5
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 45000,
            max: 65000,
            currency: "EUR"
          }
        },
        
        "Développeur Backend": {
          description: `## À propos du poste
          
Nous recherchons un Développeur Backend chevronné pour concevoir, développer et maintenir les services et APIs qui alimentent nos applications. Vous jouerez un rôle essentiel dans la création d'architectures robustes, scalables et sécurisées.

## Responsabilités
- Concevoir et développer des APIs RESTful et des microservices performants
- Implémenter et optimiser les modèles de données et les requêtes pour nos bases de données
- Assurer la sécurité, la scalabilité et la haute disponibilité de nos services
- Collaborer avec les équipes frontend pour définir les contrats d'API et garantir une intégration fluide
- Mettre en place des processus de CI/CD et des tests automatisés
- Participer à la résolution des incidents de production et à l'amélioration continue de nos systèmes
- Contribuer à l'évolution de l'architecture technique de nos applications
- Documenter les APIs et les processus techniques

## Environnement de travail
Vous intégrerez une équipe technique passionnée, travaillant sur des problématiques variées et stimulantes. Nous privilégions l'apprentissage continu et l'innovation technologique dans un cadre collaboratif.`,
          requiredSkills: [
            // Hard skills techniques
            "Java", "Spring Boot", "Node.js", "Express", "Python", "Django/Flask", "C#", ".NET Core",
            "SQL", "PostgreSQL", "MongoDB", "Redis", "RabbitMQ", "Kafka", "Docker", "Kubernetes",
            "AWS/Azure/GCP", "Microservices", "RESTful API", "GraphQL", "OAuth/JWT", "JUnit", "Mocha",
            
            // Outils spécifiques
            "Git", "Jenkins", "Terraform", "Swagger/OpenAPI", "Postman", "ELK Stack", "Prometheus", "Grafana",
            
            // Méthodologies
            "Agile/Scrum", "TDD", "DDD", "Clean Architecture", "DevOps"
          ],
          education: "Bac+5 en Informatique ou équivalent",
          experience: {
            min: 3,
            max: 8
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 50000,
            max: 80000,
            currency: "EUR"
          }
        },
        
        "Data Scientist": {
          description: `## À propos du poste
          
Nous recherchons un Data Scientist expérimenté pour rejoindre notre équipe d'analyse de données. Vous serez chargé d'extraire des insights précieux de nos données et de développer des algorithmes d'apprentissage automatique pour résoudre des problèmes métier complexes.

## Responsabilités
- Collecter, nettoyer et transformer des ensembles de données complexes et volumineux
- Concevoir et implémenter des modèles prédictifs et des algorithmes d'apprentissage automatique
- Collaborer avec les équipes produit et métier pour traduire leurs besoins en modèles analytiques
- Développer des visualisations de données pertinentes pour communiquer efficacement les résultats
- Mettre en production des modèles ML robustes et évolutifs
- Réaliser des analyses statistiques avancées pour identifier des tendances et des opportunités
- Rester à jour sur les dernières avancées en matière de science des données et d'IA
- Participer à la définition de la stratégie data de l'entreprise

## Environnement de travail
Vous rejoindrez une équipe pluridisciplinaire travaillant sur des projets variés à fort impact. Nous valorisons l'innovation, la rigueur scientifique et l'approche collaborative pour résoudre des problèmes complexes.`,
          requiredSkills: [
            // Hard skills techniques
            "Python", "R", "SQL", "Pandas", "NumPy", "SciPy", "Scikit-learn", "TensorFlow", "PyTorch",
            "Keras", "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Time Series Analysis",
            "A/B Testing", "Statistiques", "Regression Analysis", "Clustering", "Big Data", "Spark",
            
            // Outils spécifiques
            "Jupyter Notebooks", "Git", "Docker", "AWS SageMaker", "Google Colab", "Tableau", "Power BI",
            "Hadoop", "Airflow", "MLflow", "DVC",
            
            // Méthodologies
            "CRISP-DM", "Agile", "MLOps"
          ],
          education: "Bac+5 ou Doctorat en Data Science, Statistiques, Mathématiques appliquées ou domaine similaire",
          experience: {
            min: 3,
            max: 8
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 55000,
            max: 85000,
            currency: "EUR"
          }
        },
        
        "Chef de Projet IT": {
          description: `## À propos du poste
          
Nous recherchons un Chef de Projet IT expérimenté pour piloter nos projets technologiques stratégiques. Vous serez responsable de la planification, de l'exécution et de la livraison de projets complexes, en garantissant le respect des délais, du budget et des exigences de qualité.

## Responsabilités
- Définir et planifier les projets IT en collaboration avec les parties prenantes métier et techniques
- Constituer et coordonner les équipes projets pluridisciplinaires
- Élaborer et suivre les plannings, les budgets et les ressources allouées
- Identifier et gérer les risques projet de manière proactive
- Assurer une communication efficace et transparente avec toutes les parties prenantes
- Mettre en place et suivre des indicateurs de performance des projets
- Animer les réunions d'avancement et les comités de pilotage
- Gérer les changements de périmètre et leurs impacts sur les projets
- Assurer la documentation et le transfert de connaissances

## Environnement de travail
Vous évoluerez dans un environnement dynamique où vous piloterez simultanément plusieurs projets stratégiques. Votre capacité à fédérer des équipes pluridisciplinaires et à communiquer efficacement sera essentielle pour réussir dans ce poste.`,
          requiredSkills: [
            // Hard skills techniques
            "Gestion de projet IT", "MS Project", "Jira", "Confluence", "Trello", "Gestion budgétaire", 
            "Analyse fonctionnelle", "Cahier des charges", "Planification", "Gestion des risques",
            "Reporting", "KPIs", "Méthodologies de test", "Recette", "Management d'équipe",
            
            // Méthodologies
            "Agile/Scrum", "Prince2", "PMI/PMP", "ITIL", "Lean", "SAFe", "Cycle en V",
            
            // Outils spécifiques
            "MS Office", "PowerPoint", "Excel avancé", "Gantt", "Monday", "ClickUp", "Asana"
          ],
          education: "Bac+5 en Informatique, Management de projet ou équivalent",
          experience: {
            min: 5,
            max: 10
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 60000,
            max: 90000,
            currency: "EUR"
          }
        },
        
        "Product Owner": {
          description: `## À propos du poste
          
Nous recherchons un Product Owner passionné pour définir et faire évoluer notre vision produit. Vous serez le pont entre les besoins métier et les équipes techniques, en charge de maximiser la valeur de nos produits numériques.

## Responsabilités
- Définir et prioriser le backlog produit en fonction de la valeur métier et des retours utilisateurs
- Rédiger des user stories claires et détaillées pour les équipes de développement
- Collaborer étroitement avec les parties prenantes pour comprendre leurs besoins et attentes
- Participer activement aux cérémonies agiles (planification, revue, rétrospective)
- Valider les développements livrés et s'assurer qu'ils répondent aux critères d'acceptation
- Analyser les métriques produit et les retours utilisateurs pour identifier les axes d'amélioration
- Participer à l'élaboration de la roadmap produit et de la stratégie à moyen/long terme
- Communiquer efficacement sur l'avancement du produit et ses évolutions

## Environnement de travail
Vous rejoindrez une organisation orientée produit où vous aurez un impact direct sur l'évolution de nos solutions. Votre capacité à comprendre les enjeux métier et à les traduire en fonctionnalités techniques sera déterminante pour réussir dans ce rôle.`,
          requiredSkills: [
            // Hard skills techniques
            "Gestion de backlog", "User stories", "Priorisation", "Jira", "Confluence", "Aha!", "ProductBoard",
            "Wireframing", "Prototypage", "Analyse fonctionnelle", "Tests utilisateurs", "A/B Testing",
            "Product Analytics", "KPIs produit", "Roadmapping", "Spécifications fonctionnelles",
            
            // Outils spécifiques
            "Figma", "Miro", "Amplitude", "Mixpanel", "Google Analytics", "Hotjar", "Optimal Workshop",
            
            // Méthodologies
            "Agile/Scrum", "Lean Startup", "Design Thinking", "Jobs to be Done", "Impact Mapping", "Story Mapping"
          ],
          education: "Bac+5 en Informatique, Management de produit, ou formation équivalente",
          experience: {
            min: 3,
            max: 8
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 55000,
            max: 80000,
            currency: "EUR"
          }
        },
        
        "Ingénieur DevOps": {
          description: `## À propos du poste
          
Nous recherchons un Ingénieur DevOps expérimenté pour accélérer notre transformation vers une culture DevOps mature. Vous serez responsable de la mise en place et de l'amélioration continue de nos infrastructures, pipelines CI/CD et pratiques d'automatisation.

## Responsabilités
- Concevoir, implémenter et maintenir des infrastructures cloud robustes et sécurisées
- Mettre en place et optimiser des pipelines CI/CD pour automatiser le déploiement de nos applications
- Collaborer avec les équipes de développement pour améliorer les pratiques de livraison continue
- Assurer la haute disponibilité, la scalabilité et la sécurité de nos environnements
- Mettre en œuvre des solutions de monitoring et d'alerting efficaces
- Automatiser les tâches opérationnelles répétitives pour améliorer la productivité des équipes
- Participer à la résolution des incidents et l'amélioration de nos processus de gestion de crise
- Documenter les architectures, procédures et bonnes pratiques DevOps

## Environnement de travail
Vous rejoindrez une équipe technique dynamique où l'innovation et l'amélioration continue sont au cœur de notre culture. Votre expertise technique et votre capacité à automatiser des processus complexes seront fortement valorisées.`,
          requiredSkills: [
            // Hard skills techniques
            "Linux", "Bash/Shell", "Docker", "Kubernetes", "Terraform", "Ansible", "Puppet", "Chef", 
            "AWS/Azure/GCP", "CI/CD", "Jenkins", "GitLab CI", "GitHub Actions", "CircleCI", "ArgoCD",
            "Infrastructure as Code", "Cloud Architecture", "Microservices", "Serverless",
            
            // Monitoring et sécurité
            "Prometheus", "Grafana", "ELK Stack", "Datadog", "New Relic", "PagerDuty", "Vault", "Security Scanning",
            
            // Méthodologies
            "DevOps", "SRE", "GitOps", "ChatOps", "Agile"
          ],
          education: "Bac+5 en Informatique ou équivalent",
          experience: {
            min: 3,
            max: 8
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 55000,
            max: 85000,
            currency: "EUR"
          }
        },
        
        "UX/UI Designer": {
          description: `## À propos du poste
          
Nous recherchons un UX/UI Designer talentueux pour concevoir des expériences utilisateurs exceptionnelles et des interfaces visuellement attrayantes pour nos produits numériques. Vous combinerez créativité et rigueur méthodologique pour créer des designs centrés sur l'utilisateur.

## Responsabilités
- Réaliser des recherches utilisateurs (interviews, tests, enquêtes) pour comprendre les besoins et attentes
- Créer des personas, parcours utilisateurs, et wireframes pour structurer l'expérience
- Concevoir des interfaces élégantes, intuitives et accessibles selon nos guidelines de design
- Élaborer des prototypes interactifs pour tester et valider les concepts
- Collaborer étroitement avec les développeurs pour assurer une implémentation fidèle des designs
- Participer à l'évolution de notre système de design et de notre identité visuelle
- Réaliser des tests d'utilisabilité et itérer sur les designs en fonction des retours
- Rester à jour sur les tendances UX/UI et les meilleures pratiques du secteur

## Environnement de travail
Vous rejoindrez une équipe créative où votre expertise en design centré utilisateur sera valorisée. Vous aurez l'opportunité d'impacter directement l'expérience de nos utilisateurs à travers des projets variés et stimulants.`,
          requiredSkills: [
            // Hard skills techniques
            "UX Design", "UI Design", "Wireframing", "Prototypage", "Responsive Design", "Design Systems",
            "Typography", "Color Theory", "Interaction Design", "Motion Design", "Iconography",
            "Information Architecture", "Atomic Design", "Design Thinking", "Micro-interactions",
            
            // Outils spécifiques
            "Figma", "Sketch", "Adobe XD", "Illustrator", "Photoshop", "InVision", "Principle", "Framer",
            "Axure", "Zeplin", "Abstract", "Miro", "ProtoPie",
            
            // Méthodologies
            "Design Sprint", "User-Centered Design", "Lean UX", "Atomic Design", "Double Diamond"
          ],
          education: "Bac+3 à Bac+5 en Design, UI/UX, ou équivalent",
          experience: {
            min: 2,
            max: 6
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 40000,
            max: 65000,
            currency: "EUR"
          }
        }
      };
      
      // Recherche de correspondance exacte
      let suggestion = detailedSuggestions[jobTitle];
      
      // Si pas de correspondance exacte, recherche partielle
      if (!suggestion) {
        const normalizedTitle = jobTitle.toLowerCase();
        for (const [key, value] of Object.entries(detailedSuggestions)) {
          if (normalizedTitle.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedTitle)) {
            suggestion = value;
            break;
          }
        }
      }
      
      // Si toujours pas de correspondance, génération d'une suggestion générique plus complète
      if (!suggestion) {
        return {
          description: `## À propos du poste
          
Nous recherchons un(e) ${jobTitle} talentueux(se) pour rejoindre notre équipe. Ce poste est une opportunité unique de contribuer à des projets stimulants et d'avoir un impact significatif dans notre organisation.

## Responsabilités
- Mettre en œuvre votre expertise technique pour résoudre des problèmes complexes
- Collaborer efficacement avec différentes équipes au sein de l'organisation
- Contribuer à l'amélioration continue des processus et des méthodologies
- Participer activement aux réunions d'équipe et aux revues de projets
- Rester à jour sur les dernières tendances et technologies du secteur
- Documenter votre travail de manière claire et précise
- Respecter les délais et les standards de qualité

## Environnement de travail
Vous rejoindrez une équipe dynamique et collaborative, où l'innovation et l'excellence sont valorisées. Nous offrons un cadre de travail stimulant qui favorise l'apprentissage continu et le développement professionnel.`,
          requiredSkills: [
            // Hard skills génériques mais précis
            "Maîtrise technique dans le domaine concerné", "Résolution de problèmes complexes", "Analyse de données",
            "Rédaction technique", "Gestion de projet", "Outils collaboratifs", "Connaissances sectorielles",
            
            // Soft skills essentiels
            "Communication efficace", "Travail d'équipe", "Rigueur analytique", "Autonomie", "Adaptabilité",
            "Organisation", "Capacité d'apprentissage", "Gestion des priorités", "Prise d'initiative"
          ],
          education: "Formation supérieure en lien avec le domaine du poste",
          experience: {
            min: 2,
            max: 5
          },
          contractType: "CDI",
          remotePreference: "Hybride",
          salary: {
            min: 40000,
            max: 60000,
            currency: "EUR"
          }
        };
      }
      
      console.log(`Generated detailed suggestions for job title: ${jobTitle}`);
      return suggestion;
    } catch (error: any) {
      console.error("Exception in generateJobOfferSuggestions:", error);
      throw new Error(error.message || "Impossible de générer des suggestions");
    }
  }
};
