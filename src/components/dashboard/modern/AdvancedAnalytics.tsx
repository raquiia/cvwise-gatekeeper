
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface AdvancedAnalyticsProps {
  candidatesData: any[];
  educationData: any[];
  sectorData: any[];
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  educationData,
  sectorData
}) => {
  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30 dark:border-purple-800/20 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Analytics des Candidats
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Real Data Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Secteurs Chart */}
        <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
          <CardHeader>
            <CardTitle className="text-lg">Répartition par Secteur</CardTitle>
          </CardHeader>
          <CardContent>
            {sectorData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de secteur disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Éducation Chart */}
        <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-purple-200/30">
          <CardHeader>
            <CardTitle className="text-lg">Niveaux d'Éducation</CardTitle>
          </CardHeader>
          <CardContent>
            {educationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={educationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée d'éducation disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
