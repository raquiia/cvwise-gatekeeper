import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Edit, Trash2, Phone, Mail, Building } from 'lucide-react';
import { CandidateReference } from '@/services/data/candidateReferencesService';

interface ReferenceCardProps {
  reference: CandidateReference;
  onEdit: (reference: CandidateReference) => void;
  onDelete: (reference: CandidateReference) => void;
  onVerify: (reference: CandidateReference) => void;
  onUnverify: (reference: CandidateReference) => void;
}

const ReferenceCard: React.FC<ReferenceCardProps> = ({
  reference,
  onEdit,
  onDelete,
  onVerify,
  onUnverify
}) => {
  const getRelationshipLabel = (relationship?: string) => {
    const relations = {
      manager: 'Manager direct',
      colleague: 'Collègue',
      hr: 'Responsable RH',
      client: 'Client',
      subordinate: 'Collaborateur',
      other: 'Autre'
    };
    return relationship ? relations[relationship as keyof typeof relations] || relationship : 'Non spécifié';
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-foreground">{reference.name}</h4>
              <Badge 
                variant={reference.verified ? "default" : "destructive"}
                className={`
                  ${reference.verified 
                    ? 'bg-green-500/10 text-green-700 border-green-500/30' 
                    : 'bg-red-500/10 text-red-700 border-red-500/30'
                  }
                `}
              >
                {reference.verified ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Vérifiée
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Non vérifiée
                  </>
                )}
              </Badge>
            </div>
            
            {reference.position && reference.company && (
              <p className="text-sm text-muted-foreground mb-2">
                {reference.position} chez <span className="font-medium">{reference.company}</span>
              </p>
            )}
            
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {reference.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span>{reference.email}</span>
                </div>
              )}
              {reference.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{reference.phone}</span>
                </div>
              )}
              {reference.relationship && (
                <div className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  <span>{getRelationshipLabel(reference.relationship)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(reference)}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(reference)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            {reference.verified ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUnverify(reference)}
              >
                <XCircle className="w-3 h-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => onVerify(reference)}
              >
                <CheckCircle className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {reference.verified && reference.verified_at && (
          <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
            Vérifiée le {new Date(reference.verified_at).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        {reference.notes && (
          <div className="mt-3 text-sm bg-muted/20 p-2 rounded">
            <strong>Notes:</strong> {reference.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferenceCard;