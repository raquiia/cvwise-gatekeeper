import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Users, Save } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { candidateService } from '@/services/data/candidateService';
import { toast } from 'sonner';

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
  const [contactInfo, setContactInfo] = useState(candidate.references_contact_info || '');
  const [conclusion, setConclusion] = useState(candidate.references_conclusion || '');
  const [referencesTaken, setReferencesTaken] = useState(candidate.references_taken || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!candidate.id) return;

    setIsSaving(true);
    try {
      await candidateService.updateCandidate({
        id: candidate.id,
        references_contact_info: contactInfo,
        references_conclusion: conclusion,
        references_taken: referencesTaken,
        references_verified_at: referencesTaken ? new Date().toISOString() : null
      });
      
      toast.success('Références mises à jour avec succès');
      onRefresh?.();
    } catch (error) {
      console.error('Error updating references:', error);
      toast.error('Erreur lors de la mise à jour des références');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = (
    contactInfo !== (candidate.references_contact_info || '') ||
    conclusion !== (candidate.references_conclusion || '') ||
    referencesTaken !== (candidate.references_taken || false)
  );

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5" />
              Statut des Références
            </CardTitle>
            <Badge 
              variant={referencesTaken ? "default" : "destructive"}
              className={`
                ${referencesTaken 
                  ? 'bg-green-500/10 text-green-700 border-green-500/30' 
                  : 'bg-red-500/10 text-red-700 border-red-500/30'
                }
              `}
            >
              {referencesTaken ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Références vérifiées
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Références en attente
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Informations de Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="contact-info" className="text-sm font-medium text-foreground">
              Contacts des références (téléphones, emails, entreprises...)
            </Label>
            <Textarea
              id="contact-info"
              placeholder="Ex: Marie Dupont - Directrice RH - Entreprise XYZ - marie.dupont@xyz.com - 01 23 45 67 89"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="mt-2 min-h-[120px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* References Conclusion */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Conclusions des Références</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="conclusion" className="text-sm font-medium text-foreground">
              Notes et conclusions suite aux appels de références
            </Label>
            <Textarea
              id="conclusion"
              placeholder="Synthèse des échanges avec les références, points positifs, points d'attention..."
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="mt-2 min-h-[120px] resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* References Status */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Validation des Références</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/30">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">
                Références prises et vérifiées
              </Label>
              <p className="text-xs text-muted-foreground">
                Marquer comme vérifié une fois les appels effectués
              </p>
            </div>
            <Switch
              checked={referencesTaken}
              onCheckedChange={setReferencesTaken}
            />
          </div>
          
          {candidate.references_verified_at && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
              Dernière vérification : {new Date(candidate.references_verified_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving || !candidate.id}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReferencesTab;