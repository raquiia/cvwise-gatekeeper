
import React, { useState } from 'react';
import { CandidateData } from '@/services/data/candidateService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Brain, CheckCircle, XCircle, Lightbulb, FileText, Play, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { analyzeResume } from '@/services/resume/resumeAnalysisService';
import { toast } from '@/hooks/use-toast';

interface AIAnalysisDisplayProps {
  candidateId: string;
  candidate?: CandidateData;
  onAnalyze?: () => void;
  onRefresh?: () => void;
}

// Helper functions pour gérer les types Json de manière sûre
const safeArrayLength = (data: any): number => {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  return 0;
};

const safeArrayData = (data: any): string[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(item => typeof item === 'string');
  return [];
};

const safeObjectProperty = (data: any, property: string): any => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;
  return (data as Record<string, any>)[property];
};

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ 
  candidateId, 
  candidate,
  onAnalyze,
  onRefresh 
}) => {
  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  console.log('🔍 [AIAnalysisDisplay] Rendering with candidate data:', {
    candidateId,
    hasCandidate: !!candidate,
    ai_score: candidate?.ai_score,
    ai_explanation: candidate?.ai_explanation ? 'Present' : 'Missing',
    ai_analyzed_at: candidate?.ai_analyzed_at,
    strengthsCount: safeArrayLength(candidate?.ai_strengths),
    weaknessesCount: safeArrayLength(candidate?.ai_weaknesses),
    recommendationsCount: safeArrayLength(candidate?.ai_recommendations)
  });

  if (!candidate) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">Chargement des données du candidat...</p>
      </div>
    );
  }

  // Vérifier si les données IA sont présentes directement dans la table candidates
  const hasAIData = candidate.ai_score !== null && candidate.ai_score !== undefined;
  const strengths = safeArrayData(candidate.ai_strengths);
  const weaknesses = safeArrayData(candidate.ai_weaknesses);
  const recommendations = safeArrayData(candidate.ai_recommendations);
  
  console.log('📊 [AIAnalysisDisplay] AI Data status:', {
    hasAIData,
    ai_score: candidate.ai_score,
    ai_explanation: candidate.ai_explanation ? 'Present' : 'Missing',
    ai_analyzed_at: candidate.ai_analyzed_at,
    strengthsCount: strengths.length,
    weaknessesCount: weaknesses.length,
    recommendationsCount: recommendations.length
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
      console.log('🚀 [AIAnalysisDisplay] Starting CV analysis for resume:', candidate.resume_id);
      
      const actionText = hasAIData ? "Re-analyse IA en cours" : "Analyse IA en cours";
      
      toast({
        title: actionText,
        description: "L'analyse IA du CV a commencé. Les données seront mises à jour automatiquement...",
      });

      const result = await analyzeResume(candidate.resume_id);
      
      if (result.success) {
        const successText = result.isUpdate ? "Re-analyse IA terminée" : "Analyse IA terminée";
        const descriptionText = result.isUpdate 
          ? "Le profil du candidat a été mis à jour avec les nouvelles données IA."
          : "Le CV a été analysé avec succès. Les données IA sont maintenant disponibles.";
          
        toast({
          title: successText,
          description: descriptionText,
        });
        
        // Rafraîchir les données du candidat avec un léger délai pour s'assurer que la DB est à jour
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
        }, 1000);
        
      } else {
        throw new Error(result.error || 'Échec de l\'analyse IA');
      }
      
    } catch (error: any) {
      console.error('❌ [AIAnalysisDisplay] Error analyzing CV:', error);
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
  
  if (!hasAIData) {
    const displayScore = candidate.profile_completeness ?? 0;
    
    return (
      <div className="space-y-6">
        {/* En-tête avec proposition d'analyse */}
        <Card className="border-2 border-amber-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Brain className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <span className="text-slate-800">Analyse IA Non Disponible</span>
                  <div className="text-xs text-amber-600 font-medium mt-1">
                    🔍 CV pas encore analysé par l'IA
                  </div>
                </div>
              </CardTitle>
              
              <Badge className={`px-4 py-2 text-lg font-bold border-2 ${getScoreColor(displayScore)} shadow-sm`}>
                {displayScore}/100
              </Badge>
            </div>
            
            <p className="text-sm text-slate-600 font-medium">
              Score de complétude du profil (pas encore d'analyse IA)
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-amber-600 text-xl">🤖</div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 mb-2">Analyse IA requise</h3>
                <p className="text-amber-700 mb-4">
                  Ce candidat n'a pas encore été analysé par l'intelligence artificielle. 
                  L'analyse IA génère un score détaillé avec points forts, faiblesses et recommandations personnalisées.
                </p>
                <p className="text-sm text-amber-600 mb-4">
                  <strong>Candidat:</strong> {candidate.first_name} {candidate.last_name}<br/>
                  <strong>ID:</strong> {candidateId}<br/>
                  <strong>CV associé:</strong> {candidate.resume_id ? 'Oui' : 'Non'}<br/>
                  <strong>Score de complétude actuel:</strong> {displayScore}%
                </p>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAnalyzeCV}
                    disabled={isAnalyzing || !candidate.resume_id}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    size="default"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Lancer l'analyse IA du CV
                      </>
                    )}
                  </Button>
                  
                  {!candidate.resume_id && (
                    <div className="text-xs text-amber-600 bg-amber-100 px-3 py-2 rounded-lg">
                      ⚠️ Aucun CV associé à ce candidat
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information complémentaire */}
        <Card className="border border-slate-200">
          <CardContent className="p-6">
            <div className="text-center text-slate-600">
              <Brain className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="font-semibold mb-2">Que fait l'analyse IA ?</h3>
              <p className="text-sm mb-4">
                L'analyse par intelligence artificielle évalue automatiquement le profil du candidat 
                et génère un score détaillé basé sur l'expérience, les compétences, la formation et d'autres critères.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <strong>Points forts</strong><br/>
                  Identifie les atouts du candidat
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <XCircle className="w-5 h-5 text-orange-600 mx-auto mb-2" />
                  <strong>Axes d'amélioration</strong><br/>
                  Détecte les points à développer
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <strong>Recommandations</strong><br/>
                  Suggère des améliorations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayScore = candidate.ai_score || 0;

  return (
    <div className="space-y-6">
      {/* En-tête avec score IA */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <span className="text-slate-800">Analyse IA Complète</span>
                <div className="text-xs text-purple-600 font-medium mt-1">
                  ✨ Score calculé par intelligence artificielle
                </div>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <Badge className={`px-4 py-2 text-lg font-bold border-2 ${getScoreColor(displayScore)} shadow-sm`}>
                {displayScore}/100
              </Badge>
              
              <Button
                onClick={handleAnalyzeCV}
                disabled={isAnalyzing || !candidate.resume_id}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Re-analyse...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-analyser
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 font-medium">
            {getScoreLabel(displayScore, true)}
            {candidate.ai_analyzed_at && (
              <span className="text-xs text-slate-500 ml-2 bg-slate-100 px-2 py-1 rounded">
                Analysé le {new Date(candidate.ai_analyzed_at).toLocaleDateString()}
              </span>
            )}
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {/* Breakdown si disponible */}
          {candidate.ai_breakdown && Object.keys(candidate.ai_breakdown).length > 0 && (
            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Détail par catégorie (IA)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {safeObjectProperty(candidate.ai_breakdown, 'skills') !== undefined && (
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="font-medium">Compétences</span>
                    <span className="font-bold text-purple-600">{safeObjectProperty(candidate.ai_breakdown, 'skills')}/20</span>
                  </div>
                )}
                {safeObjectProperty(candidate.ai_breakdown, 'experience') !== undefined && (
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="font-medium">Expérience</span>
                    <span className="font-bold text-green-600">{safeObjectProperty(candidate.ai_breakdown, 'experience')}/20</span>
                  </div>
                )}
                {safeObjectProperty(candidate.ai_breakdown, 'education') !== undefined && (
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="font-medium">Formation</span>
                    <span className="font-bold text-blue-600">{safeObjectProperty(candidate.ai_breakdown, 'education')}/20</span>
                  </div>
                )}
                {safeObjectProperty(candidate.ai_breakdown, 'languages') !== undefined && (
                  <div className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="font-medium">Langues</span>
                    <span className="font-bold text-teal-600">{safeObjectProperty(candidate.ai_breakdown, 'languages')}/10</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section d'explication détaillée */}
      {candidate.ai_explanation && (
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-blue-900">
              <FileText className="w-6 h-6 text-blue-600" />
              Explication détaillée de l'analyse IA
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
              <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                {candidate.ai_explanation}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points forts détaillés */}
      {strengths.length > 0 && (
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-green-900">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Points forts identifiés par l'IA
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                {strengths.length} élément{strengths.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {strengths.slice(0, showAllStrengths ? strengths.length : 3).map((strength, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow-sm">
                  <span className="text-green-600 mt-0.5 flex-shrink-0 font-bold text-lg">✓</span>
                  <span className="text-green-800 font-medium leading-relaxed">{strength}</span>
                </div>
              ))}
              
              {strengths.length > 3 && (
                <Collapsible open={showAllStrengths} onOpenChange={setShowAllStrengths}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-green-300 text-green-700 hover:bg-green-50"
                    >
                      {showAllStrengths ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Masquer {strengths.length - 3} point{strengths.length - 3 > 1 ? 's' : ''} fort{strengths.length - 3 > 1 ? 's' : ''}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Voir les {strengths.length - 3} autre{strengths.length - 3 > 1 ? 's' : ''} point{strengths.length - 3 > 1 ? 's' : ''} fort{strengths.length - 3 > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points faibles détaillés */}
      {weaknesses.length > 0 && (
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-orange-900">
              <XCircle className="w-6 h-6 text-orange-600" />
              Points d'amélioration identifiés par l'IA
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                {weaknesses.length} élément{weaknesses.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {weaknesses.slice(0, showAllWeaknesses ? weaknesses.length : 3).map((weakness, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg shadow-sm">
                  <span className="text-orange-600 mt-0.5 flex-shrink-0 font-bold text-lg">•</span>
                  <span className="text-orange-800 font-medium leading-relaxed">{weakness}</span>
                </div>
              ))}
              
              {weaknesses.length > 3 && (
                <Collapsible open={showAllWeaknesses} onOpenChange={setShowAllWeaknesses}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      {showAllWeaknesses ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Masquer {weaknesses.length - 3} point{weaknesses.length - 3 > 1 ? 's' : ''} d'amélioration
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Voir les {weaknesses.length - 3} autre{weaknesses.length - 3 > 1 ? 's' : ''} point{weaknesses.length - 3 > 1 ? 's' : ''} d'amélioration
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommandations détaillées */}
      {recommendations.length > 0 && (
        <Card className="border-2 border-amber-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-amber-900">
              <Lightbulb className="w-6 h-6 text-amber-600" />
              Recommandations de l'IA
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                {recommendations.length} recommandation{recommendations.length > 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {recommendations.slice(0, showAllRecommendations ? recommendations.length : 3).map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg shadow-sm">
                  <span className="text-amber-600 mt-0.5 flex-shrink-0 text-lg">💡</span>
                  <span className="text-amber-800 font-medium leading-relaxed">{recommendation}</span>
                </div>
              ))}
              
              {recommendations.length > 3 && (
                <Collapsible open={showAllRecommendations} onOpenChange={setShowAllRecommendations}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      {showAllRecommendations ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Masquer {recommendations.length - 3} recommandation{recommendations.length - 3 > 1 ? 's' : ''}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Voir les {recommendations.length - 3} autre{recommendations.length - 3 > 1 ? 's' : ''} recommandation{recommendations.length - 3 > 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer avec informations techniques */}
      <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-sm text-slate-600">
          <Brain className="w-4 h-4 inline mr-2" />
          Analyse IA générée le {candidate.ai_analyzed_at ? new Date(candidate.ai_analyzed_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 'Date inconnue'}
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisDisplay;
