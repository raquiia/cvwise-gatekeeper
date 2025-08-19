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
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
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
  completedAt?: string;
  isCompleted?: boolean;
}

const MyDayWidget: React.FC<MyDayProps> = ({ candidatesData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bmTasks, setBmTasks] = useState<RecruiterTask[]>([]);
  const [urgentBMTasks, setUrgentBMTasks] = useState<RecruiterTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<RecruiterTask[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [hiddenGeneratedTasks, setHiddenGeneratedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      loadTasksForDate(currentDate);
      loadUrgentBMTasks();
    }
  }, [user?.id, currentDate]);

  const loadTasksForDate = async (date: Date) => {
    if (!user?.id) return;
    
    try {
      const [tasks, completed, completedBMTasks] = await Promise.all([
        recruiterTasksService.getTasksForDate(user.id, new Date(date)),
        recruiterTasksService.getCompletedTasksForDate(user.id, new Date(date)),
        isToday(date) ? recruiterTasksService.getCompletedBMTasksForToday(user.id) : Promise.resolve([])
      ]);
      setBmTasks(tasks);
      
      // Combiner les tâches complétées de la date ET les tâches BM complétées aujourd'hui
      const allCompletedTasks = [...completed];
      completedBMTasks.forEach(bmTask => {
        if (!completed.find(task => task.id === bmTask.id)) {
          allCompletedTasks.push(bmTask);
        }
      });
      
      setCompletedTasks(allCompletedTasks.sort((a, b) => 
        new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading tasks for date:', error);
    }
  };

  const loadUrgentBMTasks = async () => {
    if (!user?.id) return;
    
    try {
      const urgentTasks = await recruiterTasksService.getPendingBMTasks(user.id);
      setUrgentBMTasks(urgentTasks);
    } catch (error) {
      console.error('Error loading urgent BM tasks:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const generateDayItems = (candidates: any[] = []): DayItem[] => {
    const items: DayItem[] = [];

    // 1. PRIORITÉ ABSOLUE : Tâches BM urgentes (toutes les tâches bm_interview pending)
    urgentBMTasks.forEach(task => {
      const scheduledDate = new Date(task.scheduled_date);
      const isToday = scheduledDate.toDateString() === new Date().toDateString();
      const isFuture = scheduledDate > new Date();
      
      let status = 'URGENT - À programmer';
      let timeDisplay = 'À programmer';
      let description = task.description || '';
      
      if (isFuture) {
        timeDisplay = `Programmé ${scheduledDate.toLocaleDateString('fr-FR')}`;
        description = `${description}\n📅 Entretien prévu le ${scheduledDate.toLocaleDateString('fr-FR')} à ${scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (isToday) {
        timeDisplay = scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        status = 'Aujourd\'hui';
      }

      items.push({
        id: `urgent-bm-${task.id}`,
        type: 'task',
        interviewType: task.interview_type === 'ec1' ? 'ec1' : task.interview_type === 'ec2' ? 'ec2' : 'phone',
        title: `🔴 ${task.title}`,
        time: timeDisplay,
        description,
        priority: 'high',
        status,
        candidateId: task.candidate_id || undefined,
        taskId: task.id,
        isCompleted: false
      });
    });

    // 2. Tâches du jour sélectionné (inclure TOUTES les tâches, y compris terminées)
    const urgentBMTaskIds = urgentBMTasks.map(t => t.id);
    
    // Combiner les tâches en cours et terminées
    const allTasks = [...bmTasks, ...completedTasks];
    
    allTasks
      .filter(task => !urgentBMTaskIds.includes(task.id))
      .forEach(task => {
        const scheduledDate = new Date(task.scheduled_date);
        const selectedDate = new Date(currentDate);
        const isSameDay = scheduledDate.toDateString() === selectedDate.toDateString();
        const isBMTask = task.task_type === 'bm_interview';
        const isCompleted = task.status === 'completed';
        
        items.push({
          id: `${isCompleted ? 'completed' : 'bm'}-${task.id}`,
          type: isBMTask ? 'task' : 'interview',
          interviewType: task.interview_type === 'ec1' ? 'ec1' : task.interview_type === 'ec2' ? 'ec2' : 'phone',
          title: task.title,
          time: isSameDay ? 
            scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 
            scheduledDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          description: task.description || '',
          priority: task.priority as 'low' | 'medium' | 'high',
          status: isCompleted ? 'Terminé' : (task.status === 'pending' ? 'À faire' : task.status),
          candidateId: task.candidate_id || undefined,
          taskId: task.id,
          isCompleted: isCompleted
        });
      });

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Entretiens programmés (seulement si pas masqués)
    const interviewCandidates = candidates.filter(candidate => {
      const status = candidate.detailed_status || 'initial';
      return ['ec1', 'ec2', 'presentation_client'].includes(status);
    }).slice(0, 2);

    interviewCandidates.forEach((candidate, index) => {
      const itemId = `interview-${candidate.id}`;
      if (!hiddenGeneratedTasks.has(itemId)) {
        const times = ['09:00', '14:30'];
        items.push({
          id: itemId,
          type: 'interview',
          interviewType: 'ec1',
          title: `Entretien ${candidate.first_name} ${candidate.last_name}`,
          time: times[index] || '15:00',
          description: `${candidate.position || 'Poste non spécifié'}`,
          priority: 'medium',
          status: 'Programmé',
          candidateId: candidate.id
        });
      }
    });

    // Tâches de suivi (seulement si pas masquées)
    const candidatesNeedingFollowUp = candidates.filter(candidate => {
      const updatedAt = new Date(candidate.updated_at);
      const status = candidate.detailed_status || 'initial';
      return status === 'contact' && updatedAt < sevenDaysAgo;
    });

    if (candidatesNeedingFollowUp.length > 0 && !hiddenGeneratedTasks.has('task-followup')) {
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

    // Candidats à fort potentiel (seulement si pas masqués)
    const candidatesWithHighScore = candidates.filter(candidate => {
      const status = candidate.detailed_status || 'initial';
      return (candidate.ai_score || 0) > 80 && status === 'initial';
    });

    if (candidatesWithHighScore.length > 0 && !hiddenGeneratedTasks.has('task-highscore')) {
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

    return items.slice(0, 8);
  };

  const handleTaskAction = async (item: DayItem) => {
    if (item.candidateId) {
      navigate(`/candidates/${item.candidateId}`);
    }
  };

  const handleExportTask = async (item: DayItem) => {
    if (!item.taskId) return;
    
    // Chercher la tâche dans toutes les sources possibles
    let task = bmTasks.find(t => t.id === item.taskId);
    if (!task) {
      task = completedTasks.find(t => t.id === item.taskId);
    }
    if (!task) {
      // Chercher aussi dans les tâches urgentes pour les tâches BM
      task = urgentBMTasks.find(t => t.id === item.taskId);
    }
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
      loadTasksForDate(currentDate);
      loadUrgentBMTasks(); // Recharger aussi les tâches urgentes
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleReactivateTask = async (taskId: string) => {
    try {
      await recruiterTasksService.updateTaskStatus(taskId, 'pending');
      loadTasksForDate(currentDate);
      loadUrgentBMTasks(); // Recharger aussi les tâches urgentes
    } catch (error) {
      console.error('Error reactivating task:', error);
    }
  };

  const generateCompletedItems = (): DayItem[] => {
    return completedTasks.map(task => {
      const scheduledDate = new Date(task.scheduled_date);
      const isBMTask = task.task_type === 'bm_interview';
      
      return {
        id: `completed-${task.id}`,
        type: isBMTask ? 'task' : 'interview',
        interviewType: task.interview_type === 'ec1' ? 'ec1' : task.interview_type === 'ec2' ? 'ec2' : 'phone',
        title: task.title,
        time: scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        description: task.description || '',
        priority: task.priority as 'low' | 'medium' | 'high',
        status: 'Terminé',
        candidateId: task.candidate_id || undefined,
        taskId: task.id,
        completedAt: task.updated_at,
        isCompleted: true
      };
    });
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
  const completedItems = generateCompletedItems();
  const pendingItems = dayItems.filter(item => !item.isCompleted);
  const completedItemsFromDay = dayItems.filter(item => item.isCompleted);
  const todayInterviews = pendingItems.filter(item => item.type === 'interview');
  const urgentTasks = pendingItems.filter(item => item.type === 'task');
  const urgentAlerts = pendingItems.filter(item => item.type === 'alert');

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {isToday(currentDate) ? 'Ma journée' : 'Planning'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateDate('prev')}
              title="Jour précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {currentDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateDate('next')}
              title="Jour suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday(currentDate) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentDate(new Date())}
                title="Retour à aujourd'hui"
              >
                Aujourd'hui
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col space-y-4 h-full min-h-0">
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

        {/* Liste des éléments à faire - Inclut les tâches terminées */}
        <div className="space-y-2 flex-1 min-h-0">
          {dayItems.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune tâche programmée pour cette date</p>
            </div>
          )}
          {dayItems.length > 0 && (
            <div className="space-y-2 overflow-y-auto">
              {dayItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg transition-colors group ${
                    item.isCompleted 
                      ? 'opacity-60 bg-muted/30 hover:opacity-80' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      getItemIcon(item.type, item.interviewType)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium text-sm truncate ${
                        item.isCompleted ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {item.title}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {item.time}
                      </Badge>
                      {!item.isCompleted && (
                        <Badge variant={getPriorityColor(item.priority)} className="text-xs shrink-0">
                          {item.priority === 'high' ? 'Urgent' : item.priority === 'medium' ? 'Moyen' : 'Faible'}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <Badge 
                        variant={item.isCompleted ? 'default' : getStatusColor(item.status)} 
                        className={`text-xs ${item.isCompleted ? 'bg-green-100 text-green-700' : ''}`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.taskId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleExportTask(item)}
                        title="Exporter vers calendrier"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {item.candidateId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleTaskAction(item)}
                        title="Voir le profil"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    
                     {item.taskId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => item.isCompleted ? handleReactivateTask(item.taskId!) : handleCompleteTask(item.taskId!)}
                        title={item.isCompleted ? "Réactiver la tâche" : "Marquer comme terminé"}
                      >
                        {item.isCompleted ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>
                    ) : !item.isCompleted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setHiddenGeneratedTasks(prev => new Set(prev).add(item.id));
                        }}
                        title="Marquer comme terminé"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section tâches terminées - En bas et masquées par défaut */}
        {completedItems.length > 0 && (
          <div className="border-t pt-3 mt-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">Terminé aujourd'hui</h3>
                <Badge variant="outline" className="text-xs">
                  {completedItems.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="h-6 px-2 text-xs"
              >
                {showCompleted ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showCompleted ? 'Masquer' : 'Voir'}
              </Button>
            </div>
            
            {showCompleted && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {completedItems.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-2 border rounded-md bg-muted/20 opacity-60 hover:opacity-80 transition-opacity group text-sm"
                  >
                    <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-muted-foreground line-through truncate">
                        {item.title}
                      </span>
                      {item.completedAt && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({new Date(item.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.taskId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleExportTask(item)}
                          title="Exporter vers calendrier"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {item.candidateId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleTaskAction(item)}
                          title="Voir le profil"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {item.taskId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleReactivateTask(item.taskId!)}
                          title="Réactiver la tâche"
                        >
                          <Clock className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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