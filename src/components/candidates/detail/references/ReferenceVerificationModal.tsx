import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';
import { CandidateReference } from '@/services/data/candidateReferencesService';

interface ReferenceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (notes?: string) => void;
  reference: CandidateReference | null;
}

const ReferenceVerificationModal: React.FC<ReferenceVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  reference
}) => {
  const [notes, setNotes] = useState('');

  const handleVerify = () => {
    onVerify(notes);
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!reference) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Vérification de la référence
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/20 p-4 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">{reference.name}</h4>
            {reference.position && reference.company && (
              <p className="text-sm text-muted-foreground">
                {reference.position} chez {reference.company}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {reference.email && <span>📧 {reference.email}</span>}
              {reference.phone && <span>📞 {reference.phone}</span>}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">
              Notes de vérification (optionnel)
            </Label>
            <Textarea
              id="notes"
              placeholder="Synthèse de l'échange, points positifs, points d'attention..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 min-h-[100px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button onClick={handleVerify} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer comme vérifiée
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferenceVerificationModal;