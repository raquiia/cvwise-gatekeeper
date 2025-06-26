
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, TrendingUp, Target, Users, Award, Calendar, Info, AlertTriangle } from 'lucide-react';
import { RecruiterKPI } from '@/services/analytics/recruitmentAnalyticsService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RecruiterDetailedKPIProps {
  recruiter: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  kpi: RecruiterKPI;
  onBack: () => void;
}

const RecruiterDetailedKPI: React.FC<RecruiterDetailedKPIProps> = ({ 
  recruiter, 
  kpi, 
  onBack 
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'current_month': return 'Ce mois';
      case 'last_month': return 'Mois dernier';
      case 'quarter': return 'Ce trimestre';
      default: return 'Période';
    }
  };

  const globalConversion = Math.round((kpi.candidatesInMission / (kpi.totalCVs || 1)) * 100);

  // Vérifier si des ajustements ont été appliqués
  const hasAdjustments = kpi.adjustedNumbers?.adjustmentsApplied || false;
  const adjustmentDetails = kpi.adjustedNumbers?.adjustmentDetails || [];

  return (
    <div className="space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la vue globale
        </Button>
      </div>

      {/* Alert pour les ajustements si nécessaire */}
      {hasAdjustments && (
        <Alert className="border-orange-200 bg-orange-50/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Ajustements appliqués au pipeline :</strong>
            <br />
            Des candidats semblent avoir sauté des étapes. Les nombres ont été ajustés pour des calculs cohérents :
            <ul className="mt-2 ml-4 space-y-1">
              {adjustmentDetails.map((detail, index) => (
                <li key={index} className="text-sm">• {detail}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Alert explicatif */}
      <Alert className="border-blue-200 bg-blue-50/50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Taux de conversion expliqués :</strong>
          <br />• Préqual → EC1 : Pourcentage de candidats en préqualification qui passent en EC1
          <br />• EC1 → EC2 : Pourcentage de candidats EC1 qui passent en EC2
          <br />• EC2 → Présentation : Pourcentage de candidats EC2 qui passent en présentation client
          <br />• EC2 → Mission : Pourcentage de candidats EC2 qui arrivent directement en mission
          {hasAdjustments && (
            <>
              <br /><br />
              <strong>Note :</strong> Les taux ci-dessous sont calculés après ajustement automatique 
              pour assurer la cohérence du pipeline.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Profil du recruteur */}
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {getInitials(recruiter.name)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{recruiter.name}</CardTitle>
              <p className="text-muted-foreground">{recruiter.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Calendar className="w-3 h-3 mr-1" />
                  {getPeriodLabel(kpi.period)}
                </Badge>
                {hasAdjustments && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Pipeline ajusté
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-navy-dark dark:text-white mb-1">
              {kpi.totalCVs}
            </div>
            <div className="text-sm text-muted-foreground">CVs ajoutés</div>
          </CardContent>
        </Card>

        <Card className="border-green-200/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {kpi.candidatesInMission}
            </div>
            <div className="text-sm text-muted-foreground">En mission</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {globalConversion}%
            </div>
            <div className="text-sm text-muted-foreground">Conversion globale</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200/50 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {kpi.candidatesInEC2}
            </div>
            <div className="text-sm text-muted-foreground">Candidats EC2</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline détaillé */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline de candidats</CardTitle>
            {hasAdjustments && (
              <p className="text-sm text-muted-foreground">
                * Nombres affichés après ajustement automatique
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="font-medium">Préqualification</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-semibold">
                    {kpi.candidatesInPrequalification}
                  </Badge>
                  {hasAdjustments && kpi.adjustedNumbers && 
                   kpi.candidatesInPrequalification !== kpi.adjustedNumbers.originalPrequalification && (
                    <span className="text-xs text-muted-foreground">
                      (était {kpi.adjustedNumbers.originalPrequalification})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <span className="font-medium">Entretien Client 1 (EC1)</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-semibold">
                    {kpi.candidatesInEC1}
                  </Badge>
                  {hasAdjustments && kpi.adjustedNumbers && 
                   kpi.candidatesInEC1 !== kpi.adjustedNumbers.originalEC1 && (
                    <span className="text-xs text-muted-foreground">
                      (était {kpi.adjustedNumbers.originalEC1})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <span className="font-medium">Entretien Client 2 (EC2)</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-semibold">
                    {kpi.candidatesInEC2}
                  </Badge>
                  {hasAdjustments && kpi.adjustedNumbers && 
                   kpi.candidatesInEC2 !== kpi.adjustedNumbers.originalEC2 && (
                    <span className="text-xs text-muted-foreground">
                      (était {kpi.adjustedNumbers.originalEC2})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <span className="font-medium">Présentation client</span>
                <Badge variant="outline" className="font-semibold">
                  {kpi.candidatesInPresentation}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <span className="font-medium">En mission</span>
                <Badge className="bg-green-600 text-white font-semibold">
                  {kpi.candidatesInMission}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taux de conversion directs</CardTitle>
            {hasAdjustments && (
              <p className="text-sm text-muted-foreground">
                * Calculés après ajustement du pipeline
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Préqualification → EC1</span>
                  <div className="text-xs text-muted-foreground">
                    {kpi.candidatesInEC1} sur {kpi.candidatesInPrequalification} candidats
                  </div>
                </div>
                <Badge className={`${getConversionColor(kpi.conversionPrequalToEC1)} font-semibold`}>
                  {kpi.conversionPrequalToEC1}%
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">EC1 → EC2</span>
                  <div className="text-xs text-muted-foreground">
                    {kpi.candidatesInEC2} sur {kpi.candidatesInEC1} candidats
                  </div>
                </div>
                <Badge className={`${getConversionColor(kpi.conversionEC1ToEC2)} font-semibold`}>
                  {kpi.conversionEC1ToEC2}%
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">EC2 → Présentation</span>
                  <div className="text-xs text-muted-foreground">
                    {kpi.candidatesInPresentation} sur {kpi.candidatesInEC2} candidats
                  </div>
                </div>
                <Badge className={`${getConversionColor(kpi.conversionEC2ToPresentation)} font-semibold`}>
                  {kpi.conversionEC2ToPresentation}%
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium">EC2 → Mission</span>
                  <div className="text-xs text-muted-foreground">
                    {kpi.candidatesInMission} sur {kpi.candidatesInEC2} candidats
                  </div>
                </div>
                <Badge className={`${getConversionColor(kpi.conversionEC2ToMission)} font-semibold`}>
                  {kpi.conversionEC2ToMission}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecruiterDetailedKPI;
