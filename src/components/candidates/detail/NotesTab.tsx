
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
    <div className="p-8 space-y-8">
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-border/30 shadow-sm">
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-navy to-navy-dark bg-clip-text text-transparent">
          Notes d'entretien
        </h2>
        {candidate.id && <InterviewNotes candidateId={candidate.id} />}
      </div>
      
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-border/30 shadow-sm">
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-navy to-navy-dark bg-clip-text text-transparent">
          Enrichissement automatique
        </h2>
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
