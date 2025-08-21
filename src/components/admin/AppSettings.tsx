
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AppSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    apiKey: 'sk-••••••••••••••••••••••••',
    model: 'gpt-4o-mini',
    cvLimit: '500',
    userLimit: '10',
    emailNewUser: true,
    emailLimit: true,
    emailError: true
  });

  const handleUpdateSetting = async (settingName: string) => {
    setLoading(settingName);
    try {
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Paramètre mis à jour",
        description: "La modification a été enregistrée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSaveAll = async () => {
    setLoading('saveAll');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Paramètres sauvegardés",
        description: "Toutes les modifications ont été enregistrées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = () => {
    setSettings({
      apiKey: 'sk-••••••••••••••••••••••••',
      model: 'gpt-4o-mini',
      cvLimit: '500',
      userLimit: '10',
      emailNewUser: true,
      emailLimit: true,
      emailError: true
    });
    toast({
      title: "Modifications annulées",
      description: "Les paramètres ont été réinitialisés.",
    });
  };
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
                  value={settings.apiKey}
                  onChange={(e) => setSettings(prev => ({...prev, apiKey: e.target.value}))}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateSetting('apiKey')}
                disabled={loading === 'apiKey'}
              >
                {loading === 'apiKey' ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="model" className="text-sm font-medium block mb-1">Modèle d'IA</label>
                <select 
                  id="model" 
                  className="input-field w-full max-w-lg"
                  value={settings.model}
                  onChange={(e) => setSettings(prev => ({...prev, model: e.target.value}))}
                >
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                </select>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateSetting('model')}
                disabled={loading === 'model'}
              >
                {loading === 'model' ? 'Mise à jour...' : 'Mettre à jour'}
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
                  value={settings.cvLimit}
                  onChange={(e) => setSettings(prev => ({...prev, cvLimit: e.target.value}))}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateSetting('cvLimit')}
                disabled={loading === 'cvLimit'}
              >
                {loading === 'cvLimit' ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="user-limit" className="text-sm font-medium block mb-1">Limite d'utilisateurs par entreprise</label>
                <input
                  id="user-limit"
                  type="number"
                  className="input-field w-full max-w-lg"
                  value={settings.userLimit}
                  onChange={(e) => setSettings(prev => ({...prev, userLimit: e.target.value}))}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleUpdateSetting('userLimit')}
                disabled={loading === 'userLimit'}
              >
                {loading === 'userLimit' ? 'Mise à jour...' : 'Mettre à jour'}
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
                <input 
                  type="checkbox" 
                  id="email-new-user" 
                  className="h-4 w-4" 
                  checked={settings.emailNewUser}
                  onChange={(e) => setSettings(prev => ({...prev, emailNewUser: e.target.checked}))}
                />
                <label htmlFor="email-new-user" className="text-sm">Nouvel utilisateur en attente</label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="email-limit" 
                  className="h-4 w-4" 
                  checked={settings.emailLimit}
                  onChange={(e) => setSettings(prev => ({...prev, emailLimit: e.target.checked}))}
                />
                <label htmlFor="email-limit" className="text-sm">Limite d'utilisation atteinte</label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="email-error" 
                  className="h-4 w-4" 
                  checked={settings.emailError}
                  onChange={(e) => setSettings(prev => ({...prev, emailError: e.target.checked}))}
                />
                <label htmlFor="email-error" className="text-sm">Erreurs système</label>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end space-x-2 border-t border-border/20 pt-4">
        <Button variant="outline" onClick={handleCancel} disabled={loading !== null}>
          Annuler
        </Button>
        <Button 
          className="bg-navy text-sand hover:bg-navy/90" 
          onClick={handleSaveAll}
          disabled={loading !== null}
        >
          {loading === 'saveAll' ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AppSettings;
