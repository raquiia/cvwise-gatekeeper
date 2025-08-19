/**
 * Service de génération de fichiers ICS pour l'intégration calendrier
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  organizer?: string;
  attendees?: string[];
  type?: 'interview' | 'task' | 'reminder' | 'alert';
  priority?: 'high' | 'medium' | 'low';
}

export class ICSGeneratorService {
  private static formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private static generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@claire-recruitment.app`;
  }

  private static escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  static generateICS(event: CalendarEvent): string {
    const now = new Date();
    const startDate = event.startDate;
    const endDate = event.endDate || new Date(startDate.getTime() + 60 * 60 * 1000); // 1h par défaut
    
    const uid = this.generateUID();
    const dtstamp = this.formatDate(now);
    const dtstart = this.formatDate(startDate);
    const dtend = this.formatDate(endDate);
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Claire Recruitment//Claire App//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${this.escapeText(event.title)}`,
    ];

    if (event.description) {
      icsContent.push(`DESCRIPTION:${this.escapeText(event.description)}`);
    }

    if (event.location) {
      icsContent.push(`LOCATION:${this.escapeText(event.location)}`);
    }

    if (event.organizer) {
      icsContent.push(`ORGANIZER:CN=${this.escapeText(event.organizer)}:MAILTO:${event.organizer}`);
    }

    if (event.attendees && event.attendees.length > 0) {
      event.attendees.forEach(attendee => {
        icsContent.push(`ATTENDEE:CN=${this.escapeText(attendee)}:MAILTO:${attendee}`);
      });
    }

    // Priorité
    if (event.priority) {
      const priorityValue = event.priority === 'high' ? '1' : event.priority === 'medium' ? '5' : '9';
      icsContent.push(`PRIORITY:${priorityValue}`);
    }

    // Catégories basées sur le type
    if (event.type) {
      const categoryMap = {
        interview: 'ENTRETIEN,RECRUTEMENT',
        task: 'TÂCHE,SUIVI',
        reminder: 'RAPPEL,SUIVI',
        alert: 'URGENT,ALERTE'
      };
      icsContent.push(`CATEGORIES:${categoryMap[event.type]}`);
    }

    // Alarme pour les événements urgents
    if (event.priority === 'high' || event.type === 'interview') {
      icsContent.push(
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:Rappel: ${this.escapeText(event.title)}`,
        'END:VALARM'
      );
    }

    icsContent.push(
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR'
    );

    return icsContent.join('\r\n');
  }

  static downloadICS(event: CalendarEvent, filename?: string): void {
    const icsContent = this.generateICS(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  }

  // Templates pour différents types d'événements
  static createInterviewEvent(
    candidateName: string, 
    position: string, 
    time: string, 
    type: 'phone' | 'video' | 'onsite',
    location?: string
  ): CalendarEvent {
    const today = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    const typeLabels = {
      phone: 'Entretien téléphonique',
      video: 'Entretien vidéo',
      onsite: 'Entretien sur site'
    };

    return {
      title: `${typeLabels[type]} - ${candidateName}`,
      description: `Entretien pour le poste de ${position}\nCandidat: ${candidateName}\nType: ${typeLabels[type]}`,
      startDate,
      endDate: new Date(startDate.getTime() + 60 * 60 * 1000), // 1h
      location: location || (type === 'video' ? 'Visioconférence' : type === 'phone' ? 'Appel téléphonique' : 'Bureau'),
      type: 'interview',
      priority: 'high'
    };
  }

  static createTaskEvent(
    title: string, 
    description: string, 
    priority: 'high' | 'medium' | 'low',
    dueHour: number = 17
  ): CalendarEvent {
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), dueHour, 0);
    
    return {
      title: `[TÂCHE] ${title}`,
      description: `Tâche de recrutement à effectuer:\n${description}`,
      startDate: dueDate,
      endDate: new Date(dueDate.getTime() + 30 * 60 * 1000), // 30min
      type: 'task',
      priority
    };
  }

  static createReminderEvent(
    candidateName: string, 
    action: string, 
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): CalendarEvent {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9h du matin
    
    return {
      title: `[RAPPEL] ${action} - ${candidateName}`,
      description: `Rappel de suivi candidat:\nCandidat: ${candidateName}\nAction: ${action}`,
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 15 * 60 * 1000), // 15min
      type: 'reminder',
      priority
    };
  }
}