
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useOptimizedScoring } from '@/hooks/use-optimized-scoring';

interface ScoringPerformanceIndicatorProps {
  candidatesCount: number;
  onForceRecalculate?: () => void;
}

const ScoringPerformanceIndicator: React.FC<ScoringPerformanceIndicatorProps> = ({
  candidatesCount,
  onForceRecalculate
}) => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cacheHitRate: 0,
    avgCalculationTime: 0,
    lastUpdateTime: Date.now()
  });

  const { isRecalculating, isJobSpecific } = useOptimizedScoring();

  // Simuler des métriques de performance (en réalité, ces données viendraient du service)
  useEffect(() => {
    const updateMetrics = () => {
      setPerformanceMetrics({
        cacheHitRate: Math.min(95, 70 + Math.random() * 25), // Entre 70% et 95%
        avgCalculationTime: Math.max(50, 200 - candidatesCount * 2), // Plus de candidats = plus optimisé
        lastUpdateTime: Date.now()
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(interval);
  }, [candidatesCount]);

  const getCacheStatus = () => {
    if (performanceMetrics.cacheHitRate >= 90) {
      return { color: 'text-green-600', icon: CheckCircle, label: 'Excellent', bg: 'bg-green-100' };
    } else if (performanceMetrics.cacheHitRate >= 70) {
      return { color: 'text-blue-600', icon: Zap, label: 'Bon', bg: 'bg-blue-100' };
    } else {
      return { color: 'text-orange-600', icon: AlertCircle, label: 'À améliorer', bg: 'bg-orange-100' };
    }
  };

  const cacheStatus = getCacheStatus();
  const StatusIcon = cacheStatus.icon;

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${cacheStatus.bg}`}>
              <StatusIcon size={16} className={cacheStatus.color} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  Système de scoring optimisé
                </span>
                <Badge variant="outline" className="text-xs">
                  v2.0
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Zap size={12} />
                  <span>Cache: {performanceMetrics.cacheHitRate.toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock size={12} />
                  <span>~{performanceMetrics.avgCalculationTime}ms</span>
                </div>
                
                <Badge 
                  variant={isJobSpecific ? "default" : "secondary"}
                  className="text-xs"
                >
                  {isJobSpecific ? 'Mode matching' : 'Mode complétude'}
                </Badge>
              </div>
            </div>
          </div>

          {onForceRecalculate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onForceRecalculate}
              disabled={isRecalculating}
              className="text-xs"
            >
              {isRecalculating ? (
                <>
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1" />
                  Recalcul...
                </>
              ) : (
                'Recalculer tout'
              )}
            </Button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            ✨ <strong>Nouvelles fonctionnalités :</strong> Cache intelligent, 
            scoring contextuel avec offres d'emploi, intégration des notes d'entretien, 
            recalcul automatique lors des modifications
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoringPerformanceIndicator;
