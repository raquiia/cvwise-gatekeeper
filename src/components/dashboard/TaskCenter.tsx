import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  User, 
  FileText,
  Bell,
  TrendingUp,
  Target,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateFormatter';
import { Link } from 'react-router-dom';

interface TaskItem {
  id: string;
  type: 'candidate' | 'interview' | 'alert';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  candidateId?: string;
  urgent?: boolean;
  action?: string;
}

interface TaskCenterProps {
  candidatesData: any[];
}

const TaskCenter: React.FC<TaskCenterProps> = ({ candidatesData }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    generateTasks();
  }, [candidatesData]);

  const generateTasks = () => {
    setLoading(true);
    const generatedTasks: TaskItem[] = [];

    // Tâches basées sur les candidats
    candidatesData.forEach(candidate => {
      const lastUpdated = new Date(candidate.updated_at || candidate.created_at);
      const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

      // Candidats sans activité depuis plus de 7 jours
      if (daysSinceUpdate > 7 && candidate.detailed_status === 'initial') {
        generatedTasks.push({
          id: `follow-${candidate.id}`,
          type: 'candidate',
          title: `Relancer ${candidate.first_name} ${candidate.last_name}`,
          description: `Aucune activité depuis ${daysSinceUpdate} jours`,
          priority: daysSinceUpdate > 14 ? 'high' : 'medium',
          candidateId: candidate.id,
          urgent: daysSinceUpdate > 14,
          action: 'Contacter'
        });
      }

      // Candidats avec score élevé mais statut initial
      if (candidate.ai_score && candidate.ai_score > 80 && candidate.detailed_status === 'initial') {
        generatedTasks.push({
          id: `priority-${candidate.id}`,
          type: 'candidate',
          title: `Candidat prioritaire: ${candidate.first_name} ${candidate.last_name}`,
          description: `Score IA: ${candidate.ai_score}% - Action requise`,
          priority: 'high',
          candidateId: candidate.id,
          urgent: true,
          action: 'Planifier entretien'
        });
      }

      // Candidats en attente d'entretien
      if (candidate.detailed_status === 'contact') {
        generatedTasks.push({
          id: `interview-${candidate.id}`,
          type: 'interview',
          title: `Planifier entretien avec ${candidate.first_name} ${candidate.last_name}`,
          description: 'Candidat contacté - Entretien à programmer',
          priority: 'medium',
          candidateId: candidate.id,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
          action: 'Programmer'
        });
      }
    });

    // Alertes système intelligentes
    const totalCandidates = candidatesData.length;
    const recentCandidates = candidatesData.filter(c => {
      const created = new Date(c.created_at);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created > sevenDaysAgo;
    }).length;

    if (recentCandidates === 0 && totalCandidates > 0) {
      generatedTasks.push({
        id: 'no-new-candidates',
        type: 'alert',
        title: 'Aucun nouveau candidat cette semaine',
        description: 'Considérez relancer vos campagnes de sourcing',
        priority: 'medium',
        urgent: false,
        action: 'Sourcer'
      });
    }

    const highScoreCandidates = candidatesData.filter(c => c.ai_score > 75).length;
    if (highScoreCandidates > 5) {
      generatedTasks.push({
        id: 'high-score-pool',
        type: 'alert',
        title: `${highScoreCandidates} candidats haute qualité disponibles`,
        description: 'Pool de talents exceptionnels à traiter en priorité',
        priority: 'high',
        urgent: true,
        action: 'Analyser'
      });
    }

    // Trier par priorité et urgence
    generatedTasks.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return 0;
    });

    setTasks(generatedTasks.slice(0, 8)); // Limiter à 8 tâches
    setLoading(false);
  };

  const getPriorityColor = (priority: string, urgent?: boolean) => {
    if (urgent) return 'from-red-500 to-orange-500';
    switch (priority) {
      case 'high': return 'from-orange-500 to-yellow-500';
      case 'medium': return 'from-blue-500 to-cyan-500';
      case 'low': return 'from-gray-400 to-gray-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'candidate': return User;
      case 'interview': return Calendar;
      case 'alert': return AlertTriangle;
      default: return Clock;
    }
  };

  const handleTaskAction = async (task: TaskItem) => {
    if (task.candidateId) {
      // Naviguer vers le candidat
      return;
    }
    
    // Marquer comme terminé (simulation)
    toast({
      title: "Tâche marquée comme terminée",
      description: task.title,
    });
    
    setTasks(tasks.filter(t => t.id !== task.id));
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Centre de tâches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card hover:shadow-2xl transition-all duration-300">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="icon-purple">
              <Target className="w-5 h-5 text-white" />
            </div>
            Centre de tâches
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {tasks.length} tâches
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">Excellent travail !</p>
            <p className="text-sm">Toutes les tâches sont à jour</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {tasks.map((task, index) => {
              const Icon = getTaskIcon(task.type);
              const priorityColor = getPriorityColor(task.priority, task.urgent);
              
              return (
                <div
                  key={task.id}
                  className={`p-4 border-b border-border/30 last:border-b-0 hover:bg-accent/30 transition-all duration-200 group ${
                    task.urgent ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône de priorité */}
                    <div className={`icon-container bg-gradient-to-br ${priorityColor} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm leading-tight mb-1">
                            {task.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {task.description}
                          </p>
                          
                          {/* Métadonnées */}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={task.urgent ? "destructive" : "secondary"}
                              className="text-xs px-2 py-0.5"
                            >
                              {task.urgent ? 'Urgent' : task.priority === 'high' ? 'Priorité haute' : 
                               task.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                            </Badge>
                            
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDate(task.dueDate.toISOString())}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {task.candidateId ? (
                            <Link to={`/candidates/${task.candidateId}`}>
                              <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
                                {task.action}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-xs"
                              onClick={() => handleTaskAction(task)}
                            >
                              {task.action || 'Traiter'}
                              <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Footer avec stats rapides */}
        {tasks.length > 0 && (
          <div className="border-t border-border/50 px-4 py-3 bg-accent/10">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  {tasks.filter(t => t.urgent).length} urgent
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  {tasks.filter(t => t.priority === 'high').length} priorité haute
                </span>
              </div>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                Voir tout
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCenter;