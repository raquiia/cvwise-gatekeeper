
import React from 'react';
import { 
  UserCheck, MoreHorizontal, FileQuestion, MessageSquare, 
  Settings, LogOut, ArrowUpRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ExampleUser {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  lastLogin: string;
  status: string;
  avatar: string | null;
}

interface ExampleUsersListProps {
  users: ExampleUser[];
}

const ExampleUsersList: React.FC<ExampleUsersListProps> = ({ users }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-500" />
            Exemples d'utilisateurs
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FileQuestion size={16} className="text-muted-foreground ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Données fictives pour démonstration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Link to="/admin/users">
            <Button variant="outline" size="sm">
              <div className="flex items-center gap-1">
                Voir tous
                <ArrowUpRight size={14} />
              </div>
            </Button>
          </Link>
        </div>
        <CardDescription>
          Exemples d'utilisateurs (données fictives)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Utilisateur</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entreprise</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rôle</th>
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
                        <AvatarFallback className="bg-navy/10 text-navy-dark text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-navy-dark flex items-center">
                          {user.name}
                          {user.status === 'online' && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{user.company}</td>
                  <td className="p-3">
                    <Badge variant={user.role === 'Administrateur' ? 'default' : 'outline'} className={
                      user.role === 'Administrateur' 
                        ? 'bg-navy text-sand' 
                        : 'bg-blue-50 text-blue-700'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {user.lastLogin}
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
      </CardContent>
    </Card>
  );
};

export default ExampleUsersList;
