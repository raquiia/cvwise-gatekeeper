
import React from 'react';
import { UserCheck, Clock, FileText, TrendingUp, Users, Target } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
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
}

const RecruiterActivityStats: React.FC<RecruiterActivityStatsProps> = ({ 
  totalRecruiters,
  totalCandidates,
  candidatesInMission,
  recentActivity,
  averageConversionRate
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Performance de recrutement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mr-3">
                <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium">Recruteurs actifs</span>
            </div>
            <span className="font-semibold">{totalRecruiters}</span>
          </div>
          
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
              <span className="text-sm font-medium">Taux conversion</span>
              <span className={`font-semibold ${averageConversionRate >= 15 ? 'text-green-600' : averageConversionRate >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                {averageConversionRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecruiterActivityStats;
