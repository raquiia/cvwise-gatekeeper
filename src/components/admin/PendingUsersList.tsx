
import React from 'react';
import { Info, Mail, Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  registrationDate: string;
  avatar: string | null;
}

interface PendingUsersListProps {
  pendingUsers: PendingUser[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
}

const PendingUsersList: React.FC<PendingUsersListProps> = ({ 
  pendingUsers, 
  onApproveUser, 
  onRejectUser 
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            Utilisateurs en attente
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={16} className="text-muted-foreground ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Données fictives pour démonstration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
            {pendingUsers.length} demandes
          </Badge>
        </div>
        <CardDescription>
          Validez ou rejetez les demandes d'inscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className="bg-navy/10 text-navy-dark">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-navy-dark">{user.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail size={12} />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <Briefcase size={10} className="mr-1" />
                        {user.company}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    onClick={() => onApproveUser(user.id)}
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onRejectUser(user.id)}
                  >
                    <XCircle size={16} className="mr-1" />
                    Rejeter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingUsersList;
