
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building, GraduationCap } from 'lucide-react';
import SectorPieChart from './SectorPieChart';
import EducationBarChart from './EducationBarChart';
import { ChartData } from './SectorPieChart';

interface ChartSectionsProps {
  loading: boolean;
  educationData: ChartData[];
  sectorData: ChartData[];
}

const ChartSections: React.FC<ChartSectionsProps> = ({
  loading,
  educationData,
  sectorData
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md">
        <CardHeader className="border-b border-purple-100/50 dark:border-purple-900/30">
          <div className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg font-semibold">Distribution par niveau d'études</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <EducationBarChart data={educationData} loading={loading} />
        </CardContent>
      </Card>
      
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md">
        <CardHeader className="border-b border-purple-100/50 dark:border-purple-900/30">
          <div className="flex items-center">
            <Building className="mr-2 h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg font-semibold">Distribution par secteur</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <SectorPieChart data={sectorData} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartSections;
