
// Dashboard data processing utilities

/**
 * Extracts the highest education level from a candidate
 */
export const extractHighestEducationLevel = (candidate: any) => {
  if (!candidate.education || !Array.isArray(candidate.education) || candidate.education.length === 0) {
    return "Non spécifié";
  }
  
  // Sort education by end date (most recent first)
  const sortedEducation = [...candidate.education].sort((a, b) => {
    const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
    const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
    return dateB - dateA;
  });
  
  // Get the most recent education
  const mostRecentEducation = sortedEducation[0];
  
  // Format the diploma with appropriate level
  let diplomaName = mostRecentEducation.degree || mostRecentEducation.diploma || "Non spécifié";
  let level = "";
  
  // Determine education level based on keywords
  const diplomaLower = diplomaName.toLowerCase();
  if (diplomaLower.includes("master") || diplomaLower.includes("bac +5") || 
      diplomaLower.includes("ingénieur") || diplomaLower.includes("mba")) {
    level = " (Bac +5)";
  } else if (diplomaLower.includes("licence") || diplomaLower.includes("bachelor") || 
             diplomaLower.includes("bac +3")) {
    level = " (Bac +3)";
  } else if (diplomaLower.includes("bts") || diplomaLower.includes("dut") || 
             diplomaLower.includes("bac +2")) {
    level = " (Bac +2)";
  } else if (diplomaLower.includes("doctorat") || diplomaLower.includes("phd") || 
             diplomaLower.includes("bac +8")) {
    level = " (Bac +8)";
  } else if (diplomaLower.includes("bac") || diplomaLower.includes("baccalauréat")) {
    level = " (Bac)";
  }
  
  return diplomaName + level;
};

/**
 * Extracts the sector from a candidate's experience
 */
export const extractSector = (candidate: any) => {
  if (!candidate.experiences || !Array.isArray(candidate.experiences) || candidate.experiences.length === 0) {
    return "Non spécifié";
  }
  
  const sortedExperiences = [...candidate.experiences].sort((a, b) => {
    const dateA = a.end_date ? new Date(a.end_date).getTime() : Date.now();
    const dateB = b.end_date ? new Date(b.end_date).getTime() : Date.now();
    return dateB - dateA;
  });
  
  const mostRecentExperience = sortedExperiences[0];
  
  const title = (mostRecentExperience.title || "").toLowerCase();
  const company = (mostRecentExperience.company || "").toLowerCase();
  
  if (title.includes("développeur") || title.includes("informatique") || 
      title.includes("software") || title.includes("web") || title.includes("data")) {
    return "IT";
  } else if (title.includes("médecin") || title.includes("infirmier") || 
            title.includes("santé") || company.includes("hôpital") || 
            company.includes("clinique")) {
    return "Santé";
  } else if (title.includes("énergie") || title.includes("électricité") || 
            company.includes("edf") || company.includes("engie")) {
    return "Énergie";
  } else if (title.includes("ingénieur") || title.includes("engineer") || 
            title.includes("architecte")) {
    return "Ingénierie";
  } else if (title.includes("train") || title.includes("sncf") || 
            title.includes("ferroviaire") || company.includes("sncf")) {
    return "Ferroviaire";
  } else if (title.includes("science") || title.includes("recherche") || 
            title.includes("laboratoire")) {
    return "Sciences";
  }
  
  return "Autre";
};

/**
 * Aggregates education data for chart display
 */
export const aggregateEducationData = (candidates: any[]) => {
  const educationMap: Record<string, number> = {};
  
  candidates.forEach(candidate => {
    const education = extractHighestEducationLevel(candidate);
    educationMap[education] = (educationMap[education] || 0) + 1;
  });
  
  return Object.entries(educationMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Aggregates sector data for chart display
 */
export const aggregateSectorData = (candidates: any[]) => {
  const sectorMap: Record<string, number> = {};
  
  candidates.forEach(candidate => {
    const sector = extractSector(candidate);
    sectorMap[sector] = (sectorMap[sector] || 0) + 1;
  });
  
  return Object.entries(sectorMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};
