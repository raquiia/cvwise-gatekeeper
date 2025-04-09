
import React from 'react';
import { Edit, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { JobOffer } from '@/services/data/job-offers/types';

interface JobOfferHeaderProps {
  jobOffer: JobOffer;
  onEdit: () => void;
  onRecalculateMatches: () => void;
  matchLoading: boolean;
}

const JobOfferHeader = ({ 
  jobOffer, 
  onEdit, 
  onRecalculateMatches, 
  matchLoading 
}: JobOfferHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{jobOffer.title}</h1>
        <div className="flex items-center text-gray-600 mt-1">
          {jobOffer.company && (
            <span className="mr-3">{jobOffer.company}</span>
          )}
          {jobOffer.location && (
            <span>{jobOffer.location}</span>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit} className="gap-2">
          <Edit size={16} />
          Modifier
        </Button>
        
        <Button 
          variant="default" 
          onClick={onRecalculateMatches} 
          disabled={matchLoading}
          className="gap-2"
        >
          {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
          Recalculer les matchings
        </Button>
      </div>
    </div>
  );
};

export default JobOfferHeader;
