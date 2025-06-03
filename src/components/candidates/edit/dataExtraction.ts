
import { CandidateData } from '@/services/data/candidateService';
import { FormValues } from './candidateEditSchema';

// IMPROVED: More robust value extraction
export const extractValue = (field: any): string => {
  console.log('📝 Extracting value from field:', field, 'Type:', typeof field);
  
  // If null or undefined, return empty string
  if (field === null || field === undefined) {
    console.log('⚪ Field is null/undefined, returning empty string');
    return '';
  }
  
  // If it's already a string, check if it's a real value
  if (typeof field === 'string') {
    if (field === 'undefined' || field === 'null' || field === '') {
      console.log('⚪ Field is "undefined", "null" or empty string, returning empty');
      return '';
    }
    console.log('✅ Field is valid string:', field);
    return field;
  }
  
  // CRITICAL FIX: Handle object structures that might contain real data
  if (typeof field === 'object' && !Array.isArray(field)) {
    console.log('🔄 Field is object, analyzing structure:', field);
    
    // Check for the problematic _type: undefined structure first
    if (field.hasOwnProperty('_type') && field._type === 'undefined') {
      console.log('⚠️ Found _type: undefined structure');
      
      // But check if the value property actually contains real data
      if (field.hasOwnProperty('value') && field.value !== 'undefined' && field.value !== null && field.value !== '') {
        console.log('✅ Found real data in object.value:', field.value);
        return String(field.value);
      }
      
      console.log('⚪ Object has _type: undefined with no real value');
      return '';
    }
    
    // Check for simple value property in object
    if (field.hasOwnProperty('value')) {
      const value = field.value;
      if (value === null || value === undefined || value === 'undefined' || value === '') {
        console.log('⚪ Object.value is empty or undefined');
        return '';
      }
      console.log('✅ Found valid object.value:', value);
      return String(value);
    }
    
    // If it's an object but doesn't have recognizable structure, try to stringify
    console.log('⚠️ Object has unknown structure, attempting stringify');
    try {
      const stringified = JSON.stringify(field);
      if (stringified === '{}' || stringified === 'null') {
        return '';
      }
      return stringified;
    } catch {
      return '';
    }
  }
  
  // For numbers or other types, convert to string
  if (typeof field === 'number') {
    console.log('✅ Field is number, converting:', field);
    return String(field);
  }
  
  // Last resort: convert to string
  console.log('🔄 Converting unknown type to string:', field);
  const stringValue = String(field);
  return stringValue === 'undefined' || stringValue === 'null' ? '' : stringValue;
};

// Helper function to safely get number values  
const safeNumber = (value: any): number | undefined => {
  console.log('🔢 Processing number value:', value);
  
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return value;
  
  // Handle object structures for numbers
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value._type === 'undefined') {
      if (value.hasOwnProperty('value') && value.value !== 'undefined' && value.value !== null && value.value !== '') {
        const parsed = parseInt(String(value.value), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    }
    if (value.hasOwnProperty('value')) {
      const parsed = parseInt(String(value.value), 10);
      return isNaN(parsed) ? undefined : parsed;
    }
  }
  
  if (typeof value === 'string') {
    if (value === '' || value === 'undefined') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

// Helper function to safely get array values
const safeArray = (value: any): any[] => {
  console.log('📚 Processing array value:', value);
  
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  
  // Handle object structures for arrays
  if (typeof value === 'object') {
    if (value._type === 'undefined') {
      if (value.hasOwnProperty('value') && Array.isArray(value.value)) {
        return value.value;
      }
      return [];
    }
    if (value.hasOwnProperty('value') && Array.isArray(value.value)) {
      return value.value;
    }
  }
  
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
  console.log('💰 Salary expectations extracted:', formData.salary_expectations);
  console.log('📝 Contract type extracted:', formData.contract_type);
  
  return formData;
};
