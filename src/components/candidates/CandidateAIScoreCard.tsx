
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertCircle, Loader2, RefreshCw, CheckCircle, XCircle, Lightbulb, Sparkles } from 'lucide-react';
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
  
  console.log(`🎯 [CandidateAIScoreCard] Rendering comprehensive analysis for candidate ${candidate.id} (${candidate.first_name} ${candidate.last_name}):`, {
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
    <Card className="w-full border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-3">
            {hasAIScore ? (
              <>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <span className="text-slate-800">Analyse IA Complète</span>
                  <div className="text-xs text-purple-600 font-medium mt-1">
                    ✨ Analyse complète avec recommandations
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-slate-800">Score de profil</span>
              </>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <Badge className={`px-4 py-2 text-lg font-bold border-2 ${getScoreColor(displayScore)} shadow-sm`}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `${displayScore}/100`
              )}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-9 w-9 p-0 hover:bg-slate-100"
              title="Actualiser l'analyse depuis la base de données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-slate-600 font-medium">
          {getScoreLabel(displayScore, hasAIScore)}
          {aiScore.source && (
            <span className="text-xs text-slate-500 ml-2 bg-slate-100 px-2 py-1 rounded">
              {aiScore.source === 'database' ? 'depuis la base' : aiScore.source}
            </span>
          )}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Progress bar avec design amélioré */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-700">Score global</span>
            <span className="text-slate-900 font-bold">{displayScore}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={displayScore} 
              className="w-full h-3 bg-slate-200"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white drop-shadow-sm">
                {displayScore >= 50 ? `${displayScore}%` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown si disponible avec design amélioré */}
        {aiScore.breakdown && Object.keys(aiScore.breakdown).length > 0 && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Détail par catégorie
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {aiScore.breakdown.skills !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Compétences</span>
                  <span className="font-bold text-purple-600">{aiScore.breakdown.skills}/20</span>
                </div>
              )}
              {aiScore.breakdown.experience !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Expérience</span>
                  <span className="font-bold text-green-600">{aiScore.breakdown.experience}/20</span>
                </div>
              )}
              {aiScore.breakdown.education !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Formation</span>
                  <span className="font-bold text-blue-600">{aiScore.breakdown.education}/20</span>
                </div>
              )}
              {aiScore.breakdown.languages !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Langues</span>
                  <span className="font-bold text-teal-600">{aiScore.breakdown.languages}/10</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Points forts avec design amélioré */}
        {hasStrengths && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Points forts ({aiScore.strengths!.length})
            </h4>
            <div className="space-y-2">
              {aiScore.strengths!.slice(0, 3).map((strength, index) => (
                <div key={index} className="text-sm text-green-800 bg-green-50 border-l-4 border-green-400 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                  <span className="text-green-600 mt-0.5 flex-shrink-0 font-bold">✓</span>
                  <span className="font-medium">{strength}</span>
                </div>
              ))}
              {aiScore.strengths!.length > 3 && (
                <div className="text-xs text-green-600 font-medium text-center">
                  +{aiScore.strengths!.length - 3} autres points forts
                </div>
              )}
            </div>
          </div>
        )}

        {/* Points faibles avec design amélioré */}
        {hasWeaknesses && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <XCircle className="w-5 h-5 text-orange-600" />
              Points d'amélioration ({aiScore.weaknesses!.length})
            </h4>
            <div className="space-y-2">
              {aiScore.weaknesses!.slice(0, 2).map((weakness, index) => (
                <div key={index} className="text-sm text-orange-800 bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                  <span className="text-orange-600 mt-0.5 flex-shrink-0 font-bold">•</span>
                  <span className="font-medium">{weakness}</span>
                </div>
              ))}
              {aiScore.weaknesses!.length > 2 && (
                <div className="text-xs text-orange-600 font-medium text-center">
                  +{aiScore.weaknesses!.length - 2} autres points d'amélioration
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommandations avec design amélioré */}
        {hasRecommendations && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              Recommandations IA ({aiScore.recommendations!.length})
            </h4>
            <div className="space-y-2">
              {aiScore.recommendations!.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="text-sm text-amber-800 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">💡</span>
                  <span className="font-medium">{recommendation}</span>
                </div>
              ))}
              {aiScore.recommendations!.length > 3 && (
                <div className="text-xs text-amber-600 font-medium text-center">
                  +{aiScore.recommendations!.length - 3} autres recommandations
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message si pas de score IA */}
        {!hasAIScore && !isLoading && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-bold">Analyse IA non disponible</p>
              <p className="text-xs text-blue-600 mt-1">
                Le CV n'a pas encore été analysé par l'IA. Analysez le CV pour obtenir un score détaillé et des recommandations.
              </p>
            </div>
          </div>
        )}

        {/* Erreur */}
        {aiScore.error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-bold">Erreur de chargement</p>
              <p className="text-xs text-red-600 mt-1">{aiScore.error}</p>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-1">
            {hasAIScore 
              ? 'Analyse IA complète - Mise à jour automatique'
              : 'Score de complétude calculé automatiquement'}
          </div>
          {hasAIScore && (
            <div className="text-xs text-purple-600 font-medium">
              ✨ Analyse complète avec {aiScore.strengths?.length || 0} points forts, {aiScore.weaknesses?.length || 0} améliorations et {aiScore.recommendations?.length || 0} recommandations
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateAIScoreCard;
