
/**
 * Tableau de bord de performance pour surveiller les optimisations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  Database, 
  RefreshCw,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { optimizedMatchingService } from '@/services/data/candidate-matching/optimizedMatchingService';
import { intelligentCache } from '@/services/cache/intelligentCacheService';

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      const performanceMetrics = optimizedMatchingService.getPerformanceMetrics();
      const cacheStats = intelligentCache.getStats();
      
      setMetrics({
        ...performanceMetrics,
        cacheStats,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-600 bg-green-50';
    if (hitRate >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="ml-2">Chargement des métriques...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tableau de bord des performances</h2>
          <p className="text-gray-600">Dernière mise à jour: {metrics.timestamp}</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => optimizedMatchingService.optimizeCache()}
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Optimiser le cache
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Candidats traités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.processedCandidates}</div>
            <p className="text-xs text-gray-600">Total: {metrics.totalCandidates}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Temps moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(metrics.averageProcessingTime)}
            </div>
            <p className="text-xs text-gray-600">
              Total: {formatDuration(metrics.totalProcessingTime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              Taux de cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cacheStats.hitRate}%</div>
            <p className="text-xs text-gray-600">
              {metrics.cacheHits} hits / {metrics.cacheHits + metrics.cacheMisses} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics.cacheStats.hitRate).split(' ')[0]}`}>
              {metrics.cacheStats.hitRate >= 80 ? 'Excellente' :
               metrics.cacheStats.hitRate >= 60 ? 'Bonne' : 'À améliorer'}
            </div>
            <p className="text-xs text-gray-600">Basé sur le taux de cache</p>
          </CardContent>
        </Card>
      </div>

      {/* Détails du cache */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Statistiques du cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taille du cache</span>
                <span className="font-medium">{metrics.cacheStats.cacheSize}/{metrics.cacheStats.maxSize}</span>
              </div>
              
              <Progress 
                value={(metrics.cacheStats.cacheSize / metrics.cacheStats.maxSize) * 100}
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Hits</span>
                <div className="font-medium text-green-600">{metrics.cacheStats.hits}</div>
              </div>
              <div>
                <span className="text-gray-600">Misses</span>
                <div className="font-medium text-red-600">{metrics.cacheStats.misses}</div>
              </div>
              <div>
                <span className="text-gray-600">Évictions</span>
                <div className="font-medium text-amber-600">{metrics.cacheStats.evictions}</div>
              </div>
              <div>
                <span className="text-gray-600">Mémoire</span>
                <div className="font-medium">{metrics.cacheStats.memoryUsage}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Optimisations appliquées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.optimizationsApplied.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {metrics.optimizationsApplied.map((optimization: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {optimization.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune optimisation appliquée</p>
              )}
              
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-600">
                  Les optimisations sont appliquées automatiquement pour améliorer les performances
                  et réduire les coûts d'API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommandations de performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommandations de performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.cacheStats.hitRate < 60 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Taux de cache faible:</strong> Considérez augmenter la taille du cache 
                  ou ajuster les TTL pour améliorer les performances.
                </p>
              </div>
            )}
            
            {metrics.averageProcessingTime > 2000 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>⏱️ Temps de traitement élevé:</strong> Le traitement prend plus de 2s en moyenne. 
                  Vérifiez la charge système et les optimisations appliquées.
                </p>
              </div>
            )}
            
            {metrics.cacheStats.cacheSize / metrics.cacheStats.maxSize > 0.9 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📊 Cache presque plein:</strong> Le cache atteint sa capacité maximale. 
                  Des évictions fréquentes peuvent impacter les performances.
                </p>
              </div>
            )}
            
            {metrics.cacheStats.hitRate >= 80 && metrics.averageProcessingTime < 1000 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✅ Performances excellentes:</strong> Le système fonctionne de manière optimale 
                  avec un bon taux de cache et des temps de réponse rapides.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
