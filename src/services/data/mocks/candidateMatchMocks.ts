
import { CandidateMatch, MatchDetails, SkillsDetails } from '../candidateMatchingService';

// Mock data for candidate matching
export const mockCandidateMatches: CandidateMatch[] = [
  {
    candidateId: "1",
    firstName: "Jean",
    lastName: "Dupont",
    position: "Développeur Frontend",
    company: "Tech Solutions",
    score: 89,
    details: {
      skills: {
        matched: ["JavaScript", "React", "HTML", "CSS"],
        missing: ["Vue.js", "Angular"],
        additional: ["TypeScript", "Node.js"],
        matchPercentage: 75
      },
      experienceLevel: {
        required: 3,
        candidate: 5,
        match: true
      },
      location: {
        required: "Paris",
        candidate: "Paris",
        match: true
      },
      educationLevel: {
        required: "Master",
        candidate: "Master en informatique",
        match: true
      },
      overall: 89
    }
  },
  {
    candidateId: "2",
    firstName: "Marie",
    lastName: "Martin",
    position: "UX Designer",
    company: "Design Studio",
    score: 72,
    details: {
      skills: {
        matched: ["Figma", "Adobe XD", "UI Design"],
        missing: ["Sketch", "Prototyping"],
        additional: ["Illustration", "Photoshop"],
        matchPercentage: 60
      },
      experienceLevel: {
        required: 2,
        candidate: 3,
        match: true
      },
      location: {
        required: "Lyon",
        candidate: "Paris",
        match: false
      },
      educationLevel: {
        required: "Bachelor",
        candidate: "Master en design",
        match: true
      },
      overall: 72
    }
  },
  {
    candidateId: "3",
    firstName: "Pierre",
    lastName: "Dubois",
    position: "Backend Developer",
    company: "Data Systems",
    score: 65,
    details: {
      skills: {
        matched: ["Java", "Spring", "SQL"],
        missing: ["Microservices", "Kubernetes", "Docker"],
        additional: ["Python", "Django"],
        matchPercentage: 50
      },
      experienceLevel: {
        required: 5,
        candidate: 4,
        match: false
      },
      location: {
        required: "Paris",
        candidate: "Paris",
        match: true
      },
      educationLevel: {
        required: "Master",
        candidate: "Bachelor en informatique",
        match: false
      },
      overall: 65
    }
  }
];

export const generateMockCandidateMatches = (count: number = 10): CandidateMatch[] => {
  const skills = ["JavaScript", "TypeScript", "React", "Vue.js", "Angular", "Node.js", "Express", "Python", "Django", "Flask", "Java", "Spring", "C#", ".NET", "PHP", "Laravel", "Ruby", "Rails", "Go", "Rust", "Swift", "Kotlin", "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "Git", "RESTful API", "GraphQL", "HTML", "CSS", "Sass", "LESS", "Bootstrap", "Tailwind", "Material UI", "Figma", "Adobe XD", "Sketch", "UI Design", "UX Design", "Responsive Design"];
  const companies = ["Tech Solutions", "Digital Innovation", "Data Systems", "Web Experts", "Software House", "Mobile Apps Inc", "Cloud Services", "Design Studio", "AI Research", "Blockchain Solutions"];
  const positions = ["Frontend Developer", "Backend Developer", "Full-Stack Developer", "Mobile Developer", "DevOps Engineer", "UX/UI Designer", "Product Manager", "Data Scientist", "Data Engineer", "QA Engineer", "Project Manager"];
  const locations = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille", "Nantes", "Strasbourg", "Montpellier", "Nice"];
  
  const results: CandidateMatch[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomSkillsCount = Math.floor(Math.random() * 8) + 3; // 3-10 skills
    const randomSkills = [...skills].sort(() => 0.5 - Math.random()).slice(0, randomSkillsCount);
    
    // Choose random skills for matched, missing and additional
    const matchedCount = Math.floor(Math.random() * randomSkillsCount) + 1;
    const matchedSkills = randomSkills.slice(0, matchedCount);
    const availableSkills = skills.filter(s => !matchedSkills.includes(s));
    const missingSkills = availableSkills.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 1);
    const additionalSkills = availableSkills.filter(s => !missingSkills.includes(s)).sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
    
    const score = Math.floor(Math.random() * 100);
    
    results.push({
      candidateId: `mock-${i + 1}`,
      firstName: `Prénom${i+1}`,
      lastName: `Nom${i+1}`,
      position: positions[Math.floor(Math.random() * positions.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      score: score,
      details: {
        skills: {
          matched: matchedSkills,
          missing: missingSkills,
          additional: additionalSkills,
          matchPercentage: Math.round((matchedSkills.length / (matchedSkills.length + missingSkills.length)) * 100)
        },
        experienceLevel: {
          required: Math.floor(Math.random() * 5) + 1,
          candidate: Math.floor(Math.random() * 10) + 1,
          match: Math.random() > 0.3
        },
        location: {
          required: locations[Math.floor(Math.random() * locations.length)],
          candidate: locations[Math.floor(Math.random() * locations.length)],
          match: Math.random() > 0.3
        },
        educationLevel: {
          required: Math.random() > 0.5 ? "Master" : "Bachelor",
          candidate: Math.random() > 0.5 ? "Master en informatique" : "Bachelor en informatique",
          match: Math.random() > 0.3
        },
        overall: score
      }
    });
  }
  
  // Sort by score
  return results.sort((a, b) => b.score - a.score);
};
