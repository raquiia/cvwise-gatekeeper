
import { CandidateData } from '@/services/data/candidateService';
import { FormValues } from './candidateEditSchema';

// ULTRA-SIMPLE: Enhanced extraction function that handles all data formats correctly including complex objects
export const extractValue = (field: any): string => {
  console.log('📝 Enhanced extracting value from field:', field, 'Type:', typeof field);
  
  // If null or undefined, return empty string for form compatibility
  if (field === null || field === undefined) {
    console.log('⚪ Field is null/undefined, returning empty string');
    return '';
  }
  
  // If it's already a string and has real content, return it
  if (typeof field === 'string') {
    // If it's empty, "undefined", or "null" string, return empty
    if (field === 'undefined' || field === 'null' || field === '') {
      console.log('⚪ Field is empty string or string "undefined"/"null"');
      return '';
    }
    console.log('✅ Field is valid string:', field);
    return field;
  }
  
  // CRITICAL FIX: Handle complex objects with _type and value properties
  if (typeof field === 'object' && field !== null) {
    console.log('🔧 Field is object, checking for _type/value structure:', field);
    
    // Check if it's the problematic format: {_type: "undefined", value: "actual_data"}
    if (field.hasOwnProperty('_type') && field.hasOwnProperty('value')) {
      console.log('🎯 Found _type/value structure - value:', field.value);
      
      // If the value property contains real data (not "undefined"), return it
      if (field.value && field.value !== 'undefined' && field.value !== 'null' && field.value !== '') {
        console.log('✅ Extracted real value from object:', field.value);
        return String(field.value);
      } else {
        console.log('⚪ Object value is empty or undefined');
        return '';
      }
    }
    
    // Check if it's a direct value object like {value: "some_data"}
    if (field.hasOwnProperty('value') && !field.hasOwnProperty('_type')) {
      console.log('🎯 Found simple value structure:', field.value);
      if (field.value && field.value !== 'undefined' && field.value !== 'null' && field.value !== '') {
        console.log('✅ Extracted value from simple object:', field.value);
        return String(field.value);
      }
    }
    
    console.log('⚠️ Object format not recognized, returning empty string');
    return '';
  }
  
  // If it's a number, convert to string
  if (typeof field === 'number') {
    console.log('✅ Field is number, converting:', field);
    return String(field);
  }
  
  // For any other type, return empty string
  console.log('⚠️ Field has unexpected type, returning empty string');
  return '';
};

// Helper function to safely get number values  
const safeNumber = (value: any): number | undefined => {
  console.log('🔢 Enhanced processing number value:', value);
  
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  
  // Handle complex objects
  if (typeof value === 'object' && value !== null) {
    if (value.hasOwnProperty('_type') && value.hasOwnProperty('value')) {
      if (value.value && value.value !== 'undefined' && value.value !== 'null') {
        const parsed = parseInt(String(value.value), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
    }
    if (value.hasOwnProperty('value') && !value.hasOwnProperty('_type')) {
      if (value.value && value.value !== 'undefined' && value.value !== 'null') {
        const parsed = parseInt(String(value.value), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
    }
    return undefined;
  }
  
  if (typeof value === 'string') {
    if (value === '' || value === 'undefined' || value === 'null') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  
  return undefined;
};

// Helper function to safely get array values
const safeArray = (value: any): any[] => {
  console.log('📚 Enhanced processing array value:', value);
  
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  
  // Handle complex objects
  if (typeof value === 'object' && value !== null) {
    if (value.hasOwnProperty('_type') && value.hasOwnProperty('value')) {
      if (value.value && value.value !== 'undefined' && value.value !== 'null') {
        try {
          const parsed = JSON.parse(String(value.value));
          return Array.isArray(parsed) ? parsed : [value.value];
        } catch {
          return [value.value];
        }
      }
    }
    if (value.hasOwnProperty('value') && !value.hasOwnProperty('_type')) {
      if (value.value && value.value !== 'undefined' && value.value !== 'null') {
        try {
          const parsed = JSON.parse(String(value.value));
          return Array.isArray(parsed) ? parsed : [value.value];
        } catch {
          return [value.value];
        }
      }
    }
    return [];
  }
  
  if (typeof value === 'string') {
    if (value === '' || value === 'undefined' || value === 'null') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  
  return [];
};

export const extractFormDataFromCandidate = (data: CandidateData): FormValues => {
  console.log('🎯 ENHANCED EXTRACTING FORM DATA FROM CANDIDATE:', JSON.stringify(data, null, 2));
  
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
  
  console.log('🚀 FINAL ENHANCED EXTRACTED FORM DATA:', JSON.stringify(formData, null, 2));
  console.log('🏢 Company extracted:', formData.company);
  console.log('🏠 Remote preference extracted:', formData.remote_preference);
  console.log('🚗 Mobility extracted:', formData.mobility);
  console.log('💰 Salary expectations extracted:', formData.salary_expectations);
  console.log('📝 Contract type extracted:', formData.contract_type);
  
  return formData;
};
