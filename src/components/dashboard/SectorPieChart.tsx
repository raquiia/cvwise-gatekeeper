
import React, { useState } from 'react';
import { PieChart, Pie, Sector, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Building } from 'lucide-react';

export interface ChartData {
  name: string;
  value: number;
}

interface SectorPieChartProps {
  data: ChartData[];
  loading: boolean;
}

const SectorPieChart: React.FC<SectorPieChartProps> = ({ data, loading }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

    // Ensure percent is a number to avoid type errors
    const percentValue: number = typeof percent === 'number' ? percent : 0;

    return (
      <g>
        <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#888" className="text-xs">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-lg font-semibold">
          {value}
        </text>
        <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#888" className="text-xs">
          {`${(percentValue * 100).toFixed(0)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.3}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Building size={48} className="mb-2 opacity-30" />
        <p>Aucune donnée de secteur disponible</p>
      </div>
    );
  }

  const COLORS = ['#8884d8', '#9c8edb', '#af97df', '#c3a1e2', '#d7aae6', '#eab4e9'];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onMouseEnter={onPieEnter}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SectorPieChart;
