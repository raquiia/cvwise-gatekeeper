
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertCircle, Loader2, RefreshCw, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useAIScoring } from '@/hooks/use-ai-scoring';
import { useCandidateScore } from '@/hooks/use-candidate-score';
import { CandidateData } from '@/services/data/candidateService';

interface CandidateAIScoreCardProps {
  candidate: CandidateData;
  compact?: boolean;
}

const CandidateAIScoreCard: React.FC<CandidateAIScoreCardProps> = ({ 
  candidate, 
  compact = false 
}) => {
  const { getAIScore, forceRefresh } = useAIScoring();
  const { score: contextualScore, isLoading: contextualLoading } = useCandidateScore(candidate);
  
  // Récupérer le score IA général (pas job-spécifique)
  const aiScore = getAIScore(candidate.id || '');
  
  console.log(`🎯 [CandidateAIScoreCard] Rendering comprehensive analysis for candidate ${candidate.id}:`, {
    aiScore: aiScore.score,
    hasExplanation: !!aiScore.explanation,
    explanationLength: aiScore.explanation?.length || 0,
    strengthsCount: aiScore.strengths?.length || 0,
    weaknessesCount: aiScore.weaknesses?.length || 0,
    recommendationsCount: aiScore.recommendations?.length || 0,
    isLoading: aiScore.isLoading,
    error: aiScore.error,
    source: aiScore.source
  });

  // Priorité : Score IA > Score contextuel > Score legacy du candidat
  const displayScore = aiScore.score ?? contextualScore?.overall ?? candidate.score ?? candidate.profile_completeness ?? 0;
  const isLoading = aiScore.isLoading || contextualLoading;
  const hasAIScore = aiScore.score !== null;
  const hasExplanation = !!aiScore.explanation && aiScore.explanation.length > 0;
  const hasStrengths = aiScore.strengths && aiScore.strengths.length > 0;
  const hasWeaknesses = aiScore.weaknesses && aiScore.weaknesses.length > 0;
  const hasRecommendations = aiScore.recommendations && aiScore.recommendations.length > 0;

  const handleRefresh = () => {
    console.log(`🔄 [CandidateAIScoreCard] Manual refresh requested for candidate ${candidate.id}`);
    if (candidate.id) {
      forceRefresh(candidate.id);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 55) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number, hasAI: boolean) => {
    if (hasAI) {
      if (score >= 85) return 'Profil excellent (IA)';
      if (score >= 70) return 'Très bon profil (IA)';
      if (score >= 55) return 'Bon profil (IA)';
      if (score >= 40) return 'Profil à développer (IA)';
      return 'Profil incomplet (IA)';
    } else {
      return 'Complétude du profil';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {hasAIScore && (
          <Brain className="w-4 h-4 text-purple-600" />
        )}
        <Badge className={`px-2 py-1 text-sm font-bold border ${getScoreColor(displayScore)}`}>
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            `${displayScore}%`
          )}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="w-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {hasAIScore ? (
              <>
                <Brain className="w-5 h-5 text-purple-600" />
                <span>Analyse IA Complète</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Score de profil</span>
              </>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge className={`px-3 py-1 text-sm font-bold border ${getScoreColor(displayScore)}`}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `${displayScore}/100`
              )}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Actualiser l'analyse depuis la base de données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          {getScoreLabel(displayScore, hasAIScore)}
          {aiScore.source && (
            <span className="text-xs text-gray-500 ml-2">
              ({aiScore.source === 'database' ? 'depuis la base' : aiScore.source})
            </span>
          )}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Score global</span>
            <span className="font-semibold">{displayScore}%</span>
          </div>
          <Progress 
            value={displayScore} 
            className="w-full h-2"
          />
        </div>

        {/* Breakdown si disponible */}
        {aiScore.breakdown && Object.keys(aiScore.breakdown).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm">Détail par catégorie</h4>
            <div className="space-y-2 text-xs">
              {aiScore.breakdown.skills !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Compétences</span>
                  <span className="font-medium">{aiScore.breakdown.skills}/20</span>
                </div>
              )}
              {aiScore.breakdown.experience !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Expérience</span>
                  <span className="font-medium">{aiScore.breakdown.experience}/20</span>
                </div>
              )}
              {aiScore.breakdown.education !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Formation</span>
                  <span className="font-medium">{aiScore.breakdown.education}/20</span>
                </div>
              )}
              {aiScore.breakdown.languages !== undefined && (
                <div className="flex items-center justify-between">
                  <span>Langues</span>
                  <span className="font-medium">{aiScore.breakdown.languages}/10</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Points forts */}
        {hasStrengths && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Points forts
            </h4>
            <div className="space-y-1">
              {aiScore.strengths!.map((strength, index) => (
                <div key={index} className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5 flex-shrink-0">✓</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points faibles */}
        {hasWeaknesses && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Points à améliorer
            </h4>
            <div className="space-y-1">
              {aiScore.weaknesses!.map((weakness, index) => (
                <div key={index} className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
                  <span className="text-red-600 mt-0.5 flex-shrink-0">•</span>
                  <span>{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommandations */}
        {hasRecommendations && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              Recommandations
            </h4>
            <div className="space-y-1">
              {aiScore.recommendations!.map((recommendation, index) => (
                <div key={index} className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">💡</span>
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explication IA */}
        {hasExplanation && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              Analyse détaillée IA
            </h4>
            <div className="text-sm text-gray-700 leading-relaxed p-3 bg-purple-50 border border-purple-200 rounded-lg">
              {aiScore.explanation}
            </div>
          </div>
        )}

        {/* Message si pas de score IA */}
        {!hasAIScore && !isLoading && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Analyse IA non disponible</p>
              <p className="text-xs text-blue-600 mt-1">
                Le CV n'a pas encore été analysé par l'IA. Analysez le CV pour obtenir un score détaillé et des recommandations.
              </p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {aiScore.error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Erreur de chargement</p>
              <p className="text-xs text-red-600 mt-1">{aiScore.error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateAIScoreCard;
