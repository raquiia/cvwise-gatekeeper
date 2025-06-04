
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Briefcase, Target } from 'lucide-react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import type { CandidateData } from '@/services/data/candidateService';
import { ensureStringArray } from '@/utils/candidateUtils';

interface CandidateAIScoreCardProps {
  candidate: CandidateData;
  onClick?: () => void;
  isSelected?: boolean;
}

const CandidateAIScoreCard: React.FC<CandidateAIScoreCardProps> = ({
  candidate,
  onClick,
  isSelected = false
}) => {
  const { calculateAIScore, getAIScore } = useAIScoring();
  const scoreData = getAIScore(candidate.id!);
  
  // Calculer automatiquement le score si pas encore fait
  useEffect(() => {
    if (candidate.id && scoreData.score === null && !scoreData.isLoading && !scoreData.error) {
      calculateAIScore(candidate.id);
    }
  }, [candidate.id, scoreData.score, scoreData.isLoading, scoreData.error, calculateAIScore]);
  
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-600';
    if (score >= 85) return 'bg-emerald-500 text-white';
    if (score >= 70) return 'bg-green-500 text-white';
    if (score >= 55) return 'bg-amber-500 text-white';
    if (score >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };
  
  const getScoreLabel = (score: number | null, isJobSpecific: boolean) => {
    if (score === null) return 'Non calculé';
    if (isJobSpecific) {
      if (score >= 70) return 'Excellent match';
      if (score >= 50) return 'Bon match';
      if (score >= 30) return 'Match partiel';
      return 'Match faible';
    } else {
      if (score >= 85) return 'Profil excellent';
      if (score >= 70) return 'Très bon profil';
      if (score >= 55) return 'Bon profil';
      if (score >= 40) return 'Profil à développer';
      return 'Profil incomplet';
    }
  };

  const skills = ensureStringArray(candidate.skills);
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
        isSelected ? 'border-purple-300 shadow-lg' : 'border-gray-200 hover:border-purple-200'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {candidate.first_name} {candidate.last_name}
            </h3>
            <p className="text-sm text-gray-600 mb-2">{candidate.position || 'Poste non spécifié'}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{candidate.years_experience || 0} ans d'exp.</span>
              <span>•</span>
              <span>{candidate.location || 'Lieu non spécifié'}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={scoreData.isJobSpecific ? "default" : "secondary"} 
              className="text-xs"
            >
              {scoreData.isJobSpecific ? <Briefcase size={10} className="mr-1" /> : <Target size={10} className="mr-1" />}
              {scoreData.isJobSpecific ? 'Match' : 'Profil'}
            </Badge>
            
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${getScoreColor(scoreData.score)}`}>
                {scoreData.isLoading ? (
                  <Sparkles className="w-4 h-4 animate-pulse" />
                ) : scoreData.error ? (
                  '?'
                ) : (
                  scoreData.score !== null ? scoreData.score : '?'
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs">
            {scoreData.error ? (
              <span className="text-red-600">Erreur de calcul</span>
            ) : scoreData.isLoading ? (
              <span className="text-purple-600">Analyse IA en cours...</span>
            ) : (
              <span className={`font-medium ${
                scoreData.score !== null && scoreData.score >= 70 ? 'text-green-700' : 
                scoreData.score !== null && scoreData.score >= 40 ? 'text-amber-700' : 'text-gray-600'
              }`}>
                {getScoreLabel(scoreData.score, scoreData.isJobSpecific)}
              </span>
            )}
          </div>
          
          {scoreData.score === null && !scoreData.isLoading && !scoreData.error && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                if (candidate.id) {
                  calculateAIScore(candidate.id);
                }
              }}
              className="text-xs h-6 px-2"
            >
              <Sparkles size={12} className="mr-1" />
              Calculer
            </Button>
          )}
        </div>
        
        {skills.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-purple-600">
            <span className="flex items-center gap-1">
              <Sparkles size={10} />
              Score IA
            </span>
            <span>OpenAI</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateAIScoreCard;
