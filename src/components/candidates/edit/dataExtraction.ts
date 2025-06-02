import { CandidateData } from '@/services/data/candidateService';
import { FormValues } from './candidateEditSchema';

// IMPROVED: Better data extraction function that handles all data formats
export const extractValue = (field: any): string => {
  console.log('Extracting value from field:', field, 'Type:', typeof field);
  
  // If null or undefined, return empty string
  if (field === null || field === undefined) {
    return '';
  }
  
  // If it's already a string, return it directly
  if (typeof field === 'string') {
    return field;
  }
  
  // Handle the special object format {_type: "undefined", value: "actual_value"} or {value: "actual_value"}
  if (typeof field === 'object' && !Array.isArray(field)) {
    // If it has the _type: "undefined" structure, check if there's a real value
    if (field._type === 'undefined') {
      // If the value is also "undefined" string, return empty
      if (field.value === 'undefined' || field.value === undefined || field.value === null || field.value === '') {
        return '';
      }
      // Otherwise return the actual value
      return String(field.value);
    }
    
    // If it has a value property, use it
    if (field.hasOwnProperty('value')) {
      if (field.value === 'undefined' || field.value === undefined || field.value === null || field.value === '') {
        return '';
      }
      return String(field.value);
    }
    
    // Try to stringify the object if it's not empty
    try {
      const stringified = JSON.stringify(field);
      if (stringified !== '{}' && stringified !== 'null') {
        return stringified;
      }
    } catch (e) {
      console.error('Error stringifying field:', e);
    }
    
    return '';
  }
  
  // For any other type, convert to string
  return String(field);
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
  if (typeof value === 'object' && value !== null) {
    if (value._type === 'undefined' && value.value !== undefined && value.value !== 'undefined' && value.value !== '') {
      const parsed = parseInt(String(value.value), 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    if (value.value !== undefined && value.value !== 'undefined' && value.value !== '') {
      const parsed = parseInt(String(value.value), 10);
      return isNaN(parsed) ? undefined : parsed;
    }
  }
  return undefined;
};

// Helper function to safely get array values
const safeArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'object' && value._type === 'undefined') return [];
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
  console.log('Extracting form data from candidate:', data);
  
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
  
  console.log('Extracted form data:', formData);
  return formData;
};
