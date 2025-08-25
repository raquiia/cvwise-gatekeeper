import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CandidateData } from '@/services/data/candidateService';
import { candidateService } from '@/services/data/candidateService';
import { candidateReferencesService, CandidateReference } from '@/services/data/candidateReferencesService';
import { toast } from 'sonner';
import ReferenceForm from './references/ReferenceForm';
import ReferenceCard from './references/ReferenceCard';
import ReferenceVerificationModal from './references/ReferenceVerificationModal';

interface ReferencesTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ReferencesTab: React.FC<ReferencesTabProps> = ({
  candidate,
  isLoading,
  onRefresh
}) => {
  const [references, setReferences] = useState<CandidateReference[]>([]);
  const [globalNotes, setGlobalNotes] = useState(candidate.references_conclusion || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<CandidateReference | null>(null);
  const [verifyingReference, setVerifyingReference] = useState<CandidateReference | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);

  useEffect(() => {
    loadReferences();
  }, [candidate.id]);

  const loadReferences = async () => {
    if (!candidate.id) return;
    
    setIsLoadingReferences(true);
    try {
      const refs = await candidateReferencesService.getReferencesForCandidate(candidate.id);
      setReferences(refs);
    } catch (error) {
      console.error('Error loading references:', error);
      toast.error('Erreur lors du chargement des références');
    } finally {
      setIsLoadingReferences(false);
    }
  };

  const handleAddReference = async (data: any) => {
    try {
      await candidateReferencesService.addReference(data);
      toast.success('Référence ajoutée avec succès');
      loadReferences();
    } catch (error) {
      console.error('Error adding reference:', error);
      toast.error('Erreur lors de l\'ajout de la référence');
    }
  };

  const handleEditReference = async (data: any) => {
    if (!editingReference) return;
    
    try {
      await candidateReferencesService.updateReference(editingReference.id, data);
      toast.success('Référence modifiée avec succès');
      setEditingReference(null);
      loadReferences();
    } catch (error) {
      console.error('Error updating reference:', error);
      toast.error('Erreur lors de la modification de la référence');
    }
  };

  const handleDeleteReference = async (reference: CandidateReference) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette référence ?')) return;
    
    try {
      await candidateReferencesService.deleteReference(reference.id);
      toast.success('Référence supprimée avec succès');
      loadReferences();
    } catch (error) {
      console.error('Error deleting reference:', error);
      toast.error('Erreur lors de la suppression de la référence');
    }
  };

  const handleVerifyReference = async (notes?: string) => {
    if (!verifyingReference) return;
    
    try {
      await candidateReferencesService.verifyReference(verifyingReference.id, notes);
      toast.success('Référence vérifiée avec succès');
      setVerifyingReference(null);
      loadReferences();
    } catch (error) {
      console.error('Error verifying reference:', error);
      toast.error('Erreur lors de la vérification de la référence');
    }
  };

  const handleUnverifyReference = async (reference: CandidateReference) => {
    try {
      await candidateReferencesService.unverifyReference(reference.id);
      toast.success('Vérification annulée');
      loadReferences();
    } catch (error) {
      console.error('Error unverifying reference:', error);
      toast.error('Erreur lors de l\'annulation de la vérification');
    }
  };

  const handleSaveGlobalNotes = async () => {
    if (!candidate.id) return;

    setIsSaving(true);
    try {
      await candidateService.updateCandidate({
        id: candidate.id,
        references_conclusion: globalNotes
      });
      
      toast.success('Notes globales mises à jour avec succès');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating global notes:', error);
      toast.error('Erreur lors de la mise à jour des notes');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReferences = references.filter(ref =>
    ref.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const verifiedCount = references.filter(ref => ref.verified).length;
  const totalCount = references.length;
  const verificationPercentage = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const hasGlobalNotesChanges = globalNotes !== (candidate.references_conclusion || '');

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5" />
              Références ({totalCount})
            </CardTitle>
            <Badge 
              variant={verificationPercentage === 100 ? "default" : verificationPercentage > 0 ? "secondary" : "destructive"}
              className={`
                ${verificationPercentage === 100 
                  ? 'bg-green-500/10 text-green-700 border-green-500/30' 
                  : verificationPercentage > 0
                  ? 'bg-orange-500/10 text-orange-700 border-orange-500/30'
                  : 'bg-red-500/10 text-red-700 border-red-500/30'
                }
              `}
            >
              {verifiedCount}/{totalCount} vérifiées ({verificationPercentage}%)
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* References List */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Liste des Références</CardTitle>
            <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une référence
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, entreprise ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          )}

          {isLoadingReferences ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des références...
            </div>
          ) : filteredReferences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Aucune référence trouvée pour cette recherche.' : 'Aucune référence ajoutée pour le moment.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReferences.map((reference) => (
                <ReferenceCard
                  key={reference.id}
                  reference={reference}
                  onEdit={(ref) => {
                    setEditingReference(ref);
                    setIsFormOpen(true);
                  }}
                  onDelete={handleDeleteReference}
                  onVerify={(ref) => {
                    setVerifyingReference(ref);
                    setIsVerificationModalOpen(true);
                  }}
                  onUnverify={handleUnverifyReference}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global Notes */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Notes Globales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="global-notes" className="text-sm font-medium text-foreground">
              Synthèse générale des références
            </Label>
            <Textarea
              id="global-notes"
              placeholder="Conclusions générales suite aux vérifications des références..."
              value={globalNotes}
              onChange={(e) => setGlobalNotes(e.target.value)}
              className="mt-2 min-h-[120px] resize-none"
            />
          </div>
          
          {hasGlobalNotesChanges && (
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveGlobalNotes}
                disabled={isSaving || !candidate.id}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder les notes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forms and Modals */}
      <ReferenceForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReference(null);
        }}
        onSubmit={editingReference ? handleEditReference : handleAddReference}
        candidateId={candidate.id!}
        initialData={editingReference || undefined}
        isEditing={!!editingReference}
      />

      <ReferenceVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => {
          setIsVerificationModalOpen(false);
          setVerifyingReference(null);
        }}
        onVerify={handleVerifyReference}
        reference={verifyingReference}
      />
    </div>
  );
};

export default ReferencesTab;