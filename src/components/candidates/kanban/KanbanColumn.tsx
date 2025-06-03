
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CandidateData } from '@/services/data/candidateService';
import KanbanCandidateCard from './KanbanCandidateCard';

interface KanbanColumnProps {
  title: string;
  status: string;
  candidates: CandidateData[];
  onViewCandidate: (candidateId: string) => void;
  onCandidateDeleted?: () => void;
  onCandidateUpdated?: () => void; // NEW: Add callback for updates
  onDrop?: (candidateId: string, newStatus: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  candidates,
  onViewCandidate,
  onCandidateDeleted,
  onCandidateUpdated,
  onDrop
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain');
    if (onDrop && candidateId) {
      onDrop(candidateId, status);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initial': return 'bg-gray-100 text-gray-800';
      case 'contact': return 'bg-blue-100 text-blue-800';
      case 'prequalification': return 'bg-purple-100 text-purple-800';
      case 'ec1': return 'bg-orange-100 text-orange-800';
      case 'ec2': return 'bg-amber-100 text-amber-800';
      case 'presentation_client': return 'bg-indigo-100 text-indigo-800';
      case 'en_mission': return 'bg-green-100 text-green-800';
      case 'refus': return 'bg-red-100 text-red-800';
      case 'ancien_employe': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className="w-80 h-fit max-h-[70vh] flex flex-col border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="text-navy-dark dark:text-sand">{title}</span>
          <Badge variant="secondary" className={`${getStatusColor(status)} font-medium`}>
            {candidates.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 pb-4">
        {candidates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucun candidat</p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <div
              key={candidate.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', candidate.id!);
              }}
            >
              <KanbanCandidateCard
                candidate={candidate}
                onViewCandidate={onViewCandidate}
                onCandidateDeleted={onCandidateDeleted}
                onCandidateUpdated={onCandidateUpdated}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default KanbanColumn;
