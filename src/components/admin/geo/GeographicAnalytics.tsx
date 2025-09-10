import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Building2, TrendingUp, Users, MapPin, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { recruitmentAnalyticsService, CountryKPI, HubKPI } from '@/services/analytics/recruitmentAnalyticsService';
import { useGeoData } from '@/hooks/useGeoData';
import CustomPeriodSelector from '@/components/admin/CustomPeriodSelector';

const GeographicAnalytics: React.FC = () => {
  const [countryKPIs, setCountryKPIs] = useState<CountryKPI[]>([]);
  const [hubKPIs, setHubKPIs] = useState<HubKPI[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'current_month' | 'last_month' | 'quarter' | 'custom'>('current_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const { countries } = useGeoData();

  useEffect(() => {
    loadCountryKPIs();
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    if (selectedCountryId && selectedCountryId !== 'all') {
      loadHubKPIs(selectedCountryId);
    } else {
      loadHubKPIs();
    }
  }, [selectedCountryId, period, customStartDate, customEndDate]);

  const loadCountryKPIs = async () => {
    try {
      setLoading(true);
      const data = await recruitmentAnalyticsService.getKPIsByCountry(period, customStartDate, customEndDate);
      setCountryKPIs(data);
    } catch (error) {
      console.error('Error loading country KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHubKPIs = async (countryId?: string) => {
    try {
      const data = await recruitmentAnalyticsService.getKPIsByHub(countryId, period, customStartDate, customEndDate);
      setHubKPIs(data);
    } catch (error) {
      console.error('Error loading hub KPIs:', error);
    }
  };

  const handlePeriodChange = (periodData: { type: 'preset' | 'custom', value: string, startDate?: Date, endDate?: Date }) => {
    if (periodData.type === 'custom' && periodData.startDate && periodData.endDate) {
      setPeriod('custom');
      setCustomStartDate(periodData.startDate);
      setCustomEndDate(periodData.endDate);
    } else {
      setPeriod(periodData.value as 'current_month' | 'last_month' | 'quarter');
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const getConversionColor = (rate: number): string => {
    if (rate >= 15) return 'text-emerald-600 dark:text-emerald-400';
    if (rate >= 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case 'current_month': return 'Ce mois';
      case 'last_month': return 'Mois dernier';
      case 'quarter': return 'Ce trimestre';
      case 'custom': return 'Période personnalisée';
      default: return period;
    }
  };

  const totalCountryCVs = countryKPIs.reduce((sum, country) => sum + country.totalCVs, 0);
  const totalCountryMissions = countryKPIs.reduce((sum, country) => sum + country.candidatesInMission, 0);
  const globalConversionRate = totalCountryCVs > 0 ? Math.round((totalCountryMissions / totalCountryCVs) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header avec sélecteur de période */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Géographiques</h2>
          <p className="text-muted-foreground">Performance par pays et hubs</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <CustomPeriodSelector
            onPeriodChange={handlePeriodChange}
            currentPeriod={period}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total CVs</p>
                <p className="text-2xl font-bold">{totalCountryCVs}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Mission</p>
                <p className="text-2xl font-bold">{totalCountryMissions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux Global</p>
                <p className={`text-2xl font-bold ${getConversionColor(globalConversionRate)}`}>
                  {globalConversionRate}%
                </p>
              </div>
              <ArrowUp className={`h-8 w-8 ${getConversionColor(globalConversionRate)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pays Actifs</p>
                <p className="text-2xl font-bold">{countryKPIs.length}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principal */}
      <Tabs defaultValue="countries" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Vue Pays
          </TabsTrigger>
          <TabsTrigger value="hubs" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Vue Hubs
          </TabsTrigger>
        </TabsList>

        {/* Vue par pays */}
        <TabsContent value="countries" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {countryKPIs.map((country) => (
              <Card key={country.countryId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="text-lg">{country.countryName}</span>
                    </div>
                    <Badge variant="outline">
                      {country.recruiterCount} recruteurs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{country.totalCVs}</p>
                      <p className="text-sm text-muted-foreground">Total CVs</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getConversionColor(country.conversionRate)}`}>
                        {country.conversionRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Conversion</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Préqualification</span>
                      <span className="font-medium">{country.candidatesInPrequalification}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>EC1</span>
                      <span className="font-medium">{country.candidatesInEC1}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>EC2</span>
                      <span className="font-medium">{country.candidatesInEC2}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Présentation</span>
                      <span className="font-medium">{country.candidatesInPresentation}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>En Mission</span>
                      <span className="text-emerald-600">{country.candidatesInMission}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vue par hubs */}
        <TabsContent value="hubs" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Filtrer par pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCountryId && selectedCountryId !== 'all' && (
              <Button variant="outline" onClick={() => setSelectedCountryId('all')}>
                Voir tous les hubs
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {hubKPIs.map((hub) => (
              <Card key={hub.hubId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div>
                        <span className="text-lg">{hub.hubName}</span>
                        <p className="text-sm text-muted-foreground font-normal">
                          {hub.hubCity}, {hub.countryName}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {hub.recruiterCount} recruteurs
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{hub.totalCVs}</p>
                      <p className="text-sm text-muted-foreground">Total CVs</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getConversionColor(hub.conversionRate)}`}>
                        {hub.conversionRate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Conversion</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Préqualification</span>
                      <span className="font-medium">{hub.candidatesInPrequalification}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>EC1</span>
                      <span className="font-medium">{hub.candidatesInEC1}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>EC2</span>
                      <span className="font-medium">{hub.candidatesInEC2}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Présentation</span>
                      <span className="font-medium">{hub.candidatesInPresentation}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>En Mission</span>
                      <span className="text-emerald-600">{hub.candidatesInMission}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeographicAnalytics;