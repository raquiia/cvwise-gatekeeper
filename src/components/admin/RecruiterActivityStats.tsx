
import React, { useState } from 'react';
import { UserCheck, Clock, FileText, TrendingUp, Users, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RecruiterActivityStatsProps {
  totalRecruiters: number;
  totalCandidates: number;
  candidatesInMission: number;
  recentActivity: number;
  averageConversionRate: number;
  averageConversionRates?: {
    prequalToEC1: number;
    ec1ToEC2: number;
    ec2ToPresentation: number;
    globalToMission: number;
  };
}

const RecruiterActivityStats: React.FC<RecruiterActivityStatsProps> = ({ 
  totalRecruiters,
  totalCandidates,
  candidatesInMission,
  recentActivity,
  averageConversionRate,
  averageConversionRates
}) => {
  const [showDetailedRates, setShowDetailedRates] = useState(false);

  const getConversionColor = (rate: number, thresholds: { good: number; warning: number }) => {
    if (rate >= thresholds.good) return 'text-green-600';
    if (rate >= thresholds.warning) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center mr-3">
            <FileText size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm font-medium">CV total traités</span>
        </div>
        <span className="font-semibold">{totalCandidates}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/60 flex items-center justify-center mr-3">
            <Target size={16} className="text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium">En mission</span>
        </div>
        <span className="font-semibold text-green-600">{candidatesInMission}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center mr-3">
            <Clock size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm font-medium">Activité 30j</span>
        </div>
        <span className="font-semibold">{recentActivity}</span>
      </div>
      
      <Separator className="dark:bg-border/10" />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Taux conversion global</span>
          <span className={`font-semibold ${averageConversionRate >= 15 ? 'text-green-600' : averageConversionRate >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
            {averageConversionRate.toFixed(1)}%
          </span>
        </div>
        
        {averageConversionRates && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-7 px-2"
              onClick={() => setShowDetailedRates(!showDetailedRates)}
            >
              <span>Détail par étape</span>
              {showDetailedRates ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Button>
            
            {showDetailedRates && (
              <div className="space-y-2 pt-2 border-t border-border/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Préqual → EC1</span>
                  <span className={`font-medium ${getConversionColor(averageConversionRates.prequalToEC1, { good: 50, warning: 30 })}`}>
                    {averageConversionRates.prequalToEC1.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">EC1 → EC2</span>
                  <span className={`font-medium ${getConversionColor(averageConversionRates.ec1ToEC2, { good: 60, warning: 40 })}`}>
                    {averageConversionRates.ec1ToEC2.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">EC2 → Présent./Mission</span>
                  <span className={`font-medium ${getConversionColor(averageConversionRates.ec2ToPresentation, { good: 70, warning: 50 })}`}>
                    {averageConversionRates.ec2ToPresentation.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecruiterActivityStats;
