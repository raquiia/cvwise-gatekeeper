
/**
 * Dashboard de monitoring du matching intelligent
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  BarChart3,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { matchingOptimizationService, type OptimizationReport, type MatchingAnalytics } from '@/services/matching/matchingOptimizationService';
import { intelligentCache } from '@/services/cache/intelligentCacheService';

const IntelligentMatchingDashboard: React.FC = () => {
  const [optimizationReport, setOptimizationReport] = useState<OptimizationReport | null>(null);
  const [analytics, setAnalytics] = useState<MatchingAnalytics | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [report, analyticsData] = await Promise.all([
        matchingOptimizationService.generateOptimizationReport(),
        matchingOptimizationService.collectMatchingAnalytics()
      ]);
      
      setOptimizationReport(report);
      setAnalytics(analyticsData);
      setCacheStats(intelligentCache.getStats());
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeCache = async () => {
    setIsLoading(true);
    try {
      await matchingOptimizationService.autoOptimizeCache();
      await loadDashboardData();
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportMetrics = async () => {
    try {
      const metrics = await matchingOptimizationService.exportMetrics();
      const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matching-metrics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  if (isLoading && !optimizationReport) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Chargement du dashboard intelligent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Dashboard Matching Intelligent
          </h2>
          <p className="text-muted-foreground">
            Monitoring et optimisation en temps réel
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMetrics}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          
          <Button
            size="sm"
            onClick={handleOptimizeCache}
            disabled={isLoading}
          >
            <Settings className="w-4 h-4 mr-2" />
            Optimiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      {optimizationReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficacité Cache</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{optimizationReport.cacheEfficiency}%</div>
              <Progress value={optimizationReport.cacheEfficiency} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Taux de hits du cache
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Réduction Coûts</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{optimizationReport.costReduction}%</div>
              <Progress value={optimizationReport.costReduction} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Économies réalisées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gain Performance</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{optimizationReport.performanceGain}%</div>
              <Progress value={optimizationReport.performanceGain} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Amélioration vitesse
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Précision</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{optimizationReport.accuracyScore}%</div>
              <Progress value={optimizationReport.accuracyScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Qualité des matches
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contenu détaillé */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {optimizationReport && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendances Quotidiennes</CardTitle>
                  <CardDescription>Performance sur les dernières 24h</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Hits</span>
                    <Badge variant="secondary">
                      {optimizationReport.trends.dailyCacheHits}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Temps de traitement</span>
                    <Badge variant="secondary">
                      {optimizationReport.trends.dailyProcessingTime}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Économies</span>
                    <Badge variant="secondary">
                      €{optimizationReport.trends.dailyCostSavings}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statut du Système</CardTitle>
                  <CardDescription>État actuel des composants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Moteur de Matching</span>
                    <Badge className="bg-green-100 text-green-800">Actif</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Intelligent</span>
                    <Badge className="bg-green-100 text-green-800">Optimal</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Algorithmes Adaptatifs</span>
                    <Badge className="bg-green-100 text-green-800">Fonctionnel</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution par Type de Poste</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.jobTypeDistribution).map(([type, percentage]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{type}</span>
                          <span>{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribution par Séniorité</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.seniorityDistribution).map(([level, percentage]) => (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{level}</span>
                          <span>{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compétences Performantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topPerformingSkills.map((skill, index) => (
                      <Badge key={skill} variant="secondary">
                        #{index + 1} {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Critères à Améliorer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.lowPerformingCriteria.map((criteria) => (
                      <div key={criteria} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600">
                          {criteria}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {optimizationReport && (
            <Card>
              <CardHeader>
                <CardTitle>Recommandations d'Optimisation</CardTitle>
                <CardDescription>Actions suggérées pour améliorer les performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationReport.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                        <TrendingUp className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          {cacheStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques du Cache</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hits</p>
                      <p className="text-2xl font-bold text-green-600">{cacheStats.hits}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Misses</p>
                      <p className="text-2xl font-bold text-red-600">{cacheStats.misses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taille</p>
                      <p className="text-2xl font-bold">{cacheStats.cacheSize}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mémoire</p>
                      <p className="text-2xl font-bold">{cacheStats.memoryUsage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Efficacité du Cache</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Taux de Hit</span>
                        <span className="text-sm font-medium">{cacheStats.hitRate}%</span>
                      </div>
                      <Progress value={cacheStats.hitRate} className="h-3" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Utilisation</span>
                        <span className="text-sm font-medium">
                          {Math.round((cacheStats.cacheSize / cacheStats.maxSize) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(cacheStats.cacheSize / cacheStats.maxSize) * 100} 
                        className="h-3" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentMatchingDashboard;
