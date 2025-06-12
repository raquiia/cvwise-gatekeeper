import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, Sparkles, Info, Target, RefreshCw, Loader2 } from 'lucide-react';
import { aiScoringService } from '@/services/aiScoringService';
import { toast } from '@/hooks/use-toast';

interface AIAnalysisData {
  score: number;
  explanation: string;
  breakdown: any;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  calculated_at?: string;
}

interface AIAnalysisDisplayProps {
  candidateId: string;
  onAnalyze?: () => void;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ candidateId, onAnalyze }) => {
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(true);
  const [isStrengthsOpen, setIsStrengthsOpen] = useState(false);
  const [isWeaknessesOpen, setIsWeaknessesOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);

  const fetchAIAnalysis = async () => {
    if (!candidateId) return;
    
    try {
      setIsLoading(true);
      console.log('🔍 [AIAnalysisDisplay] Fetching AI analysis for candidate:', candidateId);
      
      const result = await aiScoringService.getAIScore(candidateId);

      if (result.success && result.score !== undefined) {
        console.log('✅ [AIAnalysisDisplay] AI score retrieved successfully');

        const processedData: AIAnalysisData = {
          score: result.score,
          explanation: result.explanation || '',
          breakdown: result.breakdown || {},
          strengths: result.strengths || [],
          weaknesses: result.weaknesses || [],
          recommendations: result.recommendations || [],
          calculated_at: new Date().toISOString()
        };

        console.log('🎯 [AIAnalysisDisplay] Processed analysis data:', {
          score: processedData.score,
          explanationLength: processedData.explanation.length,
          strengthsCount: processedData.strengths.length,
          weaknessesCount: processedData.weaknesses.length,
          recommendationsCount: processedData.recommendations.length
        });

        setAnalysisData(processedData);
        setError(null);
      } else {
        console.log('📭 [AIAnalysisDisplay] No AI analysis found for candidate:', candidateId);
        setAnalysisData(null);
        setError(null);
      }
    } catch (err: any) {
      console.error('❌ [AIAnalysisDisplay] Error fetching analysis:', err);
      setError(err.message);
      setAnalysisData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIAnalysis();
  }, [candidateId]);

  const getScoreEvaluation = (score: number) => {
    if (score >= 85) {
      return { 
        label: 'Profil excellent', 
        color: 'text-green-800', 
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        gradientFrom: 'from-green-500',
        gradientTo: 'to-green-600'
      };
    } else if (score >= 70) {
      return { 
        label: 'Très bon profil', 
        color: 'text-green-700', 
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        gradientFrom: 'from-green-400',
        gradientTo: 'to-green-500'
      };
    } else if (score >= 55) {
      return { 
        label: 'Bon profil', 
        color: 'text-gold-dark', 
        bgColor: 'bg-gold/10',
        borderColor: 'border-gold/30',
        gradientFrom: 'from-gold',
        gradientTo: 'to-gold-dark'
      };
    } else if (score >= 40) {
      return { 
        label: 'Profil à développer', 
        color: 'text-orange-800', 
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-300',
        gradientFrom: 'from-orange-500',
        gradientTo: 'to-orange-600'
      };
    } else {
      return { 
        label: 'Profil incomplet', 
        color: 'text-destructive', 
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
        gradientFrom: 'from-destructive',
        gradientTo: 'to-red-600'
      };
    }
  };

  const scoreComponents = [
    { label: 'Formations', score: analysisData?.breakdown?.education || 0, maxPoints: 20, color: 'text-purple-600' },
    { label: 'Expériences', score: analysisData?.breakdown?.experience || 0, maxPoints: 20, color: 'text-green-600' },
    { label: 'Compétences', score: analysisData?.breakdown?.skills || 0, maxPoints: 20, color: 'text-navy' },
    { label: 'Langues', score: analysisData?.breakdown?.languages || 0, maxPoints: 10, color: 'text-pink-600' },
    { label: 'Localisation/Mobilité', score: analysisData?.breakdown?.location || 0, maxPoints: 10, color: 'text-gold-dark' },
    { label: 'Résumé professionnel', score: analysisData?.breakdown?.profileSummary || 0, maxPoints: 10, color: 'text-indigo-600' },
    { label: 'Structure du CV', score: analysisData?.breakdown?.cvStructure || 0, maxPoints: 10, color: 'text-teal-600' }
  ];

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-navy/20 mb-4 flex items-center justify-center">
              <Brain className="w-12 h-12 text-navy animate-pulse" />
            </div>
            <div className="h-4 bg-muted rounded w-32 mb-2"></div>
            <div className="h-3 bg-muted rounded w-24"></div>
            <div className="mt-4 text-sm text-navy font-medium">
              ✨ Chargement de l'analyse IA...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Erreur de chargement</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAIAnalysis} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-navy" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Analyse IA non disponible</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aucune analyse IA trouvée pour ce candidat
            </p>
            <div className="bg-navy/5 p-3 rounded-lg mb-4 border border-navy/10">
              <p className="text-xs text-navy">
                💡 Analysez le CV du candidat pour obtenir un score IA détaillé
              </p>
            </div>
            {onAnalyze && (
              <Button onClick={onAnalyze} variant="default" size="sm" className="bg-navy hover:bg-navy-dark text-sand">
                <Brain className="w-4 h-4 mr-2" />
                Analyser le CV maintenant
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const evaluation = getScoreEvaluation(analysisData.score);

  return (
    <Card className={`border-2 ${evaluation.borderColor} bg-card`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-navy" />
            <CardTitle className="text-lg text-foreground">Analyse IA Complète</CardTitle>
            <Badge variant="secondary" className="text-xs">
              <Sparkles size={10} className="mr-1" />
              Sauvegardée
            </Badge>
          </div>
          <Button onClick={fetchAIAnalysis} variant="ghost" size="sm">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 bg-gradient-to-br ${evaluation.gradientFrom} ${evaluation.gradientTo} ${evaluation.borderColor}`}>
              {analysisData.score}
              <span className="text-sm ml-1">%</span>
            </div>
            <div className="absolute -bottom-2 -right-2">
              <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sand" />
              </div>
            </div>
          </div>
          
          <div className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${evaluation.bgColor} ${evaluation.color}`}>
            {evaluation.label}
          </div>
          
          <div className="mt-2 text-xs text-navy font-medium flex items-center gap-1">
            <Brain size={12} />
            Analysé récemment
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Détail de l'analyse IA
          </h4>
          
          {scoreComponents.map((component, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{component.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{component.score}/{component.maxPoints}</span>
                  <span className="text-sm font-bold text-foreground">{Math.round((component.score / component.maxPoints) * 100)}%</span>
                </div>
              </div>
              <Progress 
                value={(component.score / component.maxPoints) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>

        {analysisData.explanation && (
          <>
            <Separator className="my-4" />
            
            <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto text-foreground hover:text-foreground">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Info size={16} />
                    Analyse détaillée de l'IA
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isExplanationOpen ? 'Masquer' : 'Voir'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {analysisData.explanation}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {analysisData.strengths && analysisData.strengths.length > 0 && (
          <>
            <Separator className="my-4" />
            
            <Collapsible open={isStrengthsOpen} onOpenChange={setIsStrengthsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto text-foreground hover:text-foreground">
                  <span className="text-sm font-medium flex items-center gap-2 text-green-600">
                    <Sparkles size={16} />
                    Points Forts ({analysisData.strengths.length})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isStrengthsOpen ? 'Masquer' : 'Voir'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-2">
                  {analysisData.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-green-800">{strength}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {analysisData.weaknesses && analysisData.weaknesses.length > 0 && (
          <>
            <Separator className="my-4" />
            
            <Collapsible open={isWeaknessesOpen} onOpenChange={setIsWeaknessesOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto text-foreground hover:text-foreground">
                  <span className="text-sm font-medium flex items-center gap-2 text-orange-600">
                    <Info size={16} />
                    Points d'Amélioration ({analysisData.weaknesses.length})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isWeaknessesOpen ? 'Masquer' : 'Voir'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-2">
                  {analysisData.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-orange-800">{weakness}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {analysisData.recommendations && analysisData.recommendations.length > 0 && (
          <>
            <Separator className="my-4" />
            
            <Collapsible open={isRecommendationsOpen} onOpenChange={setIsRecommendationsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto text-foreground hover:text-foreground">
                  <span className="text-sm font-medium flex items-center gap-2 text-blue-600">
                    <Target size={16} />
                    Recommandations ({analysisData.recommendations.length})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isRecommendationsOpen ? 'Masquer' : 'Voir'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-2">
                  {analysisData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisDisplay;
