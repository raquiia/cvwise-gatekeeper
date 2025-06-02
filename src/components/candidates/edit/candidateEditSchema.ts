
import { z } from 'zod';

export const candidateSchema = z.object({
  first_name: z.string().min(1, { message: "Le prénom est requis" }),
  last_name: z.string().min(1, { message: "Le nom est requis" }),
  email: z.string().email({ message: "Email invalide" }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  years_experience: z.union([z.number(), z.literal("")]).optional(),
  company: z.string().optional().or(z.literal("")),
  skills: z.array(z.any()).optional(),
  availability: z.string().optional().or(z.literal("")),
  salary_expectations: z.string().optional().or(z.literal("")),
  mobility: z.string().optional().or(z.literal("")),
  contract_type: z.string().optional().or(z.literal("")),
  remote_preference: z.string().optional().or(z.literal("")),
  travel_willingness: z.string().optional().or(z.literal("")),
  career_objectives: z.string().optional().or(z.literal("")),
  professional_values: z.string().optional().or(z.literal("")),
  work_authorization: z.string().optional().or(z.literal("")),
  interests: z.string().optional().or(z.literal(""))
});

export type FormValues = z.infer<typeof candidateSchema>;
