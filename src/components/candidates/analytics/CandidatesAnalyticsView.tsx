
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import AnalyticsKPIs from './AnalyticsKPIs';
import AnalyticsCharts from './AnalyticsCharts';

interface CandidatesAnalyticsViewProps {
  candidates: CandidateData[];
}

const CandidatesAnalyticsView: React.FC<CandidatesAnalyticsViewProps> = ({ candidates }) => {
  const [timeFilter, setTimeFilter] = useState('all');

  // Filter candidates based on time period
  const filteredCandidates = React.useMemo(() => {
    if (timeFilter === 'all') return candidates;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeFilter) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return candidates;
    }
    
    return candidates.filter(candidate => {
      const createdDate = new Date(candidate.created_at || '');
      return createdDate >= startDate;
    });
  }, [candidates, timeFilter]);

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Nom', 'Prénom', 'Email', 'Poste', 'Statut', 'Score', 'Expérience', 'Localisation'];
    const csvContent = [
      headers.join(','),
      ...filteredCandidates.map(candidate => [
        candidate.last_name || '',
        candidate.first_name || '',
        candidate.email || '',
        candidate.position || '',
        candidate.detailed_status || '',
        candidate.score || 0,
        candidate.years_experience || 0,
        candidate.location || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `candidats_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-dark dark:text-sand mb-2">
            Analytics des Candidats
          </h2>
          <p className="text-muted-foreground">
            Analysez les tendances et performances de votre base de candidats
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute période</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="3m">3 derniers mois</SelectItem>
              <SelectItem value="1y">Dernière année</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="gap-2 border-purple-200/50 hover:bg-purple-50"
          >
            <Download size={16} />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <AnalyticsKPIs candidates={filteredCandidates} />

      {/* Charts */}
      <AnalyticsCharts candidates={filteredCandidates} />

      {/* Summary */}
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-navy-dark dark:text-sand">Résumé de la période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-navy-dark dark:text-sand mb-2">Candidats analysés</h4>
              <p className="text-muted-foreground">
                {filteredCandidates.length} candidats sur {candidates.length} au total
              </p>
            </div>
            <div>
              <h4 className="font-medium text-navy-dark dark:text-sand mb-2">Période sélectionnée</h4>
              <p className="text-muted-foreground">
                {timeFilter === 'all' ? 'Toute la base de données' : 
                 timeFilter === '7d' ? '7 derniers jours' :
                 timeFilter === '30d' ? '30 derniers jours' :
                 timeFilter === '3m' ? '3 derniers mois' :
                 'Dernière année'}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-navy-dark dark:text-sand mb-2">Dernière mise à jour</h4>
              <p className="text-muted-foreground">
                {new Date().toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidatesAnalyticsView;
