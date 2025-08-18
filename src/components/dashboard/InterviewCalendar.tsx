import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Video,
  Phone,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Interview {
  id: string;
  candidateName: string;
  candidateId: string;
  position: string;
  date: Date;
  time: string;
  duration: number; // en minutes
  type: 'video' | 'phone' | 'in-person';
  location?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface InterviewCalendarProps {
  candidatesData: any[];
}

const InterviewCalendar: React.FC<InterviewCalendarProps> = ({ candidatesData }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    // Générer des entretiens de démonstration basés sur les candidats
    generateMockInterviews();
  }, [candidatesData]);

  const generateMockInterviews = () => {
    const mockInterviews: Interview[] = [];
    
    // Prendre quelques candidats pour créer des entretiens fictifs
    const eligibleCandidates = candidatesData
      .filter(c => c.detailed_status === 'contact' || c.detailed_status === 'interview')
      .slice(0, 6);

    eligibleCandidates.forEach((candidate, index) => {
      const interviewDate = addDays(new Date(), Math.floor(Math.random() * 7) + 1);
      const hours = [9, 10, 11, 14, 15, 16, 17];
      const randomHour = hours[Math.floor(Math.random() * hours.length)];
      
      mockInterviews.push({
        id: `interview-${candidate.id}`,
        candidateName: `${candidate.first_name} ${candidate.last_name}`,
        candidateId: candidate.id,
        position: candidate.position || 'Poste non spécifié',
        date: interviewDate,
        time: `${randomHour}:${Math.random() > 0.5 ? '00' : '30'}`,
        duration: [30, 45, 60][Math.floor(Math.random() * 3)],
        type: ['video', 'phone', 'in-person'][Math.floor(Math.random() * 3)] as 'video' | 'phone' | 'in-person',
        location: Math.random() > 0.6 ? 'Salle de réunion A' : undefined,
        status: ['scheduled', 'confirmed'][Math.floor(Math.random() * 2)] as 'scheduled' | 'confirmed',
        notes: Math.random() > 0.7 ? 'Entretien technique prévu' : undefined
      });
    });

    setInterviews(mockInterviews);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getInterviewsForDay = (day: Date) => {
    return interviews.filter(interview => isSameDay(interview.date, day));
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'phone': return Phone;
      case 'in-person': return MapPin;
      default: return User;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const todayInterviews = interviews.filter(interview => isToday(interview.date));
  const thisWeekInterviews = interviews.filter(interview => {
    const weekEnd = addDays(weekStart, 6);
    return interview.date >= weekStart && interview.date <= weekEnd;
  });

  return (
    <Card className="glass-card">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="icon-blue">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            Calendrier des entretiens
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {thisWeekInterviews.length} cette semaine
            </Badge>
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="w-4 h-4 mr-1" />
              Planifier
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Navigation semaine */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="font-medium">
            {format(weekStart, 'dd MMM', { locale: fr })} - {format(addDays(weekStart, 6), 'dd MMM yyyy', { locale: fr })}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Entretiens d'aujourd'hui (priorité) */}
        {todayInterviews.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Aujourd'hui ({todayInterviews.length})
            </h4>
            <div className="space-y-2">
              {todayInterviews.map(interview => (
                <div key={interview.id} className="flex items-center gap-3 text-sm">
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    {interview.time}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {interview.candidateName}
                  </span>
                  <Badge className={`text-xs ${getStatusColor(interview.status)}`}>
                    {interview.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vue semaine */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(day => {
            const dayInterviews = getInterviewsForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                  isCurrentDay 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-accent/50'
                }`}
                onClick={() => setSelectedDay(day)}
              >
                <div className="text-center mb-1">
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>
                
                {dayInterviews.length > 0 && (
                  <div className="space-y-1">
                    {dayInterviews.slice(0, 2).map(interview => {
                      const TypeIcon = getInterviewTypeIcon(interview.type);
                      return (
                        <div
                          key={interview.id}
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs p-1 rounded flex items-center gap-1"
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span className="truncate">{interview.time}</span>
                        </div>
                      );
                    })}
                    {dayInterviews.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayInterviews.length - 2} autres
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Détails du jour sélectionné */}
        {selectedDay && (
          <div className="border-t border-border/50 pt-4">
            <h4 className="font-medium mb-3">
              {format(selectedDay, 'EEEE dd MMMM', { locale: fr })}
            </h4>
            
            {getInterviewsForDay(selectedDay).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Aucun entretien prévu ce jour
              </p>
            ) : (
              <div className="space-y-3">
                {getInterviewsForDay(selectedDay).map(interview => {
                  const TypeIcon = getInterviewTypeIcon(interview.type);
                  return (
                    <div
                      key={interview.id}
                      className="p-3 bg-accent/30 rounded-lg border border-border/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {interview.time} - {interview.candidateName}
                          </span>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Poste: {interview.position}</div>
                        <div>Durée: {interview.duration} min</div>
                        {interview.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {interview.location}
                          </div>
                        )}
                        {interview.notes && (
                          <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-2">
                            {interview.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats rapides */}
        <div className="border-t border-border/50 pt-4 mt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {thisWeekInterviews.length}
              </div>
              <div className="text-xs text-muted-foreground">Cette semaine</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {interviews.filter(i => i.status === 'confirmed').length}
              </div>
              <div className="text-xs text-muted-foreground">Confirmés</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {interviews.filter(i => i.status === 'scheduled').length}
              </div>
              <div className="text-xs text-muted-foreground">En attente</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewCalendar;