import React, { useState } from 'react';
import { User, Briefcase, GraduationCap, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { analyzeLinkedInProfile } from '@/services/resumeService';

interface ManualLinkedInFormProps {
  userId: string | undefined;
  linkedinUrl: string;
  initialData?: any;
  onAnalysisComplete: (candidateId: string) => void;
  onBack: () => void;
}

const ManualLinkedInForm: React.FC<ManualLinkedInFormProps> = ({ 
  userId, 
  linkedinUrl, 
  initialData,
  onAnalysisComplete, 
  onBack 
}) => {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    headline: initialData?.headline || '',
    location: initialData?.location || '',
    experience: initialData?.experience || '',
    education: initialData?.education || '',
    skills: initialData?.skills || ''
  });
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName) {
      toast({
        title: "Nom requis",
        description: "Veuillez saisir au moins le nom complet",
        variant: "destructive"
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour créer un candidat",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);

    try {
      // Create structured LinkedIn profile text for AI analysis
      const profileText = `
LinkedIn Profile Analysis:

Personal Information:
- Full Name: ${formData.fullName}
- Professional Headline: ${formData.headline || 'Non spécifié'}
- Location: ${formData.location || 'Non spécifié'}

${formData.experience ? `Professional Experience:\n${formData.experience}\n` : ''}
${formData.education ? `Education:\n${formData.education}\n` : ''}
${formData.skills ? `Skills:\n${formData.skills}\n` : ''}

Profile URL: ${linkedinUrl}

Note: Data manually entered from LinkedIn profile.
      `.trim();

      // Use the existing analyzeLinkedInProfile service with manual data
      const result = await analyzeLinkedInProfile(linkedinUrl, userId, profileText);
      
      if (result.success && result.candidateId) {
        toast({
          title: "Candidat créé",
          description: "Le profil LinkedIn a été analysé et le candidat créé avec succès"
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
      console.error('Error analyzing manual LinkedIn profile:', error);
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
          <User size={20} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Saisie manuelle LinkedIn</h2>
          <p className="text-sm text-muted-foreground">Copiez les informations depuis le profil LinkedIn</p>
        </div>
      </div>

      {initialData ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-emerald-900 mb-2">✨ Données pré-remplies</h3>
          <p className="text-xs text-emerald-800">
            Certains champs ont été pré-remplis grâce à l'extraction intelligente. 
            Vous pouvez les modifier ou compléter les informations manquantes.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-amber-900 mb-2">💡 Instructions</h3>
          <p className="text-xs text-amber-800">
            Ouvrez le profil LinkedIn dans un autre onglet et copiez les informations principales. 
            Seul le nom est obligatoire, mais plus vous renseignez d'informations, meilleure sera l'analyse.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              <User size={16} className="inline mr-2" />
              Nom complet *
            </label>
            <Input
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Prénom Nom"
              disabled={analyzing}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <MapPin size={16} className="inline mr-2" />
              Localisation
            </label>
            <Input
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Paris, France"
              disabled={analyzing}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Briefcase size={16} className="inline mr-2" />
            Titre professionnel
          </label>
          <Input
            value={formData.headline}
            onChange={(e) => handleInputChange('headline', e.target.value)}
            placeholder="Ex: Développeur Full-Stack chez TechCorp"
            disabled={analyzing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Briefcase size={16} className="inline mr-2" />
            Expérience professionnelle
          </label>
          <Textarea
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            placeholder="Listez les expériences principales avec entreprises, postes et dates..."
            className="min-h-[100px]"
            disabled={analyzing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <GraduationCap size={16} className="inline mr-2" />
            Formation
          </label>
          <Textarea
            value={formData.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
            placeholder="Diplômes, écoles, formations..."
            className="min-h-[80px]"
            disabled={analyzing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Compétences
          </label>
          <Textarea
            value={formData.skills}
            onChange={(e) => handleInputChange('skills', e.target.value)}
            placeholder="Listez les compétences principales séparées par des virgules..."
            className="min-h-[60px]"
            disabled={analyzing}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={analyzing}
          >
            Retour
          </Button>
          
          <Button
            type="submit"
            className="bg-[#0077B5] text-white hover:bg-[#005885]"
            disabled={analyzing || !formData.fullName}
          >
            {analyzing ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <User size={16} className="mr-2" />
                Créer le candidat
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ManualLinkedInForm;