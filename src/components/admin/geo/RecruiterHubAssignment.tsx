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
    hubs,
    recruiters, 
    isLoadingRecruiters, 
    assignRecruiter, 
    removeRecruiter,
    isAssigningRecruiter 
  } = useGeoData();
  
  const [selectedHub, setSelectedHub] = useState<string>('');

  const handleAssignRecruiter = (recruiterId: string, hubId: string) => {
    assignRecruiter({ recruiterId, hubId });
  };

  const handleRemoveRecruiter = (recruiterId: string) => {
    removeRecruiter(recruiterId);
  };

  const unassignedRecruiters = recruiters.filter(recruiter => !recruiter.hub_id);
  const assignedRecruiters = recruiters.filter(recruiter => recruiter.hub_id);

  // Group recruiters by hub
  const recruitersByHub = assignedRecruiters.reduce((acc, recruiter) => {
    const hubId = recruiter.hub_id!;
    if (!acc[hubId]) {
      acc[hubId] = [];
    }
    acc[hubId].push(recruiter);
    return acc;
  }, {} as Record<string, typeof recruiters>);

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
                      value={selectedHub} 
                      onValueChange={setSelectedHub}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sélectionner un hub" />
                      </SelectTrigger>
                      <SelectContent>
                        {hubs.filter(hub => hub.is_active).map((hub) => (
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
                          setSelectedHub('');
                        }
                      }}
                      disabled={!selectedHub || isAssigningRecruiter}
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

      {/* Assigned Recruiters by Hub */}
      <div className="grid gap-6">
        {hubs.filter(hub => hub.is_active).map((hub) => {
          const hubRecruiters = recruitersByHub[hub.id] || [];
          
          return (
            <Card key={hub.id}>
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
                <CardDescription>
                  {hub.country?.name} ({hub.country?.code})
                  {hub.address && ` - ${hub.address}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hubRecruiters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun recruteur assigné à ce hub</p>
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
};

export default RecruiterHubAssignment;