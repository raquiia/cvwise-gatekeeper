
import { CandidateData } from '@/services/data/candidateService';
import { FormValues } from './candidateEditSchema';

// COMPLETELY SIMPLIFIED: Direct value extraction
export const extractValue = (field: any): string => {
  console.log('📝 Extracting value from field:', field, 'Type:', typeof field);
  
  // If null or undefined, return empty string
  if (field === null || field === undefined) {
    console.log('⚪ Field is null/undefined, returning empty string');
    return '';
  }
  
  // If it's already a string, return it directly (unless it's "undefined")
  if (typeof field === 'string') {
    if (field === 'undefined' || field === 'null') {
      console.log('⚪ Field is "undefined" or "null" string, returning empty');
      return '';
    }
    console.log('✅ Field is valid string:', field);
    return field;
  }
  
  // For any other type, convert to string
  const stringValue = String(field);
  console.log('🔄 Converted field to string:', stringValue);
  return stringValue === 'undefined' || stringValue === 'null' ? '' : stringValue;
};

// Helper function to safely get number values  
const safeNumber = (value: any): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value === '' || value === 'undefined') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

// Helper function to safely get array values
const safeArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    if (value === '' || value === 'undefined') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [value];
    }
  }
  return [];
};

export const extractFormDataFromCandidate = (data: CandidateData): FormValues => {
  console.log('🎯 EXTRACTING FORM DATA FROM CANDIDATE:', JSON.stringify(data, null, 2));
  
  const formData = {
    first_name: extractValue(data.first_name),
    last_name: extractValue(data.last_name),
    email: extractValue(data.email),
    phone: extractValue(data.phone),
    position: extractValue(data.position),
    location: extractValue(data.location),
    years_experience: safeNumber(data.years_experience),
    company: extractValue(data.company),
    skills: safeArray(data.skills),
    availability: extractValue(data.availability),
    salary_expectations: extractValue(data.salary_expectations),
    mobility: extractValue(data.mobility),
    contract_type: extractValue(data.contract_type),
    remote_preference: extractValue(data.remote_preference),
    travel_willingness: extractValue(data.travel_willingness),
    career_objectives: extractValue(data.career_objectives),
    professional_values: extractValue(data.professional_values),
    work_authorization: extractValue(data.work_authorization),
    interests: extractValue(data.interests)
  };
  
  console.log('🚀 FINAL EXTRACTED FORM DATA:', JSON.stringify(formData, null, 2));
  console.log('🏢 Company extracted:', formData.company);
  console.log('🏠 Remote preference extracted:', formData.remote_preference);
  console.log('🚗 Mobility extracted:', formData.mobility);
  
  return formData;
};
