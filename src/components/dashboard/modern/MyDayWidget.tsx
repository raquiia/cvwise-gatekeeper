import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  Phone,
  Video,
  MapPin
} from "lucide-react";

interface MyDayProps {
  candidatesData?: any[];
}

interface DayItem {
  id: string;
  type: 'interview' | 'task' | 'alert';
  title: string;
  time?: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'pending' | 'completed' | 'urgent';
  candidateId?: string;
  location?: string;
  interviewType?: 'phone' | 'video' | 'onsite';
}

export const MyDayWidget: React.FC<MyDayProps> = ({ candidatesData = [] }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Génération des éléments de la journée
  const generateDayItems = (): DayItem[] => {
    const items: DayItem[] = [];
    
    // Entretiens du jour
    const interviews: DayItem[] = [
      {
        id: 'int-1',
        type: 'interview',
        title: 'Entretien Sarah Martin',
        time: '09:00',
        description: 'Développeuse React Senior - Entretien technique',
        priority: 'high',
        status: 'pending',
        candidateId: 'sarah-martin',
        interviewType: 'video',
        location: 'Google Meet'
      },
      {
        id: 'int-2',
        type: 'interview',
        title: 'Entretien Kevin Dubois',
        time: '14:30',
        description: 'Product Manager - Entretien final',
        priority: 'high',
        status: 'pending',
        candidateId: 'kevin-dubois',
        interviewType: 'onsite',
        location: 'Salle de réunion A'
      },
      {
        id: 'int-3',
        type: 'interview',
        title: 'Entretien Marie Rousseau',
        time: '16:00',
        description: 'UX Designer - Premier entretien',
        priority: 'medium',
        status: 'pending',
        candidateId: 'marie-rousseau',
        interviewType: 'phone',
        location: 'Appel téléphonique'
      }
    ];

    // Tâches prioritaires
    const tasks: DayItem[] = [
      {
        id: 'task-1',
        type: 'task',
        title: 'Relancer 3 candidats',
        description: 'Candidats sans réponse depuis 5 jours',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'task-2',
        type: 'task',
        title: 'Finaliser offre Tech Lead',
        description: 'Validation finale avec le manager',
        priority: 'medium',
        status: 'pending'
      }
    ];

    // Alertes urgentes
    const alerts: DayItem[] = [
      {
        id: 'alert-1',
        type: 'alert',
        title: 'Candidat très prometteur',
        description: 'Score IA 95% - Alexandre Petit disponible immédiatement',
        priority: 'high',
        status: 'urgent',
        candidateId: 'alexandre-petit'
      },
      {
        id: 'alert-2',
        type: 'alert',
        title: 'Délai de réponse dépassé',
        description: '2 candidats attendent une réponse depuis 7 jours',
        priority: 'medium',
        status: 'urgent'
      }
    ];

    return [...interviews, ...tasks, ...alerts].sort((a, b) => {
      // Priorité par type et urgence
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const dayItems = generateDayItems();
  const todayInterviews = dayItems.filter(item => item.type === 'interview');
  const urgentTasks = dayItems.filter(item => item.type === 'task' || item.type === 'alert');

  const getItemIcon = (item: DayItem) => {
    if (item.type === 'interview') {
      switch (item.interviewType) {
        case 'video': return <Video className="h-4 w-4" />;
        case 'phone': return <Phone className="h-4 w-4" />;
        case 'onsite': return <MapPin className="h-4 w-4" />;
        default: return <Calendar className="h-4 w-4" />;
      }
    }
    if (item.type === 'task') return <CheckCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'urgent': return 'destructive';
      case 'completed': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Ma journée
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {today.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Résumé rapide */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{todayInterviews.length}</div>
            <div className="text-xs text-muted-foreground">Entretiens</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-warning">{urgentTasks.length}</div>
            <div className="text-xs text-muted-foreground">Tâches</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-destructive">2</div>
            <div className="text-xs text-muted-foreground">Urgences</div>
          </div>
        </div>

        {/* Liste des éléments prioritaires */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {dayItems.slice(0, 6).map((item) => (
            <div 
              key={item.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getItemIcon(item)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{item.title}</span>
                  {item.time && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {item.time}
                    </Badge>
                  )}
                  <Badge variant={getPriorityColor(item.priority)} className="text-xs shrink-0">
                    {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Moyen' : 'Faible'}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                
                {item.location && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </p>
                )}
              </div>
              
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="h-4 w-4 mr-1" />
            Planning
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Users className="h-4 w-4 mr-1" />
            Candidats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};