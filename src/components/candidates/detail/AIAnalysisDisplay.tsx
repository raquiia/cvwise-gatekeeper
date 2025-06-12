
import React, { useState } from 'react';
import { CandidateData } from '@/services/data/candidateService';
import CandidateAIScoreCard from '../CandidateAIScoreCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Brain, CheckCircle, XCircle, Lightbulb, FileText } from 'lucide-react';

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

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ 
  candidateId, 
  candidate,
  onAnalyze,
  onRefresh 
}) => {
  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllWeaknesses, setShowAllWeaknesses] = useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

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
  
  if (!hasAIData) {
    return (
      <div className="space-y-6">
        <div className="p-6 border border-amber-200 rounded-lg bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 text-xl">🤖</div>
            <div>
              <h3 className="font-bold text-amber-800 mb-2">Analyse IA non disponible</h3>
              <p className="text-amber-700 mb-4">
                Ce candidat n'a pas encore été analysé par l'intelligence artificielle. 
                L'analyse IA génère un score détaillé avec points forts, faiblesses et recommandations.
              </p>
              <p className="text-sm text-amber-600">
                <strong>Candidat:</strong> {candidate.first_name} {candidate.last_name}<br/>
                <strong>ID:</strong> {candidateId}<br/>
                <strong>CV associé:</strong> {candidate.resume_id ? 'Oui' : 'Non'}<br/>
                <strong>Score de complétude:</strong> {candidate.profile_completeness || 0}%
              </p>
            </div>
          </div>
        </div>
        
        <CandidateAIScoreCard 
          candidate={candidate} 
          compact={false}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Carte de score principal */}
      <CandidateAIScoreCard 
        candidate={candidate} 
        compact={false}
        onRefresh={onRefresh}
      />

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
