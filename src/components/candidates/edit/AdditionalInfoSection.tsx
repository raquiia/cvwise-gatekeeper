
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormValues } from './candidateEditSchema';

interface AdditionalInfoSectionProps {
  form: UseFormReturn<FormValues>;
  formValues: FormValues;
}

const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({ form, formValues }) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="interests">Centres d'intérêt</Label>
        <Textarea
          id="interests"
          {...form.register('interests')}
          value={formValues.interests || ''}
          onChange={(e) => form.setValue('interests', e.target.value)}
          placeholder="Centres d'intérêt"
          className="border-navy/20 min-h-24"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="career_objectives">Objectifs de carrière</Label>
        <Textarea
          id="career_objectives"
          {...form.register('career_objectives')}
          value={formValues.career_objectives || ''}
          onChange={(e) => form.setValue('career_objectives', e.target.value)}
          placeholder="Objectifs de carrière"
          className="border-navy/20 min-h-24"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="professional_values">Valeurs professionnelles</Label>
        <Textarea
          id="professional_values"
          {...form.register('professional_values')}
          value={formValues.professional_values || ''}
          onChange={(e) => form.setValue('professional_values', e.target.value)}
          placeholder="Valeurs professionnelles"
          className="border-navy/20 min-h-24"
        />
      </div>
    </>
  );
};

export default AdditionalInfoSection;
