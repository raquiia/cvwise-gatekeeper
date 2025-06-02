
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormValues } from './candidateEditSchema';

interface PersonalInfoSectionProps {
  form: UseFormReturn<FormValues>;
  formValues: FormValues;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ form, formValues }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="first_name">Prénom <span className="text-red-500">*</span></Label>
        <Input
          id="first_name"
          {...form.register('first_name')}
          value={formValues.first_name || ''}
          onChange={(e) => form.setValue('first_name', e.target.value)}
          placeholder="Prénom"
          className="border-navy/20"
        />
        {form.formState.errors.first_name && (
          <p className="text-sm text-red-500">{form.formState.errors.first_name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="last_name">Nom <span className="text-red-500">*</span></Label>
        <Input
          id="last_name"
          {...form.register('last_name')}
          value={formValues.last_name || ''}
          onChange={(e) => form.setValue('last_name', e.target.value)}
          placeholder="Nom"
          className="border-navy/20"
        />
        {form.formState.errors.last_name && (
          <p className="text-sm text-red-500">{form.formState.errors.last_name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          value={formValues.email || ''}
          onChange={(e) => form.setValue('email', e.target.value)}
          placeholder="Email"
          className="border-navy/20"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          {...form.register('phone')}
          value={formValues.phone || ''}
          onChange={(e) => form.setValue('phone', e.target.value)}
          placeholder="Téléphone"
          className="border-navy/20"
        />
      </div>
    </div>
  );
};

export default PersonalInfoSection;
