
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CandidateData } from '@/services/data/candidateService';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';
import { ensureStringArray } from '@/utils/candidateUtils';

interface AnalyticsChartsProps {
  candidates: CandidateData[];
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ candidates }) => {
  // Status distribution data
  const statusDistribution = React.useMemo(() => {
    const statusCounts: Record<string, number> = {};
    
    Object.keys(CANDIDATE_STATUS_LABELS).forEach(status => {
      statusCounts[status] = 0;
    });
    
    candidates.forEach(candidate => {
      const status = candidate.detailed_status || 'initial';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: CANDIDATE_STATUS_LABELS[status] || status,
      value: count,
      status
    }));
  }, [candidates]);

  // Score distribution data
  const scoreDistribution = React.useMemo(() => {
    const ranges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 }
    ];
    
    return ranges.map(({ range, min, max }) => ({
      range,
      count: candidates.filter(c => {
        const score = c.score || 0;
        return score >= min && score <= max;
      }).length
    }));
  }, [candidates]);

  // Top skills data
  const topSkills = React.useMemo(() => {
    const skillCounts: Record<string, number> = {};
    
    candidates.forEach(candidate => {
      const skills = ensureStringArray(candidate.skills);
      skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    
    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
  }, [candidates]);

  // Experience distribution
  const experienceDistribution = React.useMemo(() => {
    const ranges = [
      { range: '0-2 ans', min: 0, max: 2 },
      { range: '3-5 ans', min: 3, max: 5 },
      { range: '6-10 ans', min: 6, max: 10 },
      { range: '11-15 ans', min: 11, max: 15 },
      { range: '15+ ans', min: 16, max: 100 }
    ];
    
    return ranges.map(({ range, min, max }) => ({
      range,
      count: candidates.filter(c => {
        const exp = c.years_experience || 0;
        return exp >= min && exp <= max;
      }).length
    }));
  }, [candidates]);

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#f97316'];

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'initial': '#6b7280',
      'contact': '#3b82f6',
      'prequalification': '#8b5cf6',
      'ec1': '#f59e0b',
      'ec2': '#f97316',
      'presentation_client': '#6366f1',
      'en_mission': '#10b981',
      'refus': '#ef4444',
      'ancien_employe': '#059669'
    };
    return colorMap[status] || '#6b7280';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Distribution */}
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-navy-dark dark:text-sand">Répartition par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-navy-dark dark:text-sand">Distribution des scores</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Skills */}
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-navy-dark dark:text-sand">Top 10 compétences</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSkills} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="skill" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Experience Distribution */}
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-navy-dark dark:text-sand">Répartition par expérience</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={experienceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
