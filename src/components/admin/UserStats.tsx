
import React from 'react';
import { UserCheck, Clock, Building, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserStatsProps {
  activeUsersCount: number;
  pendingUsersCount: number;
  recentUsers: Array<{
    first_name?: string;
    last_name?: string;
    last_sign_in_at?: string;
  }>;
  formatDate: (date?: string) => string;
}

const UserStats: React.FC<UserStatsProps> = ({ 
  activeUsersCount,
  pendingUsersCount, 
  recentUsers,
  formatDate
}) => {
  // Calculate the number of companies (distinct company names)
  const companiesCount = 5; // This will be replaced with real data in the Admin page
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mr-3">
                <UserCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium">Active users</span>
            </div>
            <span className="font-semibold">{activeUsersCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center mr-3">
                <Clock size={16} className="text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-medium">Pending</span>
            </div>
            <span className="font-semibold">{pendingUsersCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center mr-3">
                <Building size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium">Companies</span>
            </div>
            <span className="font-semibold">{companiesCount}</span>
          </div>
          
          <Separator className="dark:bg-border/10" />
          
          <div>
            <h4 className="text-sm font-medium mb-2">Recent access</h4>
            <div className="space-y-2">
              {recentUsers.length > 0 ? (
                recentUsers.slice(0, 3).map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></div>
                      <span className="text-xs">
                        {user.first_name || ''} {user.last_name || ''}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {user.last_sign_in_at 
                        ? formatDate(user.last_sign_in_at) 
                        : 'Never connected'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">
                  No recent access
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStats;
