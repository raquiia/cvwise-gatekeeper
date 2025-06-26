
import React from 'react';
import { UserPlus, Users, Shield, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ModernCreateUserForm from './ModernCreateUserForm';

interface ModernUserManagementProps {
  activeUsersCount?: number;
}

const ModernUserManagement: React.FC<ModernUserManagementProps> = ({ activeUsersCount = 0 }) => {
  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-dark to-purple-900 opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold/5 to-transparent" />
        
        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Nouveau Recruteur
                </h1>
                <p className="text-white/70">
                  Ajoutez un membre à votre équipe de recrutement
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 text-white mb-1">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold">{activeUsersCount}</span>
                </div>
                <p className="text-white/60 text-sm">Membres actifs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-navy/10 shadow-xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <Shield className="w-5 h-5" />
                </div>
                Informations du nouveau membre
              </CardTitle>
              <CardDescription className="mt-2">
                Remplissez les informations ci-dessous pour créer un nouveau compte recruteur
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Building className="w-4 h-4 mr-1" />
              Nouveau membre
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <ModernCreateUserForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernUserManagement;
