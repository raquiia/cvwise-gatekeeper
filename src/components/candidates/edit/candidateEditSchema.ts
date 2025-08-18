
import { z } from 'zod';

export const candidateEditSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  years_experience: z.number().min(0).optional(),
  company: z.string().optional(),
  skills: z.array(z.string()).optional(),
  availability: z.string().optional(),
  salary_expectations: z.string().optional(),
  mobility: z.string().optional(),
  contract_type: z.string().optional(),
  remote_preference: z.string().optional(),
  travel_willingness: z.string().optional(),
  career_objectives: z.string().optional(),
  professional_values: z.string().optional(),
  work_authorization: z.string().optional(),
  interests: z.string().optional(),
  source: z.string().optional(),
});

export type FormValues = z.infer<typeof candidateEditSchema>;
