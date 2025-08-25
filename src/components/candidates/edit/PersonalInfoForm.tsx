
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormValues } from './candidateEditSchema';

interface PersonalInfoFormProps {
  form: UseFormReturn<FormValues>;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Informations personnelles</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-medium">Adresse</h4>
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse (rue, numéro)</FormLabel>
              <FormControl>
                <Input placeholder="Rue et numéro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code postal</FormLabel>
                <FormControl>
                  <Input placeholder="Code postal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ville</FormLabel>
                <FormControl>
                  <Input placeholder="Ville" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pays</FormLabel>
                <FormControl>
                  <Input placeholder="Pays" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse complète (pour compatibilité)</FormLabel>
              <FormControl>
                <Input placeholder="Adresse complète" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provenance du candidat</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la provenance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application_linkedin">Application - LinkedIn</SelectItem>
                    <SelectItem value="application_mp_website">Application - MP Website</SelectItem>
                    <SelectItem value="application_apec">Application - Apec</SelectItem>
                    <SelectItem value="application_indeed">Application - Indeed</SelectItem>
                    <SelectItem value="application_hellowork">Application - Hellowork</SelectItem>
                    <SelectItem value="application_infojob">Application - Infojob</SelectItem>
                    <SelectItem value="application_handshake">Application - Handshake</SelectItem>
                    <SelectItem value="application_alten_push">Application - Alten Recruitment Push</SelectItem>
                    <SelectItem value="hunt_linkedin">Hunt - LinkedIn</SelectItem>
                    <SelectItem value="hunt_indeed">Hunt - Indeed</SelectItem>
                    <SelectItem value="hunt_seek">Hunt - Seek</SelectItem>
                    <SelectItem value="hunt_apec">Hunt - Apec</SelectItem>
                    <SelectItem value="hunt_hellowork">Hunt - Hellowork</SelectItem>
                    <SelectItem value="referral_mp">Referral - from MP</SelectItem>
                    <SelectItem value="referral_client">Referral - Client</SelectItem>
                    <SelectItem value="referral_alten">Referral - Alten</SelectItem>
                    <SelectItem value="referral_alumni">Referral - Alumni</SelectItem>
                    <SelectItem value="mobility_mp">Mobility - MP</SelectItem>
                    <SelectItem value="mobility_alten">Mobility - Alten</SelectItem>
                    <SelectItem value="recruitment_fair">Recruitment Events - Recruitment fair</SelectItem>
                    <SelectItem value="recruitment_other_fair">Recruitment Events - Other Fair</SelectItem>
                    <SelectItem value="automated_ai">Automated by AI</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PersonalInfoForm;
