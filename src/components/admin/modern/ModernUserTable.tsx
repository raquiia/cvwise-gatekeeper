
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  MoreHorizontal, 
  User, 
  Calendar, 
  Mail,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  Edit,
  UserX,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_sign_in_at?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    company?: string;
  };
  company?: string;
}

interface ModernUserTableProps {
  users: User[];
  loading: boolean;
  currentUserId?: string;
  formatDate: (date: string) => string;
  title: string;
  emptyMessage?: string;
}

const ModernUserTable: React.FC<ModernUserTableProps> = ({
  users,
  loading,
  currentUserId,
  formatDate,
  title,
  emptyMessage = "Aucun utilisateur trouvé"
}) => {
  const { toast } = useToast();

  const handleViewProfile = (user: User) => {
    toast({
      title: "Profil utilisateur",
      description: `Affichage du profil de ${user.profile?.first_name || user.first_name} ${user.profile?.last_name || user.last_name}`,
    });
  };

  const handleEditUser = (user: User) => {
    toast({
      title: "Modifier l'utilisateur",
      description: `Modification de ${user.profile?.first_name || user.first_name} ${user.profile?.last_name || user.last_name}`,
    });
  };

  const handleDeactivateUser = (user: User) => {
    toast({
      title: "Désactiver le compte",
      description: `Compte de ${user.profile?.first_name || user.first_name} ${user.profile?.last_name || user.last_name} désactivé`,
      variant: "destructive",
    });
  };

  const handleResetPassword = (user: User) => {
    toast({
      title: "Mot de passe réinitialisé",
      description: `Un email de réinitialisation a été envoyé à ${user.email}`,
    });
  };
  if (loading) {
    return (
      <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-navy/10 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/70 dark:bg-navy-dark/40 backdrop-blur-xl border border-navy/10 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Users className="w-5 h-5" />
            </div>
            {title}
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {users.length} membre{users.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground mb-2">{emptyMessage}</p>
            <p className="text-sm text-muted-foreground">Les utilisateurs apparaîtront ici une fois ajoutés.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const displayName = `${user.profile?.first_name || user.first_name || ''} ${user.profile?.last_name || user.last_name || ''}`.trim() || 'Utilisateur';
              const company = user.profile?.company || user.company || 'Non spécifiée';
              const isCurrentUser = user.id === currentUserId;
              
              return (
                <div 
                  key={user.id} 
                  className={`group p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-800/30' 
                      : 'bg-white/50 border-gray-200/50 hover:bg-white/80 dark:bg-navy-dark/20 dark:border-gray-700/30 dark:hover:bg-navy-dark/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-white/50 shadow-lg">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {user.last_sign_in_at && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Infos utilisateur */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy dark:text-white truncate">
                          {displayName}
                        </h3>
                        {isCurrentUser && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            Vous
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-4 h-4" />
                          <span className="truncate">{company}</span>
                        </div>
                      </div>
                    </div>

                    {/* Statut et dates */}
                    <div className="text-right space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {user.last_sign_in_at ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-700 dark:text-green-400">Actif</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-700 dark:text-orange-400">En attente</span>
                          </>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Inscrit {formatDate(user.created_at)}</span>
                        </div>
                        {user.last_sign_in_at && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Dernière connexion {formatDate(user.last_sign_in_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Réinitialiser mot de passe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeactivateUser(user)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Désactiver le compte
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModernUserTable;
