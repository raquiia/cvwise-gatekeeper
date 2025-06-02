
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormValues } from './candidateEditSchema';

interface ProfessionalInfoSectionProps {
  form: UseFormReturn<FormValues>;
  formValues: FormValues;
}

const ProfessionalInfoSection: React.FC<ProfessionalInfoSectionProps> = ({ form, formValues }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="position">Poste</Label>
        <Input
          id="position"
          {...form.register('position')}
          value={formValues.position || ''}
          onChange={(e) => form.setValue('position', e.target.value)}
          placeholder="Poste actuel ou recherché"
          className="border-navy/20"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Localisation</Label>
        <Input
          id="location"
          {...form.register('location')}
          value={formValues.location || ''}
          onChange={(e) => form.setValue('location', e.target.value)}
          placeholder="Ville, Pays"
          className="border-navy/20"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Entreprise</Label>
        <Input
          id="company"
          {...form.register('company')}
          value={formValues.company || ''}
          onChange={(e) => form.setValue('company', e.target.value)}
          placeholder="Entreprise actuelle"
          className="border-navy/20"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="years_experience">Années d'expérience</Label>
        <Input
          id="years_experience"
          type="number"
          {...form.register('years_experience', {
            setValueAs: (v) => v === "" 
              ? undefined 
              : typeof v === "string"
                ? parseInt(v, 10) 
                : v
          })}
          value={formValues.years_experience || ''}
          onChange={(e) => {
            const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
            form.setValue('years_experience', value);
          }}
          placeholder="Nombre d'années"
          className="border-navy/20"
        />
      </div>
    </div>
  );
};

export default ProfessionalInfoSection;
