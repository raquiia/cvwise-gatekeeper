
import React from 'react';
import InterviewNotes from './InterviewNotes';
import ProfileEnrichment from './ProfileEnrichment';

interface NotesTabProps {
  candidate: {
    id?: string;
  };
  onDataUpdate?: () => void;
}

const NotesTab: React.FC<NotesTabProps> = ({ candidate, onDataUpdate }) => {
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background/80 via-background to-muted/20 min-h-full">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Notes d'entretien</h2>
        {candidate.id && <InterviewNotes candidateId={candidate.id} />}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Enrichissement automatique</h2>
        {candidate.id && (
          <ProfileEnrichment 
            candidateId={candidate.id} 
            onEnrichmentComplete={onDataUpdate || (() => {})}
          />
        )}
      </div>
    </div>
  );
};

export default NotesTab;
