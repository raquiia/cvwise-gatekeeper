
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap } from 'lucide-react';
import { ChartData } from './SectorPieChart';

interface EducationBarChartProps {
  data: ChartData[];
  loading: boolean;
}

const EducationBarChart: React.FC<EducationBarChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3 py-8">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <GraduationCap size={48} className="mb-2 opacity-30" />
        <p>Aucune donnée de niveau d'études disponible</p>
      </div>
    );
  }

  const getBarColor = (index: number) => {
    const colors = ['#8884d8', '#9c8edb', '#af97df', '#c3a1e2', '#d7aae6', '#eab4e9'];
    return colors[index % colors.length];
  };

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white/90 dark:bg-gray-800/90 p-2 rounded border shadow">
                  <p className="font-medium">{payload[0].payload.name}</p>
                  <p className="text-sm">
                    <span className="font-medium">{payload[0].value}</span> candidats
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default EducationBarChart;
