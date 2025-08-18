import React, { useState } from 'react';
import { Linkedin, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { analyzeLinkedInProfile } from '@/services/resumeService';

interface LinkedInFormProps {
  userId: string | undefined;
  onAnalysisComplete: (candidateId: string) => void;
}

const LinkedInForm: React.FC<LinkedInFormProps> = ({ userId, onAnalysisComplete }) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkedinUrl) {
      toast({
        title: "URL manquante",
        description: "Veuillez saisir l'URL du profil LinkedIn",
        variant: "destructive"
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour analyser un profil LinkedIn",
        variant: "destructive"
      });
      return;
    }

    if (!linkedinUrl.includes('linkedin.com')) {
      toast({
        title: "URL invalide",
        description: "Veuillez saisir une URL LinkedIn valide",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);

    try {
      console.log('Analyzing LinkedIn profile:', linkedinUrl);
      const result = await analyzeLinkedInProfile(linkedinUrl, userId);
      
      if (result.success && result.candidateId) {
        toast({
          title: "Analyse terminée",
          description: "Le profil LinkedIn a été analysé avec succès"
        });
        onAnalysisComplete(result.candidateId);
      } else {
        toast({
          title: "Échec de l'analyse",
          description: result.error || "Une erreur s'est produite lors de l'analyse",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error analyzing LinkedIn profile:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'analyse",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-full bg-[#0077B5] flex items-center justify-center text-white mr-3">
          <Linkedin size={20} />
        </div>
        <h2 className="text-xl font-semibold">Analyser un profil LinkedIn</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="linkedin-url" className="block text-sm font-medium mb-2">
            URL du profil LinkedIn
          </label>
          <div className="relative">
            <LinkIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              id="linkedin-url"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/username"
              className="pl-10"
              disabled={analyzing}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Copiez l'URL complète du profil LinkedIn du candidat
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">ℹ️ À propos de l'analyse LinkedIn</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Les informations extraites peuvent être limitées par rapport à un CV complet</li>
            <li>• Le score peut être moins précis qu'avec un CV détaillé</li>
            <li>• Vous pourrez ajouter un CV ultérieurement pour une analyse complète</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-[#0077B5] text-white hover:bg-[#005885]"
            disabled={analyzing || !linkedinUrl}
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Linkedin size={16} className="mr-2" />
                Analyser le profil
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LinkedInForm;