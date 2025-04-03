
import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SystemActivity {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  icon: ReactNode;
}

interface SystemActivitiesProps {
  activities: SystemActivity[];
}

const SystemActivities: React.FC<SystemActivitiesProps> = ({ activities }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité système</CardTitle>
        <CardDescription>
          Journal des événements système récents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div className="mt-0.5">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {activity.icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-center border-t border-border/20 pt-4">
        <Button variant="outline" size="sm" className="w-full">
          Voir tout l'historique
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SystemActivities;
