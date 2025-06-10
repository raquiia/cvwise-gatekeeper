
/**
 * Composant d'affichage de scoring temps réel avec feedback enrichi
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Award,
  Target,
  Lightbulb,
  RefreshCw,
  Activity
} from 'lucide-react';
import { AdaptiveMatchResult } from '@/services/data/candidate-matching/adaptiveMatchingService';

interface RealtimeScoringDisplayProps {
  score: AdaptiveMatchResult | null;
  isLoading: boolean;
  progress: {
    stage: string;
    progress: number;
    message: string;
    estimatedTime?: number;
  };
  cacheHit: boolean;
  optimizations: string[];
  onRecalculate?: () => void;
  onInvalidateCache?: () => void;
}

const RealtimeScoringDisplay: React.FC<RealtimeScoringDisplayProps> = ({
  score,
  isLoading,
  progress,
  cacheHit,
  optimizations,
  onRecalculate,
  onInvalidateCache
}) => {

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 55) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number, confidence: number) => {
    const baseLabel = score >= 85 ? 'Excellent match' :
                     score >= 70 ? 'Très bon match' :
                     score >= 55 ? 'Match correct' :
                     score >= 40 ? 'Match partiel' : 'Match faible';
    
    const confidenceLabel = confidence >= 90 ? 'Très fiable' :
                           confidence >= 75 ? 'Fiable' :
                           confidence >= 60 ? 'Modéré' : 'Incertain';
    
    return `${baseLabel} (${confidenceLabel})`;
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'analyzing': return <Activity className="w-4 h-4 animate-pulse" />;
      case 'calculating': return <TrendingUp className="w-4 h-4 animate-pulse" />;
      case 'optimizing': return <Zap className="w-4 h-4 animate-pulse" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatEstimatedTime = (ms?: number) => {
    if (!ms) return '';
    return ms > 1000 ? `${Math.round(ms / 1000)}s` : `${Math.round(ms)}ms`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Score de correspondance adaptatif
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {cacheHit && (
              <Badge variant="outline" className="text-blue-600 bg-blue-50">
                <Zap className="w-3 h-3 mr-1" />
                Cache
              </Badge>
            )}
            
            {score && (
              <Badge className={`px-3 py-1 text-sm font-bold border ${getScoreColor(score.score)}`}>
                {score.score}/100
              </Badge>
            )}
          </div>
        </div>
        
        {score && (
          <p className="text-sm text-gray-600">
            {getScoreLabel(score.score, score.confidence)}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Barre de progression en temps réel */}
        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getStageIcon(progress.stage)}
                <span>{progress.message}</span>
              </div>
              {progress.estimatedTime && (
                <span className="text-xs text-gray-500">
                  ~{formatEstimatedTime(progress.estimatedTime)}
                </span>
              )}
            </div>
            
            <Progress 
              value={progress.progress} 
              className="w-full h-3"
            />
            
            <div className="text-center text-sm text-gray-500">
              {progress.progress}% terminé
            </div>
          </div>
        )}

        {/* Résultats détaillés */}
        {score && !isLoading && (
          <>
            {/* Score principal avec indicateur de confiance */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Score global</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{score.score}%</span>
                  <Badge variant="outline" className="text-xs">
                    Confiance: {score.confidence}%
                  </Badge>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="h-4 rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-green-500"
                  style={{ width: `${score.score}%` }}
                />
              </div>
            </div>

            {/* Contexte adaptatif */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-blue-800">Type de poste</span>
                <p className="text-sm text-blue-600 capitalize">{score.context.jobType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-800">Niveau</span>
                <p className="text-sm text-blue-600 capitalize">{score.context.seniorityLevel}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-800">Industrie</span>
                <p className="text-sm text-blue-600 capitalize">{score.context.industry}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-800">Urgence</span>
                <p className="text-sm text-blue-600 capitalize">{score.context.urgency}</p>
              </div>
            </div>

            {/* Adaptations appliquées */}
            {score.adaptations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  Adaptations appliquées
                </h4>
                <div className="flex flex-wrap gap-2">
                  {score.adaptations.map((adaptation, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {adaptation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bonus et pénalités */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {score.bonuses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-green-700 text-sm">Points forts</h4>
                  <ul className="space-y-1">
                    {score.bonuses.map((bonus, index) => (
                      <li key={index} className="text-xs text-green-600 flex items-start gap-1">
                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{bonus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {score.penalties.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-700 text-sm">Points d'attention</h4>
                  <ul className="space-y-1">
                    {score.penalties.map((penalty, index) => (
                      <li key={index} className="text-xs text-orange-600 flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{penalty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommandations */}
            {score.recommendations.length > 0 && (
              <div className="space-y-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-900 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Recommandations
                </h4>
                <ul className="space-y-2">
                  {score.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Optimisations appliquées */}
            {optimizations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Optimisations ({optimizations.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {optimizations.map((optimization, index) => (
                    <Badge key={index} variant="outline" className="text-xs text-gray-600">
                      {optimization}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {onRecalculate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecalculate}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Recalculer
            </Button>
          )}
          
          {onInvalidateCache && cacheHit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInvalidateCache}
              className="flex items-center gap-2 text-gray-600"
            >
              <Zap className="w-4 h-4" />
              Vider le cache
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeScoringDisplay;
