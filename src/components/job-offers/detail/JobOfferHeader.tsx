
import React from 'react';
import { Edit, RefreshCw, Loader2, Building, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="bg-white dark:bg-navy-dark/50 rounded-xl p-6 mb-6 shadow-lg border border-blue-100/50 dark:border-blue-900/30 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center mb-1">
            <h1 className="text-2xl font-bold text-navy dark:text-sand mr-3">{jobOffer.title}</h1>
            <Badge variant={jobOffer.status === 'active' ? 'default' : 'secondary'} className={jobOffer.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
              {jobOffer.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 mt-3">
            {jobOffer.company && (
              <div className="flex items-center text-navy-dark/70 dark:text-sand/70">
                <Building className="h-4 w-4 mr-2 text-navy/60 dark:text-sand/60" />
                <span>{jobOffer.company}</span>
              </div>
            )}
            
            {jobOffer.location && (
              <div className="flex items-center text-navy-dark/70 dark:text-sand/70">
                <MapPin className="h-4 w-4 mr-2 text-navy/60 dark:text-sand/60" />
                <span>{jobOffer.location}</span>
              </div>
            )}
            
            {jobOffer.created_at && (
              <div className="flex items-center text-navy-dark/70 dark:text-sand/70">
                <Calendar className="h-4 w-4 mr-2 text-navy/60 dark:text-sand/60" />
                <span>Créée le {formatDate(jobOffer.created_at)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-2 lg:mt-0">
          <Button 
            variant="outline" 
            onClick={onEdit} 
            className="gap-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-navy hover:text-navy-dark dark:border-blue-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/50 dark:text-blue-300"
          >
            <Edit size={16} />
            Modifier
          </Button>
          
          <Button 
            variant="default" 
            onClick={onRecalculateMatches} 
            disabled={matchLoading}
            className="gap-2 bg-gradient-to-r from-navy to-navy-light hover:from-navy-dark hover:to-navy transition-all shadow-md hover:shadow-lg"
          >
            {matchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
            Recalculer les matchings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobOfferHeader;
