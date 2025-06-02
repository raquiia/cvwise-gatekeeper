
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormValues } from './candidateEditSchema';

interface PreferencesSectionProps {
  form: UseFormReturn<FormValues>;
  formValues: FormValues;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({ form, formValues }) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="availability">Disponibilité</Label>
        <Input
          id="availability"
          {...form.register('availability')}
          value={formValues.availability || ''}
          onChange={(e) => form.setValue('availability', e.target.value)}
          placeholder="Disponibilité"
          className="border-navy/20"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="salary_expectations">Prétentions salariales</Label>
          <Input
            id="salary_expectations"
            {...form.register('salary_expectations')}
            value={formValues.salary_expectations || ''}
            onChange={(e) => form.setValue('salary_expectations', e.target.value)}
            placeholder="Prétentions salariales"
            className="border-navy/20"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mobility">Mobilité</Label>
          <Input
            id="mobility"
            {...form.register('mobility')}
            value={formValues.mobility || ''}
            onChange={(e) => form.setValue('mobility', e.target.value)}
            placeholder="Mobilité géographique"
            className="border-navy/20"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="contract_type">Type de contrat</Label>
          <Select
            value={formValues.contract_type || ''}
            onValueChange={(value) => {
              console.log('Setting contract_type to:', value);
              form.setValue('contract_type', value);
            }}
          >
            <SelectTrigger className="border-navy/20">
              <SelectValue placeholder="Sélectionnez un type de contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CDI">CDI</SelectItem>
              <SelectItem value="CDD">CDD</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
              <SelectItem value="Stage">Stage</SelectItem>
              <SelectItem value="Alternance">Alternance</SelectItem>
              <SelectItem value="Intérim">Intérim</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="remote_preference">Préférence de télétravail</Label>
          <Select
            value={formValues.remote_preference || ''}
            onValueChange={(value) => {
              console.log('Setting remote_preference to:', value);
              form.setValue('remote_preference', value);
            }}
          >
            <SelectTrigger className="border-navy/20">
              <SelectValue placeholder="Sélectionnez une préférence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sur site">Sur site</SelectItem>
              <SelectItem value="Hybride">Hybride</SelectItem>
              <SelectItem value="Full remote">Full remote</SelectItem>
              <SelectItem value="Flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};

export default PreferencesSection;
