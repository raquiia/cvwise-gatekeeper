import React from 'react';
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { ICSGeneratorService, CalendarEvent } from "@/services/calendar/icsGeneratorService";
import { useToast } from "@/hooks/use-toast";

interface CalendarActionButtonProps {
  event: CalendarEvent;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const CalendarActionButton: React.FC<CalendarActionButtonProps> = ({
  event,
  size = "sm",
  variant = "outline",
  className,
  showIcon = true,
  children
}) => {
  const { toast } = useToast();

  const handleAddToCalendar = () => {
    try {
      ICSGeneratorService.downloadICS(event);
      
      toast({
        title: "📅 Événement créé",
        description: `Le fichier "${event.title}" a été téléchargé. Ouvrez-le pour l'ajouter à votre calendrier.`,
      });
    } catch (error) {
      console.error('Erreur lors de la génération ICS:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de générer l'événement calendrier.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCalendar}
      className={className}
    >
      {showIcon && <Calendar className="h-4 w-4 mr-1" />}
      {children || "Calendrier"}
    </Button>
  );
};

// Hook utilitaire pour créer des événements rapidement
export const useCalendarEvent = () => {
  return {
    createInterviewEvent: ICSGeneratorService.createInterviewEvent,
    createTaskEvent: ICSGeneratorService.createTaskEvent,
    createReminderEvent: ICSGeneratorService.createReminderEvent,
  };
};