
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Loader2, User, Mail, Lock, Building, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  firstName: z.string().min(1, { message: "Le prénom est requis" }),
  lastName: z.string().min(1, { message: "Le nom est requis" }),
  company: z.string().optional(),
  isAdmin: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

const ModernCreateUserForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      company: "",
      isAdmin: false
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: responseData, error: createError } = await supabase.functions.invoke('create-admin-user', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          userData: {
            firstName: data.firstName,
            lastName: data.lastName,
            company: data.company || "",
            isAdmin: data.isAdmin
          }
        })
      });

      if (createError) {
        throw createError;
      }

      setSuccess(true);
      toast({
        title: "✅ Compte créé avec succès",
        description: `Un compte a été créé pour ${data.email}`,
      });

      form.reset();
      
      // Reset success state after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Erreur lors de la création du compte:", err);
      setError(err.message || "Une erreur est survenue lors de la création du compte");
      
      toast({
        title: "❌ Échec de la création du compte",
        description: err.message || "Impossible de créer le compte utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const watchIsAdmin = form.watch("isAdmin");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Compte créé avec succès ! L'utilisateur peut maintenant se connecter.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section Identité */}
          <Card className="bg-white/50 dark:bg-navy-dark/20 border-navy/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <User className="w-4 h-4" />
                </div>
                Identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Prénom" 
                          {...field} 
                          className="bg-white/70 border-navy/20 focus:border-navy/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nom" 
                          {...field} 
                          className="bg-white/70 border-navy/20 focus:border-navy/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entreprise</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Entreprise (optionnel)" 
                          {...field} 
                          className="pl-10 bg-white/70 border-navy/20 focus:border-navy/40"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Section Compte */}
          <Card className="bg-white/50 dark:bg-navy-dark/20 border-navy/10">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                  <Lock className="w-4 h-4" />
                </div>
                Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="email@example.com" 
                          {...field} 
                          className="pl-10 bg-white/70 border-navy/20 focus:border-navy/40"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="pl-10 bg-white/70 border-navy/20 focus:border-navy/40"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Minimum 6 caractères
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Section Permissions */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Shield className="w-4 h-4" />
              </div>
              Permissions avancées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-purple-200/50 bg-white/50 dark:bg-navy-dark/20 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base font-medium">
                        Droits d'administrateur
                      </FormLabel>
                      {watchIsAdmin && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <FormDescription>
                      {watchIsAdmin 
                        ? "✅ Accès complet : gestion utilisateurs, paramètres système, analytics avancés"
                        : "👤 Accès standard : gestion candidats, CVs, offres d'emploi"
                      }
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isLoading || success} 
            className="min-w-[200px] bg-gradient-to-r from-navy to-navy-dark hover:from-navy-dark hover:to-purple-900 text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Créé avec succès
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Créer le compte
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ModernCreateUserForm;
