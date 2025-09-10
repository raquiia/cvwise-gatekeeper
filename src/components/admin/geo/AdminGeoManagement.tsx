import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Building2, Users } from 'lucide-react';
import CountryManager from './CountryManager';
import HubManager from './HubManager';
import RecruiterHubAssignment from './RecruiterHubAssignment';

const AdminGeoManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Gestion Géographique
          </CardTitle>
          <CardDescription>
            Gérez les pays, hubs et affectations des recruteurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="countries" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="countries" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Pays
              </TabsTrigger>
              <TabsTrigger value="hubs" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hubs
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Affectations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="countries" className="space-y-4">
              <CountryManager />
            </TabsContent>

            <TabsContent value="hubs" className="space-y-4">
              <HubManager />
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <RecruiterHubAssignment />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGeoManagement;