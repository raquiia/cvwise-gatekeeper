import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarActionButton } from '@/components/ui/calendar-action-button';
import { 
  Calendar, 
  Users, 
  Phone, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Video,
  FileText,
  ExternalLink,
  Download
} from 'lucide-react';
import { recruiterTasksService, RecruiterTask } from '@/services/data/recruiterTasksService';
import { candidateNotesService } from '@/services/data/candidateNotesService';
import { ICSGeneratorService } from '@/services/calendar/icsGeneratorService';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MyDayProps {
  candidatesData?: any[];
}

interface DayItem {
  id: string;
  type: 'interview' | 'task' | 'alert';
  interviewType?: 'ec1' | 'ec2' | 'phone';
  title: string;
  time: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  candidateId?: string;
  taskId?: string;
}

const MyDayWidget: React.FC<MyDayProps> = ({ candidatesData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bmTasks, setBmTasks] = useState<RecruiterTask[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadBMTasks();
    }
  }, [user?.id]);

  const loadBMTasks = async () => {
    if (!user?.id) return;
    
    try {
      const tasks = await recruiterTasksService.getUrgentAndTodayTasks(user.id);
      setBmTasks(tasks);
    } catch (error) {
      console.error('Error loading BM tasks:', error);
    }
  };

  const generateDayItems = (candidates: any[] = []): DayItem[] => {
    const items: DayItem[] = [];

    // Ajouter les tâches BM d'abord (priorité haute)
    bmTasks.forEach(task => {
      const scheduledDate = new Date(task.scheduled_date);
      const today = new Date();
      const isToday = scheduledDate.toDateString() === today.toDateString();
      const isBMTask = task.task_type === 'bm_interview';
      
      // Déterminer le statut et la priorité
      let status = task.status === 'pending' ? 'À programmer' : task.status;
      let priority: 'low' | 'medium' | 'high' = task.priority as 'low' | 'medium' | 'high';
      
      // Si c'est une tâche BM urgente (à programmer), la marquer comme urgente
      if (isBMTask && task.status === 'pending') {
        status = 'URGENT - À programmer';
        priority = 'high';
      }

      items.push({
        id: `bm-${task.id}`,
        type: isBMTask ? 'task' : 'interview',
        interviewType: task.interview_type === 'ec1' ? 'ec1' : task.interview_type === 'ec2' ? 'ec2' : 'phone',
        title: task.title,
        time: isToday ? 
          scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 
          scheduledDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        description: isBMTask ? 
          `${task.description || ''}\nEntretien prévu le ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` :
          task.description || '',
        priority,
        status,
        candidateId: task.candidate_id || undefined,
        taskId: task.id
      });
    });

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Entretiens programmés
    const interviewCandidates = candidates.filter(candidate => {
      const status = candidate.detailed_status || 'initial';
      return ['ec1', 'ec2', 'presentation_client'].includes(status);
    }).slice(0, 2);

    interviewCandidates.forEach((candidate, index) => {
      const times = ['09:00', '14:30'];
      items.push({
        id: `interview-${candidate.id}`,
        type: 'interview',
        interviewType: 'ec1',
        title: `Entretien ${candidate.first_name} ${candidate.last_name}`,
        time: times[index] || '15:00',
        description: `${candidate.position || 'Poste non spécifié'}`,
        priority: 'medium',
        status: 'Programmé',
        candidateId: candidate.id
      });
    });

    // Tâches de suivi
    const candidatesNeedingFollowUp = candidates.filter(candidate => {
      const updatedAt = new Date(candidate.updated_at);
      const status = candidate.detailed_status || 'initial';
      return status === 'contact' && updatedAt < sevenDaysAgo;
    });

    if (candidatesNeedingFollowUp.length > 0) {
      items.push({
        id: 'task-followup',
        type: 'task',
        title: `Relancer ${candidatesNeedingFollowUp.length} candidat${candidatesNeedingFollowUp.length > 1 ? 's' : ''}`,
        time: '16:00',
        description: 'Candidats sans réponse depuis plus de 7 jours',
        priority: 'high',
        status: 'À faire'
      });
    }

    // Candidats à fort potentiel
    const candidatesWithHighScore = candidates.filter(candidate => {
      const status = candidate.detailed_status || 'initial';
      return (candidate.ai_score || 0) > 80 && status === 'initial';
    });

    if (candidatesWithHighScore.length > 0) {
      items.push({
        id: 'task-highscore',
        type: 'task',
        title: `Contacter ${candidatesWithHighScore.length} candidat${candidatesWithHighScore.length > 1 ? 's' : ''} prometteur${candidatesWithHighScore.length > 1 ? 's' : ''}`,
        time: '17:00',
        description: 'Score IA élevé (>80%) - action prioritaire',
        priority: 'medium',
        status: 'À faire'
      });
    }

    // Alertes urgentes
    const topCandidate = candidates
      .filter(c => (c.ai_score || 0) > 0 && (c.detailed_status || 'initial') === 'initial')
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))[0];

    if (topCandidate && (topCandidate.ai_score || 0) > 85) {
      items.push({
        id: `alert-top-${topCandidate.id}`,
        type: 'alert',
        title: 'Candidat très prometteur',
        time: 'Maintenant',
        description: `Score IA ${topCandidate.ai_score}% - ${topCandidate.first_name} ${topCandidate.last_name}`,
        priority: 'high',
        status: 'Urgent',
        candidateId: topCandidate.id
      });
    }

    // Données de démonstration si pas de données réelles
    if (items.length === 0) {
      return [
        {
          id: 'demo-interview',
          type: 'interview',
          interviewType: 'ec1',
          title: 'Entretien Marie Dubois',
          time: '14:30',
          description: 'Développeur Frontend - Premier entretien',
          priority: 'medium',
          status: 'Programmé'
        },
        {
          id: 'demo-task',
          type: 'task',
          title: 'Préparer les entretiens de demain',
          time: '16:00',
          description: 'Revoir les CV et préparer les questions techniques',
          priority: 'high',
          status: 'À faire'
        },
        {
          id: 'demo-alert',
          type: 'alert',
          title: 'Nouveau candidat prometteur',
          time: 'Maintenant',
          description: 'Score IA 92% - Jean Martin (Développeur Backend)',
          priority: 'high',
          status: 'Urgent'
        }
      ];
    }

    return items.slice(0, 8);
  };

  const handleTaskAction = async (item: DayItem) => {
    if (item.candidateId) {
      navigate(`/candidates/${item.candidateId}`);
    }
  };

  const handleExportTask = async (item: DayItem) => {
    if (!item.taskId) return;

    const task = bmTasks.find(t => t.id === item.taskId);
    if (!task) return;

    // Enrichir la description avec le lien vers le profil candidat
    let enrichedDescription = task.description || '';
    
    if (task.candidate_id) {
      const candidateProfileUrl = `${window.location.origin}/candidates/${task.candidate_id}`;
      enrichedDescription += `\n\n📋 Profil candidat: ${candidateProfileUrl}`;
      
      if (task.business_manager) {
        enrichedDescription += `\n👤 Business Manager: ${task.business_manager}`;
      }
      
      if (task.interview_type) {
        enrichedDescription += `\n📞 Type d'entretien: ${task.interview_type.toUpperCase()}`;
      }

      // Récupérer et ajouter les notes d'entretiens précédents
      try {
        const allNotes = await candidateNotesService.getNotesForCandidate(task.candidate_id);
        const previousNotes = getPreviousNotesForInterviewType(task.interview_type, allNotes);
        
        if (previousNotes.length > 0) {
          enrichedDescription += `\n\n📝 Notes d'entretiens précédents :\n`;
          
          previousNotes.forEach(note => {
            const noteDate = new Date(note.created_at).toLocaleDateString('fr-FR');
            const noteTypeLabel = {
              'precal': 'Pré-qualification',
              'ec1': 'Entretien 1er Tour',
              'ec2': 'Entretien 2ème Tour'
            }[note.note_type] || note.note_type;
            
            enrichedDescription += `\n--- ${noteTypeLabel} (${noteDate}) ---\n`;
            const content = note.enhanced_content || note.content;
            // Limiter la longueur pour éviter des descriptions trop longues
            const truncatedContent = content.length > 500 
              ? content.substring(0, 500) + '... (voir profil complet)'
              : content;
            enrichedDescription += `${truncatedContent}\n`;
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
      }
    }

    const event = ICSGeneratorService.createTaskEvent(
      task.title,
      enrichedDescription,
      task.priority === 'high' ? 'high' : 'medium',
      new Date(task.scheduled_date).getHours()
    );

    ICSGeneratorService.downloadICS(event, `entretien-${task.interview_type}-${new Date().getTime()}.ics`);
  };

  // Fonction helper pour récupérer les notes précédentes selon le type d'entretien
  const getPreviousNotesForInterviewType = (interviewType: string | undefined, allNotes: any[]) => {
    if (!interviewType) return [];
    
    const noteTypes: { [key: string]: string[] } = {
      'ec1': ['precal'],
      'ec2': ['precal', 'ec1']
    };
    
    const requiredTypes = noteTypes[interviewType.toLowerCase()] || [];
    return allNotes
      .filter(note => requiredTypes.includes(note.note_type))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await recruiterTasksService.updateTaskStatus(taskId, 'completed');
      loadBMTasks(); // Recharger les tâches
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getItemIcon = (type: string, interviewType?: string) => {
    if (type === 'interview') {
      if (interviewType === 'phone') return <Phone className="h-4 w-4" />;
      if (interviewType === 'ec1' || interviewType === 'ec2') return <Video className="h-4 w-4" />;
      return <Calendar className="h-4 w-4" />;
    }
    if (type === 'task') return <CheckCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getPriorityColor = (priority: string, urgent?: boolean) => {
    if (urgent) return 'destructive';
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'urgent': return 'destructive';
      case 'programmé': return 'default';
      case 'à programmer': return 'secondary';
      case 'à faire': return 'outline';
      default: return 'secondary';
    }
  };

  const dayItems = generateDayItems(candidatesData || []);
  const todayInterviews = dayItems.filter(item => item.type === 'interview');
  const urgentTasks = dayItems.filter(item => item.type === 'task');
  const urgentAlerts = dayItems.filter(item => item.type === 'alert');

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Ma journée
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleDateString('fr-FR', { 
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
          {dayItems.map((item) => (
            <div 
              key={item.id}
              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getItemIcon(item.type, item.interviewType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{item.title}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.time}
                  </Badge>
                  <Badge variant={getPriorityColor(item.priority)} className="text-xs shrink-0">
                    {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Moyen' : 'Faible'}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant={getStatusColor(item.status)} className="text-xs">
                    {item.status}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                {item.taskId && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExportTask(item)}
                      title="Exporter vers le calendrier"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {item.candidateId && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleTaskAction(item)}
                        title="Voir le profil candidat"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCompleteTask(item.taskId!)}
                      title="Marquer comme programmé"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {!item.taskId && (
                  <Button variant="ghost" size="sm">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
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

export default MyDayWidget;