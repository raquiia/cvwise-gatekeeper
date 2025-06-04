
// Dashboard data processing utilities

/**
 * Extracts the highest education level from a candidate
 */
export const extractHighestEducationLevel = (candidate: any) => {
  if (!candidate.education || !Array.isArray(candidate.education) || candidate.education.length === 0) {
    return "Non spécifié";
  }
  
  let highestLevel = 0; // 0 = Non spécifié, 1 = Bac, 2 = Bac +2, etc.
  
  candidate.education.forEach((edu: any) => {
    const degree = (edu.degree || edu.diploma || "").toLowerCase();
    const institution = (edu.institution || "").toLowerCase();
    const description = (edu.description || "").toLowerCase();
    const year = edu.year || "";
    
    // Combine all text for analysis
    const allText = `${degree} ${institution} ${description} ${year}`.toLowerCase();
    
    let currentLevel = 0;
    
    // Check for explicit Bac +X mentions
    const bacPlusMatch = allText.match(/bac\s*\+\s*(\d+)/);
    if (bacPlusMatch) {
      const level = parseInt(bacPlusMatch[1]);
      if (level === 2) currentLevel = Math.max(currentLevel, 2);
      else if (level === 3) currentLevel = Math.max(currentLevel, 3);
      else if (level === 4) currentLevel = Math.max(currentLevel, 3); // Bac +4 = Bac +3 category
      else if (level === 5) currentLevel = Math.max(currentLevel, 5);
      else if (level === 6) currentLevel = Math.max(currentLevel, 6);
      else if (level >= 7) currentLevel = Math.max(currentLevel, 8);
    }
    
    // Doctorat / PhD = Bac +8
    if (allText.includes("doctorat") || allText.includes("phd") || allText.includes("doctorate") || 
        allText.includes("thèse") || allText.includes("thesis")) {
      currentLevel = Math.max(currentLevel, 8);
    }
    
    // Master / MBA / Ingénieur = Bac +5
    else if (allText.includes("master") || allText.includes("mba") || allText.includes("ingénieur") ||
             allText.includes("engineer") || allText.includes("diplôme d'ingénieur") ||
             allText.includes("école d'ingénieur") || allText.includes("grande école")) {
      currentLevel = Math.max(currentLevel, 5);
    }
    
    // Licence / Bachelor = Bac +3
    else if (allText.includes("licence") || allText.includes("bachelor") || allText.includes("baccalauréat") ||
             (allText.includes("bac") && allText.includes("3"))) {
      currentLevel = Math.max(currentLevel, 3);
    }
    
    // BTS / DUT / DEUG = Bac +2
    else if (allText.includes("bts") || allText.includes("dut") || allText.includes("deug") ||
             allText.includes("diplôme universitaire de technologie") ||
             allText.includes("brevet de technicien supérieur") ||
             (allText.includes("bac") && allText.includes("2"))) {
      currentLevel = Math.max(currentLevel, 2);
    }
    
    // Baccalauréat / High School = Bac
    else if (allText.includes("baccalauréat") || allText.includes("high school") ||
             allText.includes("lycée") || (allText.includes("bac") && !allText.includes("+"))) {
      currentLevel = Math.max(currentLevel, 1);
    }
    
    // Update highest level found
    highestLevel = Math.max(highestLevel, currentLevel);
  });
  
  // Convert level number to display string
  switch (highestLevel) {
    case 8: return "Bac +8";
    case 6: return "Bac +6"; 
    case 5: return "Bac +5";
    case 3: return "Bac +3";
    case 2: return "Bac +2";
    case 1: return "Bac";
    default: return "Non spécifié";
  }
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
  
  // Sort by education level order (highest first)
  const levelOrder = ["Bac +8", "Bac +6", "Bac +5", "Bac +3", "Bac +2", "Bac", "Non spécifié"];
  
  return Object.entries(educationMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const indexA = levelOrder.indexOf(a.name);
      const indexB = levelOrder.indexOf(b.name);
      return indexA - indexB;
    });
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
