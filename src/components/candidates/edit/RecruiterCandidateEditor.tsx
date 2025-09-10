import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recruiterCandidateService, RecruiterUpdateData } from '@/services/data/recruiterCandidateService';
import type { CandidateData } from '@/services/data/candidateService';

const recruiterEditSchema = z.object({
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  salary_expectations: z.string().optional(),
  availability: z.string().optional(),
  mobility: z.string().optional(),
  contract_type: z.string().optional(),
  remote_preference: z.string().optional(),
});

type RecruiterEditFormValues = z.infer<typeof recruiterEditSchema>;

interface RecruiterCandidateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateData;
  onSuccess: () => void;
  isActiveRecruiter: boolean;
}

const RecruiterCandidateEditor: React.FC<RecruiterCandidateEditorProps> = ({
  open,
  onOpenChange,
  candidate,
  onSuccess,
  isActiveRecruiter
}) => {
  const [saving, setSaving] = useState(false);

  const form = useForm<RecruiterEditFormValues>({
    resolver: zodResolver(recruiterEditSchema),
    defaultValues: {
      email: candidate.email || '',
      phone: candidate.phone || '',
      address: candidate.address || '',
      postal_code: candidate.postal_code || '',
      city: candidate.city || '',
      country: candidate.country || '',
      position: candidate.position || '',
      company: candidate.company || '',
      salary_expectations: candidate.salary_expectations || '',
      availability: candidate.availability || '',
      mobility: candidate.mobility || '',
      contract_type: candidate.contract_type || '',
      remote_preference: candidate.remote_preference || ''
    }
  });

  const onSubmit = async (data: RecruiterEditFormValues) => {
    setSaving(true);
    try {
      // Filter out empty strings and undefined values
      const updates: RecruiterUpdateData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          updates[key as keyof RecruiterUpdateData] = value;
        }
      });

      await recruiterCandidateService.updateCandidateByRecruiter(candidate.id, updates);
      
      toast.success('Informations du candidat mises à jour avec succès');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating candidate:', error);
      toast.error('Erreur lors de la mise à jour des informations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isActiveRecruiter ? 'Modifier les informations (Recruteur)' : 'Modifier les informations'}
          </DialogTitle>
          {isActiveRecruiter && (
            <p className="text-sm text-muted-foreground">
              Vous pouvez modifier ces informations car vous gérez actuellement le processus de recrutement pour ce candidat.
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations de contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations professionnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary_expectations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prétentions salariales</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilité</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cdi">CDI</SelectItem>
                          <SelectItem value="cdd">CDD</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                          <SelectItem value="interim">Intérim</SelectItem>
                          <SelectItem value="stage">Stage</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remote_preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Préférence télétravail</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une préférence" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sur_site">Sur site</SelectItem>
                          <SelectItem value="hybride">Hybride</SelectItem>
                          <SelectItem value="full_remote">Full remote</SelectItem>
                          <SelectItem value="pas_de_preference">Pas de préférence</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobilité</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner mobilité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="locale">Locale</SelectItem>
                          <SelectItem value="regionale">Régionale</SelectItem>
                          <SelectItem value="nationale">Nationale</SelectItem>
                          <SelectItem value="internationale">Internationale</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RecruiterCandidateEditor;