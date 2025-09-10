import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { CandidateNote, FeedbackType, NextAction } from '@/services/data/candidateNotesService';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';

interface FeedbackWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: CandidateNote;
  currentStatus: string;
  onConfirm: (feedbackType: FeedbackType, nextAction: NextAction) => void;
  candidateName: string;
}

const FeedbackWorkflowModal: React.FC<FeedbackWorkflowModalProps> = ({
  isOpen,
  onClose,
  note,
  currentStatus,
  onConfirm,
  candidateName
}) => {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [selectedAction, setSelectedAction] = useState<NextAction | null>(null);

  const getNextStepStatus = (noteType: string): string | null => {
    switch (noteType) {
      case 'precal': return 'ci1';
      case 'ci1': return 'ci2';
      case 'ci2': return 'ci3';
      case 'ci3': return 'pipeline';
      case 'ec1': return 'ec2';
      case 'ec2': return 'pipeline';
      default: return null;
    }
  };

  const getRefusalStatus = (noteType: string): string => {
    switch (noteType) {
      case 'precal': return 'ps_refuse';
      case 'ci1': return 'ci1_refuse';
      case 'ci2': return 'ci2_refuse';
      case 'ci3': return 'ci3_refuse';
      case 'ec1': return 'ec1_refuse';
      case 'ec2': return 'ec2_refuse';
      default: return 'refus';
    }
  };

  const nextStepStatus = getNextStepStatus(note.note_type);
  const refusalStatus = getRefusalStatus(note.note_type);

  const handleConfirm = () => {
    if (selectedFeedback && selectedAction) {
      onConfirm(selectedFeedback, selectedAction);
      onClose();
      setSelectedFeedback(null);
      setSelectedAction(null);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedFeedback(null);
    setSelectedAction(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Feedback sur l'entretien - {candidateName}
          </DialogTitle>
          <DialogDescription>
            Quel est votre feedback pour cette étape ? Cela déterminera la prochaine étape du candidat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current step info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Étape actuelle</span>
              <Badge variant="outline">{CANDIDATE_STATUS_LABELS[currentStatus]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Type d'entretien : <span className="font-medium">{note.note_type.toUpperCase()}</span>
            </p>
          </div>

          {/* Feedback selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Votre évaluation :</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={selectedFeedback === 'positif' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedFeedback('positif');
                  setSelectedAction('continue');
                }}
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3 w-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Feedback Positif</div>
                    <div className="text-sm text-muted-foreground">
                      Le candidat peut passer à l'étape suivante
                      {nextStepStatus && (
                        <span className="ml-2">
                          <ArrowRight className="w-4 h-4 inline mx-1" />
                          {CANDIDATE_STATUS_LABELS[nextStepStatus]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant={selectedFeedback === 'negatif' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedFeedback('negatif');
                  setSelectedAction('refuse');
                }}
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3 w-full">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Feedback Négatif</div>
                    <div className="text-sm text-muted-foreground">
                      Le candidat sera marqué comme refusé à cette étape
                      <span className="ml-2 text-red-600 font-medium">
                        <ArrowRight className="w-4 h-4 inline mx-1" />
                        {CANDIDATE_STATUS_LABELS[refusalStatus]}
                      </span>
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant={selectedFeedback === 'neutre' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedFeedback('neutre');
                  setSelectedAction('en_attente');
                }}
                className="justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3 w-full">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div className="text-left flex-1">
                    <div className="font-medium">Feedback Neutre</div>
                    <div className="text-sm text-muted-foreground">
                      Aucun changement de statut, en attente de décision
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          {/* Summary */}
          {selectedFeedback && selectedAction && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">Résumé de l'action</h4>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p><strong>Feedback :</strong> {selectedFeedback === 'positif' ? 'Positif' : selectedFeedback === 'negatif' ? 'Négatif' : 'Neutre'}</p>
                <p><strong>Action :</strong> {selectedAction === 'continue' ? 'Continuer vers l\'étape suivante' : selectedAction === 'refuse' ? 'Refuser le candidat' : 'Laisser en attente'}</p>
                {selectedAction === 'continue' && nextStepStatus && (
                  <p><strong>Nouveau statut :</strong> {CANDIDATE_STATUS_LABELS[nextStepStatus]}</p>
                )}
                {selectedAction === 'refuse' && (
                  <p><strong>Nouveau statut :</strong> <span className="text-red-700 dark:text-red-300">{CANDIDATE_STATUS_LABELS[refusalStatus]}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedFeedback || !selectedAction}
          >
            Confirmer le feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackWorkflowModal;