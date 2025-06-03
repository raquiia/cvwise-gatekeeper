
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { candidateNotesService } from '@/services/data/candidateNotesService';
import { candidateService, UpdateCandidateOptions } from '@/services/data/candidateService';

interface ProfileEnrichmentProps {
  candidateId: string;
  onEnrichmentComplete: () => void;
}

interface ExtractedField {
  field: string;
  value: string;
  label: string;
}

const ProfileEnrichment: React.FC<ProfileEnrichmentProps> = ({ 
  candidateId, 
  onEnrichmentComplete 
}) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const fieldLabels: Record<string, string> = {
    position: 'Poste',
    company: 'Entreprise',
    location: 'Localisation',
    salary_expectations: 'Prétentions salariales',
    availability: 'Disponibilité',
    mobility: 'Mobilité',
    contract_type: 'Type de contrat',
    remote_preference: 'Télétravail',
    travel_willingness: 'Volonté de voyager',
    career_objectives: 'Objectifs de carrière',
    professional_values: 'Valeurs professionnelles',
    work_authorization: 'Autorisation de travail',
    interests: 'Centres d\'intérêt'
  };

  const handleExtractInfo = async () => {
    try {
      setIsExtracting(true);
      console.log('🚀 Starting profile enrichment for candidate:', candidateId);

      // Récupérer toutes les notes du candidat
      const notes = await candidateNotesService.getNotesForCandidate(candidateId);
      
      if (notes.length === 0) {
        toast({
          title: "Aucune note trouvée",
          description: "Ajoutez d'abord des notes d'entretien pour enrichir le profil",
          variant: "destructive",
        });
        return;
      }

      console.log('📝 Found notes:', notes.length);

      // Appeler la fonction d'extraction IA
      const { data, error } = await supabase.functions.invoke('extract-candidate-info', {
        body: { candidateId, notes }
      });

      if (error) {
        throw error;
      }

      if (!data.success || !data.extractedInfo) {
        throw new Error('Aucune information exploitable trouvée dans les notes');
      }

      console.log('✨ Extracted info:', data.extractedInfo);

      // Transformer les données extraites en format d'affichage
      const fields: ExtractedField[] = Object.entries(data.extractedInfo).map(([field, value]) => ({
        field,
        value: String(value),
        label: fieldLabels[field] || field
      }));

      setExtractedFields(fields);
      setSelectedFields(new Set(fields.map(f => f.field)));
      setShowValidationModal(true);

      toast({
        title: "Extraction réussie",
        description: `${fields.length} informations extraites des notes`,
      });

    } catch (error: any) {
      console.error('❌ Error during extraction:', error);
      toast({
        title: "Erreur d'extraction",
        description: error.message || "Impossible d'extraire les informations",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyChanges = async () => {
    try {
      setIsApplying(true);
      console.log('💾 Applying selected changes...');

      // Construire l'objet de mise à jour avec l'ID et seulement les champs sélectionnés
      const updateData: UpdateCandidateOptions = { 
        id: candidateId 
      };
      
      extractedFields.forEach(field => {
        if (selectedFields.has(field.field)) {
          (updateData as any)[field.field] = field.value;
        }
      });

      console.log('📤 Update data:', updateData);

      // Mettre à jour le candidat
      await candidateService.updateCandidate(updateData);

      toast({
        title: "Profil enrichi",
        description: `${selectedFields.size} informations appliquées avec succès`,
      });

      setShowValidationModal(false);
      onEnrichmentComplete();

    } catch (error: any) {
      console.error('❌ Error applying changes:', error);
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Impossible d'appliquer les modifications",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const toggleFieldSelection = (field: string) => {
    const newSelection = new Set(selectedFields);
    if (newSelection.has(field)) {
      newSelection.delete(field);
    } else {
      newSelection.add(field);
    }
    setSelectedFields(newSelection);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 border-purple-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Sparkles size={20} />
            Enrichissement automatique du profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Utilisez l'IA pour extraire automatiquement les informations du profil à partir des notes d'entretien.
          </p>
          <Button 
            onClick={handleExtractInfo}
            disabled={isExtracting}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isExtracting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Extraction en cours...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Enrichir le profil avec l'IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={20} className="text-purple-600" />
              Informations extraites par l'IA
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Sélectionnez les informations que vous souhaitez appliquer au profil du candidat :
            </p>
            
            <div className="space-y-3">
              {extractedFields.map((field) => (
                <div 
                  key={field.field}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFields.has(field.field)
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                  onClick={() => toggleFieldSelection(field.field)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {field.label}
                        </Badge>
                        {selectedFields.has(field.field) ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <X size={16} className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{field.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowValidationModal(false)}
              disabled={isApplying}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleApplyChanges}
              disabled={isApplying || selectedFields.size === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isApplying ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Application...
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  Appliquer {selectedFields.size} modification{selectedFields.size > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileEnrichment;
