
import { CandidateMatch, MatchDetails, SkillsDetails } from '../candidateMatchingService';

// Génère des compétences correspondantes aléatoires
const generateRandomSkills = (count: number): string[] => {
  const allSkills = [
    "Gestion de projet", "Planification stratégique", "Gestion des risques", 
    "Analyse de données", "Connaissance des normes ferroviaires", 
    "Ms Project", "JIRA", "PMO", "Communication", "Leadership",
    "Scrum", "Agile", "Kanban", "SAFe", "Gestion budgétaire",
    "Reporting", "Suivi de performance", "Stakeholder management",
    "Change management", "Process optimization"
  ];
  
  const shuffled = [...allSkills].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Génère des compétences manquantes aléatoires
const generateRandomMissingSkills = (count: number): string[] => {
  const allMissingSkills = [
    "Prince2", "PMP", "Six Sigma", "Lean Management", "ITIL",
    "DevOps", "Cloud Architecture", "Machine Learning", 
    "Product Management", "UX Design", "Certification ferroviaire",
    "Normes ISO", "Gestion de la qualité", "SAP", "BI Tools",
    "Power BI", "Tableau", "SQL", "Python", "Secteur énergie"
  ];
  
  const shuffled = [...allMissingSkills].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Génère des localisations aléatoires
const generateRandomLocation = (): string => {
  const locations = [
    "Paris, France", "Lyon, France", "Marseille, France", 
    "Bordeaux, France", "Lille, France", "Toulouse, France",
    "Nantes, France", "Strasbourg, France", "Montpellier, France",
    "Nice, France"
  ];
  
  return locations[Math.floor(Math.random() * locations.length)];
};

// Génère un score aléatoire dans une plage donnée
const generateRandomScore = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Génère un nom aléatoire
const generateRandomName = (): { firstName: string, lastName: string } => {
  const firstNames = ["Thomas", "Julie", "Antoine", "Sophie", "Nicolas", "Émilie", "Alexandre", "Céline", "Maxime", "Laura"];
  const lastNames = ["Martin", "Bernard", "Dubois", "Moreau", "Petit", "Leroy", "Durand", "Lefebvre", "Garcia", "Roux"];
  
  return {
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)]
  };
};

// Génère un poste aléatoire
const generateRandomPosition = (): string => {
  const positions = [
    "Chef de Projet", "Chef de Projet PMO", "Project Manager",
    "Program Manager", "Chef de Projet Ferroviaire", "Directeur de Projet",
    "Product Owner", "Scrum Master", "Project Coordinator",
    "PMO Analyst"
  ];
  
  return positions[Math.floor(Math.random() * positions.length)];
};

// Génère des entreprises aléatoires
const generateRandomCompany = (): string => {
  const companies = [
    "SNCF", "Alstom", "Bombardier", "Siemens", "Thales",
    "Airbus", "Safran", "EDF", "Engie", "Vinci",
    "Eiffage", "Bouygues", "Capgemini", "Atos", "Sopra Steria"
  ];
  
  return companies[Math.floor(Math.random() * companies.length)];
};

// Génère un match aléatoire
const generateRandomMatch = (candidateId: string, jobOfferId: string): CandidateMatch => {
  const skillsScore = generateRandomScore(40, 95);
  const experienceScore = generateRandomScore(30, 95);
  const educationScore = generateRandomScore(50, 95);
  const locationScore = generateRandomScore(60, 100);
  
  const globalScore = Math.round(
    skillsScore * 0.4 + experienceScore * 0.3 + educationScore * 0.2 + locationScore * 0.1
  );
  
  const matchedSkills = generateRandomSkills(Math.floor(Math.random() * 5) + 2);
  const missingSkills = generateRandomMissingSkills(Math.floor(Math.random() * 4) + 1);
  
  const name = generateRandomName();
  
  // Create properly typed match details
  const skillsDetails: SkillsDetails = {
    matchedSkills: matchedSkills,
    missingSkills: missingSkills,
    additionalSkills: [],
    skillsScore: skillsScore
  };
  
  const matchDetails: MatchDetails = {
    skills_details: skillsDetails
  };
  
  const match: CandidateMatch = {
    candidate: {
      id: candidateId,
      first_name: name.firstName,
      last_name: name.lastName,
      position: generateRandomPosition(),
      years_experience: Math.floor(Math.random() * 15) + 2,
      location: generateRandomLocation(),
      company: generateRandomCompany(),
      email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@example.com`,
    },
    match: {
      candidate_id: candidateId,
      job_offer_id: jobOfferId,
      match_score: globalScore,
      skills_match_score: skillsScore,
      experience_match_score: experienceScore,
      education_match_score: educationScore,
      location_match_score: locationScore,
      match_details: matchDetails,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
  
  return match;
};

// Génère des matches pour un job offer donné
export const generateMockMatches = (jobOfferId: string, count: number = 10): CandidateMatch[] => {
  const matches: CandidateMatch[] = [];
  
  for (let i = 0; i < count; i++) {
    const candidateId = `mock-candidate-${i}`;
    matches.push(generateRandomMatch(candidateId, jobOfferId));
  }
  
  // Trier par score
  return matches.sort((a, b) => b.match.match_score - a.match.match_score);
};
