
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertCircle, Loader2, RefreshCw, CheckCircle, XCircle, Lightbulb, Sparkles, FileSearch, Play } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { analyzeResume } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';

interface CandidateAIScoreCardProps {
  candidate: CandidateData;
  compact?: boolean;
  onRefresh?: () => void;
}

const CandidateAIScoreCard: React.FC<CandidateAIScoreCardProps> = ({ 
  candidate, 
  compact = false,
  onRefresh 
}) => {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  
  // Récupérer les données IA directement depuis le candidat
  const hasAIScore = candidate.ai_score !== null && candidate.ai_score !== undefined;
  const displayScore = hasAIScore 
    ? candidate.ai_score 
    : candidate.profile_completeness ?? 0;
  
  const isLoading = isAnalyzing;
  const hasExplanation = !!candidate.ai_explanation && candidate.ai_explanation.length > 0;
  const hasStrengths = candidate.ai_strengths && Array.isArray(candidate.ai_strengths) && candidate.ai_strengths.length > 0;
  const hasWeaknesses = candidate.ai_weaknesses && Array.isArray(candidate.ai_weaknesses) && candidate.ai_weaknesses.length > 0;
  const hasRecommendations = candidate.ai_recommendations && Array.isArray(candidate.ai_recommendations) && candidate.ai_recommendations.length > 0;

  console.log(`🎯 [CandidateAIScoreCard] Rendering for candidate ${candidate.id} (${candidate.first_name} ${candidate.last_name}):`, {
    hasAIScore,
    aiScore: candidate.ai_score,
    hasExplanation,
    profileCompleteness: candidate.profile_completeness,
    aiAnalyzedAt: candidate.ai_analyzed_at,
    strengthsCount: candidate.ai_strengths?.length || 0,
    weaknessesCount: candidate.ai_weaknesses?.length || 0,
    recommendationsCount: candidate.ai_recommendations?.length || 0
  });

  const handleAnalyzeCV = async () => {
    if (!candidate.resume_id) {
      toast({
        title: "CV non trouvé",
        description: "Aucun CV associé à ce candidat. Veuillez d'abord uploader un CV.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      console.log('🚀 [CandidateAIScoreCard] Starting CV analysis for resume:', candidate.resume_id);
      
      toast({
        title: "Analyse IA en cours",
        description: "L'analyse IA du CV a commencé. Les données seront mises à jour automatiquement...",
      });

      const result = await analyzeResume(candidate.resume_id);
      
      if (result.success) {
        toast({
          title: "Analyse IA terminée",
          description: "Le CV a été analysé avec succès. Les données IA sont maintenant disponibles.",
        });
        
        // Rafraîchir les données du candidat
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(result.error || 'Échec de l\'analyse IA');
      }
      
    } catch (error: any) {
      console.error('❌ [CandidateAIScoreCard] Error analyzing CV:', error);
      toast({
        title: "Erreur d'analyse IA",
        description: error.message || "Impossible d'analyser le CV",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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
      return 'Score de complétude (pas encore d\'analyse IA)';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {hasAIScore ? (
          <Brain className="w-4 h-4 text-purple-600" />
        ) : (
          <TrendingUp className="w-4 h-4 text-blue-600" />
        )}
        <Badge className={`px-2 py-1 text-sm font-bold border ${getScoreColor(displayScore)}`}>
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            `${displayScore}%`
          )}
        </Badge>
        {!hasAIScore && (
          <span className="text-xs text-muted-foreground">(complétude)</span>
        )}
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
                    ✨ Score calculé par intelligence artificielle
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileSearch className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <span className="text-slate-800">Analyse IA Non Disponible</span>
                  <div className="text-xs text-amber-600 font-medium mt-1">
                    🔍 CV pas encore analysé par l'IA
                  </div>
                </div>
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
            
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-9 w-9 p-0 hover:bg-slate-100"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-slate-600 font-medium">
          {getScoreLabel(displayScore, hasAIScore)}
          {hasAIScore && candidate.ai_analyzed_at && (
            <span className="text-xs text-slate-500 ml-2 bg-slate-100 px-2 py-1 rounded">
              Analysé le {new Date(candidate.ai_analyzed_at).toLocaleDateString()}
            </span>
          )}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Si pas de score IA, afficher l'appel à l'action */}
        {!hasAIScore && !isLoading && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <FileSearch className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-amber-800 mb-2">Score de complétude affiché</p>
                <p className="text-sm text-amber-700 mb-3">
                  Le score actuel ({displayScore}%) représente la complétude du profil, pas l'analyse IA. 
                  Pour obtenir une analyse intelligente avec points forts, faiblesses et recommandations, 
                  analysez le CV du candidat.
                </p>
                <Button
                  onClick={handleAnalyzeCV}
                  disabled={isAnalyzing || !candidate.resume_id}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  size="sm"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Lancer l'analyse IA du CV
                    </>
                  )}
                </Button>
                {!candidate.resume_id && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Aucun CV associé à ce candidat
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress bar avec design amélioré */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-slate-700">
              {hasAIScore ? 'Score IA global' : 'Score de complétude'}
            </span>
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
        {candidate.ai_breakdown && Object.keys(candidate.ai_breakdown).length > 0 && hasAIScore && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Détail par catégorie (IA)
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {candidate.ai_breakdown.skills !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Compétences</span>
                  <span className="font-bold text-purple-600">{candidate.ai_breakdown.skills}/20</span>
                </div>
              )}
              {candidate.ai_breakdown.experience !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Expérience</span>
                  <span className="font-bold text-green-600">{candidate.ai_breakdown.experience}/20</span>
                </div>
              )}
              {candidate.ai_breakdown.education !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Formation</span>
                  <span className="font-bold text-blue-600">{candidate.ai_breakdown.education}/20</span>
                </div>
              )}
              {candidate.ai_breakdown.languages !== undefined && (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">Langues</span>
                  <span className="font-bold text-teal-600">{candidate.ai_breakdown.languages}/10</span>
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
              Points forts IA ({candidate.ai_strengths!.length})
            </h4>
            <div className="space-y-2">
              {candidate.ai_strengths!.slice(0, 3).map((strength, index) => (
                <div key={index} className="text-sm text-green-800 bg-green-50 border-l-4 border-green-400 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                  <span className="text-green-600 mt-0.5 flex-shrink-0 font-bold">✓</span>
                  <span className="font-medium">{strength}</span>
                </div>
              ))}
              {candidate.ai_strengths!.length > 3 && (
                <div className="text-xs text-green-600 font-medium text-center">
                  +{candidate.ai_strengths!.length - 3} autres points forts
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
              Points d'amélioration IA ({candidate.ai_weaknesses!.length})
            </h4>
            <div className="space-y-2">
              {candidate.ai_weaknesses!.slice(0, 2).map((weakness, index) => (
                <div key={index} className="text-sm text-orange-800 bg-orange-50 border-l-4 border-orange-400 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                  <span className="text-orange-600 mt-0.5 flex-shrink-0 font-bold">•</span>
                  <span className="font-medium">{weakness}</span>
                </div>
              ))}
              {candidate.ai_weaknesses!.length > 2 && (
                <div className="text-xs text-orange-600 font-medium text-center">
                  +{candidate.ai_weaknesses!.length - 2} autres points d'amélioration
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
              Recommandations IA ({candidate.ai_recommendations!.length})
            </h4>
            <div className="space-y-2">
              {candidate.ai_recommendations!.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="text-sm text-amber-800 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 flex items-start gap-3 shadow-sm">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0">💡</span>
                  <span className="font-medium">{recommendation}</span>
                </div>
              ))}
              {candidate.ai_recommendations!.length > 3 && (
                <div className="text-xs text-amber-600 font-medium text-center">
                  +{candidate.ai_recommendations!.length - 3} autres recommandations
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-1">
            {hasAIScore 
              ? 'Analyse IA complète disponible'
              : 'Score de complétude affiché - Analyse IA disponible sur demande'}
          </div>
          {hasAIScore && (
            <div className="text-xs text-purple-600 font-medium">
              ✨ Analyse complète avec {candidate.ai_strengths?.length || 0} points forts, {candidate.ai_weaknesses?.length || 0} améliorations et {candidate.ai_recommendations?.length || 0} recommandations
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateAIScoreCard;
