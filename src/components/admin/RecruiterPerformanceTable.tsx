
import React from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, FileText, Info
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

export interface RecruiterPerformance {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  totalCandidates: number;
  candidatesInMission: number;
  recentActivity: number;
  conversionRate: number;
  pipelineValue: number;
  lastActivity: string;
  status: 'excellent' | 'good' | 'warning' | 'inactive';
  // New conversion rates
  conversionRates: {
    prequalToEC1: number;
    ec1ToEC2: number;
    ec2ToPresentation: number;
    globalToMission: number;
  };
  pipelineCounts: {
    prequalification: number;
    ec1: number;
    ec2: number;
    presentation: number;
    mission: number;
  };
}

interface RecruiterPerformanceTableProps {
  recruiters: RecruiterPerformance[];
  loading: boolean;
  formatDate: (date?: string) => string;
}

const RecruiterPerformanceTable: React.FC<RecruiterPerformanceTableProps> = ({ 
  recruiters, 
  loading, 
  formatDate
}) => {
  const navigate = useNavigate();

  const handleRowClick = (recruiterId: string) => {
    navigate(`/admin/recruiter/${recruiterId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'good':
        return <TrendingUp size={16} className="text-blue-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'inactive':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Users size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-amber-500';
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const ConversionRatesTooltip = ({ rates, counts }: { rates: RecruiterPerformance['conversionRates'], counts: RecruiterPerformance['pipelineCounts'] }) => (
    <div className="space-y-2 text-xs">
      <div className="font-semibold text-foreground">Détail des conversions :</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Préqual → EC1:</span>
          <span className={`font-medium ${rates.prequalToEC1 >= 50 ? 'text-green-600' : rates.prequalToEC1 >= 30 ? 'text-amber-600' : 'text-red-600'}`}>
            {rates.prequalToEC1.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>EC1 → EC2:</span>
          <span className={`font-medium ${rates.ec1ToEC2 >= 60 ? 'text-green-600' : rates.ec1ToEC2 >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
            {rates.ec1ToEC2.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>EC2 → Présent./Mission:</span>
          <span className={`font-medium ${rates.ec2ToPresentation >= 70 ? 'text-green-600' : rates.ec2ToPresentation >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {rates.ec2ToPresentation.toFixed(1)}%
          </span>
        </div>
        <div className="border-t pt-1 mt-1">
          <div className="flex justify-between">
            <span>Global → Mission:</span>
            <span className={`font-medium ${rates.globalToMission >= 15 ? 'text-green-600' : rates.globalToMission >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
              {rates.globalToMission.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="border-t pt-1 mt-2">
        <div className="font-semibold text-foreground mb-1">Pipeline :</div>
        <div className="text-xs space-y-0.5">
          <div>Préqual: {counts.prequalification}, EC1: {counts.ec1}, EC2: {counts.ec2}</div>
          <div>Présent: {counts.presentation}, Mission: {counts.mission}</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Performance des recruteurs
          </CardTitle>
          <Badge variant="outline">
            {loading ? "Chargement..." : `${recruiters.length} recruteurs`}
          </Badge>
        </div>
        <CardDescription>
          Suivi de l'activité et des performances de chaque recruteur. Cliquez sur une ligne pour voir les détails.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : recruiters.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Aucun recruteur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Recruteur</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">CV Total</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">En mission</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Conversion</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Activité 30j</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Dernière activité</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Performance</th>
                </tr>
              </thead>
              <tbody>
                <TooltipProvider>
                  {recruiters.map((recruiter) => (
                    <tr 
                      key={recruiter.id} 
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(recruiter.id)}
                    >
                      <td className="p-3">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={recruiter.avatar_url} />
                            <AvatarFallback className="bg-navy/10 text-navy-dark text-xs">
                              {recruiter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-navy-dark">
                              {recruiter.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{recruiter.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-blue-500" />
                          <span className="font-medium">{recruiter.totalCandidates}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          {recruiter.candidatesInMission}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.min(recruiter.conversionRate, 100)} 
                            className="w-12 h-2" 
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <span className={`text-sm font-medium ${
                                  recruiter.conversionRate >= 15 ? 'text-green-600' : 
                                  recruiter.conversionRate >= 10 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {recruiter.conversionRate.toFixed(1)}%
                                </span>
                                <Info size={12} className="text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <ConversionRatesTooltip 
                                rates={recruiter.conversionRates} 
                                counts={recruiter.pipelineCounts}
                              />
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{recruiter.recentActivity}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(recruiter.lastActivity)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(recruiter.status)}
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(recruiter.status)}`}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </TooltipProvider>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecruiterPerformanceTable;
