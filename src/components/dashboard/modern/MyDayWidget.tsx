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

  // Génération des éléments de la journée basés sur les vraies données
  const generateDayItems = (): DayItem[] => {
    const items: DayItem[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Entretiens du jour - candidats en phase d'entretien
    const interviewCandidates = candidatesData.filter(candidate => 
      ['ec1', 'ec2', 'presentation_client'].includes(candidate.detailed_status)
    ).slice(0, 3);

    const interviews: DayItem[] = interviewCandidates.map((candidate, index) => {
      const times = ['09:00', '14:30', '16:00'];
      const types = ['video', 'onsite', 'phone'];
      const locations = ['Google Meet', 'Salle de réunion A', 'Appel téléphonique'];
      
      return {
        id: `int-${candidate.id}`,
        type: 'interview',
        title: `Entretien ${candidate.first_name} ${candidate.last_name}`,
        time: times[index] || '15:00',
        description: `${candidate.position} - ${candidate.detailed_status === 'ec1' ? 'Premier entretien' : candidate.detailed_status === 'ec2' ? 'Entretien technique' : 'Présentation client'}`,
        priority: candidate.detailed_status === 'presentation_client' ? 'high' : 'medium',
        status: 'pending',
        candidateId: candidate.id,
        interviewType: types[index % 3] as 'phone' | 'video' | 'onsite',
        location: locations[index % 3]
      };
    });

    // Tâches prioritaires - candidats nécessitant un suivi
    const candidatesNeedingFollowUp = candidatesData.filter(candidate => {
      const updatedAt = new Date(candidate.updated_at);
      return candidate.detailed_status === 'contact' && updatedAt < sevenDaysAgo;
    });

    const candidatesWithHighScore = candidatesData.filter(candidate => 
      candidate.ai_score > 80 && candidate.detailed_status === 'initial'
    );

    const tasks: DayItem[] = [];
    
    if (candidatesNeedingFollowUp.length > 0) {
      tasks.push({
        id: 'task-followup',
        type: 'task',
        title: `Relancer ${candidatesNeedingFollowUp.length} candidat${candidatesNeedingFollowUp.length > 1 ? 's' : ''}`,
        description: `Candidats sans réponse depuis plus de 7 jours`,
        priority: 'high',
        status: 'pending'
      });
    }

    if (candidatesWithHighScore.length > 0) {
      tasks.push({
        id: 'task-highscore',
        type: 'task',
        title: `Contacter ${candidatesWithHighScore.length} candidat${candidatesWithHighScore.length > 1 ? 's' : ''} prometteur${candidatesWithHighScore.length > 1 ? 's' : ''}`,
        description: `Score IA élevé (>80%) - action prioritaire`,
        priority: 'medium',
        status: 'pending'
      });
    }

    // Alertes urgentes basées sur les vraies données
    const alerts: DayItem[] = [];
    
    const topCandidate = candidatesData
      .filter(c => c.ai_score && c.detailed_status === 'initial')
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))[0];

    if (topCandidate && topCandidate.ai_score > 85) {
      alerts.push({
        id: `alert-top-${topCandidate.id}`,
        type: 'alert',
        title: 'Candidat très prometteur',
        description: `Score IA ${topCandidate.ai_score}% - ${topCandidate.first_name} ${topCandidate.last_name} (${topCandidate.position})`,
        priority: 'high',
        status: 'urgent',
        candidateId: topCandidate.id
      });
    }

    if (candidatesNeedingFollowUp.length > 2) {
      alerts.push({
        id: 'alert-delays',
        type: 'alert',
        title: 'Délais de réponse dépassés',
        description: `${candidatesNeedingFollowUp.length} candidats attendent une réponse depuis >7 jours`,
        priority: 'medium',
        status: 'urgent'
      });
    }

    return [...interviews, ...tasks, ...alerts].sort((a, b) => {
      // Priorité par type et urgence
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const dayItems = generateDayItems();
  const todayInterviews = dayItems.filter(item => item.type === 'interview');
  const urgentTasks = dayItems.filter(item => item.type === 'task');
  const urgentAlerts = dayItems.filter(item => item.type === 'alert');

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
            <div className="text-lg font-semibold text-destructive">{urgentAlerts.length}</div>
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