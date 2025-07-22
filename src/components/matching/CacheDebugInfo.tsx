
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { intelligentCache } from '@/services/cache/intelligentCacheService';
import { RefreshCw, Trash2, Info, Zap } from 'lucide-react';

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  cacheSize: number;
  maxSize: number;
  memoryUsage: string;
  entriesDetails: Array<{key: string, age: number, hits: number}>;
}

const CacheDebugInfo = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const refreshStats = () => {
    const currentStats = intelligentCache.getStats();
    setStats(currentStats);
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    intelligentCache.clear();
    refreshStats();
  };

  const handleClearJobMatches = () => {
    const cleared = intelligentCache.clearJobMatchCache();
    console.log(`Cleared ${cleared} job match entries`);
    refreshStats();
  };

  if (!isVisible) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsVisible(true)}
        className="text-xs text-gray-500"
      >
        <Info className="h-3 w-3 mr-1" />
        Cache Info
      </Button>
    );
  }

  if (!stats) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Chargement des statistiques de cache...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hitRateColor = stats.hitRate >= 70 ? 'bg-green-100 text-green-800' : 
                     stats.hitRate >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                     'bg-red-100 text-red-800';

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Cache Intelligent - Debug Info
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshStats}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Actualiser
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ✕
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.hits}</div>
            <div className="text-xs text-gray-500">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{stats.misses}</div>
            <div className="text-xs text-gray-500">Cache Misses</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.cacheSize}</div>
            <div className="text-xs text-gray-500">Entrées actives</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{stats.memoryUsage}</div>
            <div className="text-xs text-gray-500">Mémoire utilisée</div>
          </div>
        </div>

        {/* Taux de hit */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Taux de succès du cache :</span>
          <Badge className={hitRateColor}>
            {stats.hitRate.toFixed(1)}%
          </Badge>
        </div>

        {/* Progression */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Capacité du cache</span>
            <span>{stats.cacheSize} / {stats.maxSize}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(stats.cacheSize / stats.maxSize) * 100}%` }}
            />
          </div>
        </div>

        {/* Entrées récentes */}
        {stats.entriesDetails && stats.entriesDetails.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Entrées en cache (5 plus récentes) :</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {stats.entriesDetails.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex justify-between text-xs bg-gray-50 p-2 rounded">
                  <span className="font-mono truncate">{entry.key}</span>
                  <div className="flex gap-2 text-gray-500">
                    <span>{entry.age}min</span>
                    <span>{entry.hits} hits</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions de nettoyage */}
        <div className="flex gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearJobMatches}
            className="flex-1"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Vider cache matching
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearCache}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Vider tout le cache
          </Button>
        </div>

        {/* Recommandations */}
        {stats.hitRate < 40 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              ⚠️ <strong>Faible efficacité du cache ({stats.hitRate.toFixed(1)}%)</strong>
              <br />
              Considérez d'augmenter le TTL ou de pré-charger les données fréquemment utilisées.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CacheDebugInfo;
