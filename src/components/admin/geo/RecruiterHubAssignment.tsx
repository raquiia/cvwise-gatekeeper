import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, User, UserX, Users } from 'lucide-react';
import { useGeoData } from '@/hooks/useGeoData';

const RecruiterHubAssignment = () => {
  const { 
    countries,
    hubs,
    recruiters, 
    isLoadingRecruiters, 
    assignRecruiter, 
    removeRecruiter,
    isAssigningRecruiter 
  } = useGeoData();
  
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedHub, setSelectedHub] = useState<string>('');

  // Filter hubs by selected country
  const hubsForSelectedCountry = selectedCountry 
    ? hubs.filter(hub => hub.country_id === selectedCountry && hub.is_active)
    : [];

  // Reset hub selection when country changes
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedHub('');
  };

  const handleAssignRecruiter = (recruiterId: string, hubId: string) => {
    assignRecruiter({ recruiterId, hubId });
  };

  const handleRemoveRecruiter = (recruiterId: string) => {
    removeRecruiter(recruiterId);
  };

  const unassignedRecruiters = recruiters.filter(recruiter => !recruiter.hub_id);
  const assignedRecruiters = recruiters.filter(recruiter => recruiter.hub_id);

  // Group recruiters by hub and then by country
  const recruitersByHub = assignedRecruiters.reduce((acc, recruiter) => {
    const hubId = recruiter.hub_id!;
    if (!acc[hubId]) {
      acc[hubId] = [];
    }
    acc[hubId].push(recruiter);
    return acc;
  }, {} as Record<string, typeof recruiters>);

  // Group hubs by country for better organization
  const hubsByCountry = hubs.filter(hub => hub.is_active).reduce((acc, hub) => {
    const countryId = hub.country_id;
    if (!acc[countryId]) {
      acc[countryId] = [];
    }
    acc[countryId].push(hub);
    return acc;
  }, {} as Record<string, typeof hubs>);

  if (isLoadingRecruiters) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Affectation des Recruteurs</h3>
        <p className="text-sm text-muted-foreground">
          {assignedRecruiters.length} recruteurs assignés, {unassignedRecruiters.length} non assignés
        </p>
      </div>

      {/* Unassigned Recruiters */}
      {unassignedRecruiters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-orange-500" />
              Recruteurs Non Assignés
            </CardTitle>
            <CardDescription>
              Ces recruteurs ne sont pas encore affectés à un hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {unassignedRecruiters.map((recruiter) => (
                <div key={recruiter.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {recruiter.first_name?.[0]}{recruiter.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {recruiter.first_name} {recruiter.last_name}
                      </div>
                      {recruiter.company && (
                        <div className="text-sm text-muted-foreground">
                          {recruiter.company}
                        </div>
                      )}
                      {recruiter.is_admin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedCountry} 
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.filter(country => country.is_active).map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={selectedHub} 
                      onValueChange={setSelectedHub}
                      disabled={!selectedCountry}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder={selectedCountry ? "Sélectionner un hub" : "Sélectionner d'abord un pays"} />
                      </SelectTrigger>
                      <SelectContent>
                        {hubsForSelectedCountry.map((hub) => (
                          <SelectItem key={hub.id} value={hub.id}>
                            {hub.name} - {hub.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      onClick={() => {
                        if (selectedHub) {
                          handleAssignRecruiter(recruiter.id, selectedHub);
                          setSelectedCountry('');
                          setSelectedHub('');
                        }
                      }}
                      disabled={!selectedHub || !selectedCountry || isAssigningRecruiter}
                      size="sm"
                    >
                      Assigner
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Recruiters by Country and Hub */}
      <div className="space-y-8">
        {countries.filter(country => country.is_active).map((country) => {
          const countryHubs = hubsByCountry[country.id] || [];
          const countryRecruitersCount = countryHubs.reduce((total, hub) => 
            total + (recruitersByHub[hub.id] || []).length, 0);
          
          if (countryRecruitersCount === 0) return null;
          
          return (
            <div key={country.id} className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 rounded-sm border border-muted-foreground/30 bg-muted/20 flex items-center justify-center text-xs font-mono">
                    {country.code}
                  </div>
                  <h4 className="text-lg font-semibold">{country.name}</h4>
                </div>
                <Badge variant="secondary">
                  {countryRecruitersCount} recruteur{countryRecruitersCount !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {countryHubs.map((hub) => {
                  const hubRecruiters = recruitersByHub[hub.id] || [];
                  
                  return (
                    <Card key={hub.id} className="ml-4">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {hub.name} - {hub.city}
                          </div>
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {hubRecruiters.length} recruteur{hubRecruiters.length !== 1 ? 's' : ''}
                          </Badge>
                        </CardTitle>
                        {hub.address && (
                          <CardDescription>
                            {hub.address}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {hubRecruiters.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucun recruteur assigné</p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {hubRecruiters.map((recruiter) => (
                              <div key={recruiter.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {recruiter.first_name?.[0]}{recruiter.last_name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {recruiter.first_name} {recruiter.last_name}
                                    </div>
                                    {recruiter.company && (
                                      <div className="text-xs text-muted-foreground">
                                        {recruiter.company}
                                      </div>
                                    )}
                                  </div>
                                  {recruiter.is_admin && (
                                    <Badge variant="secondary" className="text-xs">
                                      Admin
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveRecruiter(recruiter.id)}
                                  disabled={isAssigningRecruiter}
                                >
                                  <UserX className="h-3 w-3 mr-1" />
                                  Retirer
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecruiterHubAssignment;