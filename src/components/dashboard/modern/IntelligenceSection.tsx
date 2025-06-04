
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Lightbulb, Target, TrendingUp, Users, Zap, ArrowRight, Star } from 'lucide-react';

interface IntelligenceSectionProps {
  candidatesCount: number;
  topCandidatesCount: number;
}

const IntelligenceSection: React.FC<IntelligenceSectionProps> = ({
  candidatesCount,
  topCandidatesCount
}) => {
  const insights = [
    {
      type: 'prediction',
      title: 'Prédiction IA',
      message: `${Math.round(topCandidatesCount * 1.5)} nouveaux candidats excellents attendus ce mois`,
      confidence: 87,
      icon: Brain,
      color: 'from-purple-500 to-indigo-500',
      urgent: true
    },
    {
      type: 'recommendation',
      title: 'Recommandation',
      message: 'Relancer 12 candidats inactifs avec un score > 80%',
      confidence: 92,
      icon: Lightbulb,
      color: 'from-yellow-500 to-orange-500',
      urgent: false
    },
    {
      type: 'opportunity',
      title: 'Opportunité détectée',
      message: 'Pic de candidatures "React" attendu dans 3 jours',
      confidence: 78,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      urgent: false
    }
  ];

  const quickStats = [
    {
      label: 'Taux de conversion',
      value: `${Math.round((topCandidatesCount / candidatesCount) * 100)}%`,
      trend: '+5%',
      color: 'text-green-600'
    },
    {
      label: 'Score moyen IA',
      value: '73.2',
      trend: '+2.1',
      color: 'text-blue-600'
    },
    {
      label: 'Temps de traitement',
      value: '2.3min',
      trend: '-15s',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* AI Insights */}
      <Card className="lg:col-span-2 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30 dark:border-purple-800/20 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
              <Brain className="w-5 h-5 text-white" />
            </div>
            Intelligence Artificielle
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Nouveau
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div 
                key={index}
                className={`group p-4 rounded-xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                  insight.urgent 
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 dark:from-purple-900/20 dark:to-indigo-900/20 dark:border-purple-700/50' 
                    : 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${insight.color} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confiance
                        </Badge>
                        {insight.urgent && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.message}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            );
          })}
          
          <div className="pt-4 border-t border-purple-200/50 dark:border-purple-800/30">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Zap className="w-4 h-4 mr-2" />
              Voir toutes les recommandations IA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Performance Stats */}
      <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30 dark:border-purple-800/20 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <Target className="w-5 h-5 text-white" />
            </div>
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold">{stat.value}</p>
              </div>
              <Badge className={`${stat.color} bg-transparent border-current`}>
                {stat.trend}
              </Badge>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Score global</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-semibold">8.7/10</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Excellent performance ce mois</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligenceSection;
