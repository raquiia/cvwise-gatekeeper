
import React from 'react';
import InterviewNotes from './InterviewNotes';

interface NotesTabProps {
  candidate: {
    id?: string;
  };
}

const NotesTab: React.FC<NotesTabProps> = ({ candidate }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Notes d'entretien</h2>
      {candidate.id && <InterviewNotes candidateId={candidate.id} />}
    </div>
  );
};

export default NotesTab;
