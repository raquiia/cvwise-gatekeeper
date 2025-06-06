
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, RefreshCw, Loader2, Target, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JobOffer } from '@/services/data/job-offers/types';
import { useActiveJob } from '@/context/ActiveJobContext';

interface JobOfferHeaderProps {
  jobOffer: JobOffer;
  onEdit: () => void;
  onRecalculateMatches: () => void;
  matchLoading: boolean;
}

const JobOfferHeader: React.FC<JobOfferHeaderProps> = ({
  jobOffer,
  onEdit,
  onRecalculateMatches,
  matchLoading
}) => {
  const navigate = useNavigate();
  const { activeJobOfferId } = useActiveJob();
  const isActiveJob = activeJobOfferId === jobOffer.id;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/job-offers')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux offres
            </Button>
            
            {isActiveJob && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Offre active pour le scoring
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRecalculateMatches}
              disabled={matchLoading}
              className="flex items-center gap-2"
            >
              {matchLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Recalculer les correspondances
                </>
              )}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {jobOffer.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {jobOffer.company && (
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  {jobOffer.company}
                </span>
              )}
              {jobOffer.location && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {jobOffer.location}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {isActiveJob && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Les scores de correspondance affichés sont calculés spécifiquement pour cette offre d'emploi
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobOfferHeader;
