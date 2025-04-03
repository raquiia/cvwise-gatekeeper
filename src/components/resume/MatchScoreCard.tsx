
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { MatchResult } from '@/services/analysis/matchingUtils';
import { ChevronUp, ChevronDown, Briefcase, Clock, PieChart } from 'lucide-react';

interface MatchScoreCardProps {
  matchResult: MatchResult;
  className?: string;
  showDetails?: boolean;
}

const MatchScoreCard: React.FC<MatchScoreCardProps> = ({ 
  matchResult, 
  className,
  showDetails = true 
}) => {
  const { score, details } = matchResult;
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-500";
    if (score >= 70) return "text-amber-600 dark:text-amber-500";
    return "text-red-600 dark:text-red-500";
  };
  
  const getProgressColor = (score: number) => {
    if (score >= 85) return "bg-green-600 dark:bg-green-500";
    if (score >= 70) return "bg-amber-600 dark:bg-amber-500";
    return "bg-red-600 dark:bg-red-500";
  };
  
  const getBackgroundColor = (score: number) => {
    if (score >= 85) return "bg-green-50 dark:bg-green-900/20";
    if (score >= 70) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-red-50 dark:bg-red-900/20";
  };
  
  const getShadowColor = (score: number) => {
    if (score >= 85) return "shadow-green-200/50 dark:shadow-green-900/20";
    if (score >= 70) return "shadow-amber-200/50 dark:shadow-amber-900/20";
    return "shadow-red-200/50 dark:shadow-red-900/20";
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn("pb-2", getBackgroundColor(score))}>
        <CardTitle className="text-lg font-semibold flex justify-between items-center">
          <span>Compatibilité avec le poste</span>
          <span className={cn("text-2xl font-bold", getScoreColor(score))}>
            {score}%
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="mb-4">
          <Progress 
            value={score} 
            className="h-2" 
            indicatorClassName={getProgressColor(score)}
          />
        </div>
        
        {showDetails && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                  <PieChart size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium">Compétences</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{details.skillsMatch}%</span>
                {details.skillsMatch >= 70 ? (
                  <ChevronUp size={16} className="text-green-600 dark:text-green-500" />
                ) : (
                  <ChevronDown size={16} className="text-red-600 dark:text-red-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center dark:bg-purple-900/30">
                  <Clock size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium">Expérience</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{details.experienceMatch}%</span>
                {details.experienceMatch >= 70 ? (
                  <ChevronUp size={16} className="text-green-600 dark:text-green-500" />
                ) : (
                  <ChevronDown size={16} className="text-red-600 dark:text-red-500" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900/30">
                  <Briefcase size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium">Adéquation globale</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">{details.otherFactorsMatch}%</span>
                {details.otherFactorsMatch >= 70 ? (
                  <ChevronUp size={16} className="text-green-600 dark:text-green-500" />
                ) : (
                  <ChevronDown size={16} className="text-red-600 dark:text-red-500" />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchScoreCard;
