
import React from 'react';
import { UserPlus } from 'lucide-react';
import CreateUserForm from './CreateUserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UserManagement = () => {
  return (
    <Card className="dark:border-border/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus size={20} className="text-navy-dark" />
          Créer un nouvel utilisateur
        </CardTitle>
        <CardDescription>
          En tant qu'administrateur, vous pouvez créer des comptes pour d'autres utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateUserForm />
      </CardContent>
    </Card>
  );
};

export default UserManagement;
