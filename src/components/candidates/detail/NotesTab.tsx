
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
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Notes d'entretien</h2>
        {candidate.id && <InterviewNotes candidateId={candidate.id} />}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Enrichissement automatique</h2>
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
