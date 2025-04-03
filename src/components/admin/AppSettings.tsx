
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AppSettings: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de l'application</CardTitle>
        <CardDescription>
          Configurez les paramètres généraux de l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Analyse des CV</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="api-key" className="text-sm font-medium block mb-1">Clé API OpenAI</label>
                <input
                  id="api-key"
                  type="password"
                  className="input-field w-full max-w-lg"
                  placeholder="sk-••••••••••••••••••••••••"
                  defaultValue="sk-••••••••••••••••••••••••"
                />
              </div>
              <Button variant="outline" size="sm">
                Mettre à jour
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="model" className="text-sm font-medium block mb-1">Modèle d'IA</label>
                <select id="model" className="input-field w-full max-w-lg">
                  <option>gpt-4o-mini</option>
                  <option>gpt-4o</option>
                  <option>gpt-4-turbo</option>
                </select>
              </div>
              <Button variant="outline" size="sm">
                Mettre à jour
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-medium mb-3">Limites d'utilisation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="cv-limit" className="text-sm font-medium block mb-1">Limite mensuelle de CV</label>
                <input
                  id="cv-limit"
                  type="number"
                  className="input-field w-full max-w-lg"
                  defaultValue="500"
                />
              </div>
              <Button variant="outline" size="sm">
                Mettre à jour
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="user-limit" className="text-sm font-medium block mb-1">Limite d'utilisateurs par entreprise</label>
                <input
                  id="user-limit"
                  type="number"
                  className="input-field w-full max-w-lg"
                  defaultValue="10"
                />
              </div>
              <Button variant="outline" size="sm">
                Mettre à jour
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-sm font-medium mb-3">Notification par email</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="email-new-user" className="h-4 w-4" defaultChecked />
                <label htmlFor="email-new-user" className="text-sm">Nouvel utilisateur en attente</label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="email-limit" className="h-4 w-4" defaultChecked />
                <label htmlFor="email-limit" className="text-sm">Limite d'utilisation atteinte</label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="email-error" className="h-4 w-4" defaultChecked />
                <label htmlFor="email-error" className="text-sm">Erreurs système</label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end space-x-2 border-t border-border/20 pt-4">
        <Button variant="outline">Annuler</Button>
        <Button className="bg-navy text-sand hover:bg-navy/90">
          Enregistrer les modifications
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AppSettings;
