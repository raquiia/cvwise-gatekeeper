
import React from 'react';
import { 
  UserCheck, MessageSquare, Settings, LogOut, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export interface RealUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  created_at: string;
  last_sign_in_at?: string;
  avatar_url?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    is_admin?: boolean;
    avatar_url?: string;
  }
}

interface ActiveUsersListProps {
  users: RealUser[];
  loading: boolean;
  currentUserId?: string;
  formatDate: (date?: string) => string;
}

const ActiveUsersList: React.FC<ActiveUsersListProps> = ({ 
  users, 
  loading, 
  currentUserId,
  formatDate
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-500" />
            Utilisateurs actifs
          </CardTitle>
          <Button variant="outline" size="sm">
            <div className="flex items-center gap-1">
              {loading ? "Chargement..." : `${users.length} utilisateurs`}
            </div>
          </Button>
        </div>
        <CardDescription>
          Utilisateurs enregistrés dans la base de données
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck size={24} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Utilisateur</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entreprise</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rôle</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Création</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Dernière connexion</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage src={user.profile?.avatar_url || user.avatar_url || undefined} />
                          <AvatarFallback className="bg-navy/10 text-navy-dark text-xs">
                            {user.profile?.first_name && user.profile?.last_name 
                              ? `${user.profile.first_name[0]}${user.profile.last_name[0]}`
                              : user.first_name && user.last_name
                                ? `${user.first_name[0]}${user.last_name[0]}`
                                : user.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-navy-dark flex items-center">
                            {user.profile?.first_name && user.profile?.last_name 
                              ? `${user.profile.first_name} ${user.profile.last_name}`
                              : user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : 'Utilisateur'}
                              {user.id === currentUserId && (
                                <Badge variant="outline" className="ml-2 text-xs">Vous</Badge>
                              )}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.profile?.company || user.company || '-'}</td>
                    <td className="p-3">
                      <Badge variant={user.profile?.is_admin ? "default" : "outline"} className={
                        user.profile?.is_admin 
                          ? "bg-navy text-sand" 
                          : "bg-blue-50 text-blue-700"
                      }>
                        {user.profile?.is_admin ? 'Admin' : 'Utilisateur'}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Jamais'}
                    </td>
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <MessageSquare size={14} className="mr-2" />
                            Contacter
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings size={14} className="mr-2" />
                            Modifier les droits
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <LogOut size={14} className="mr-2" />
                            Déconnecter
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveUsersList;
