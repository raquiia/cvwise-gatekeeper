import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { candidateNotesService } from '@/services/data/candidateNotesService';
import { recruiterTasksService } from '@/services/data/recruiterTasksService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface BusinessManagerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  candidatePosition: string;
  statusType: 'ci1' | 'ci2' | 'ci3';
  onBusinessManagerSelected: (businessManager: string) => void;
}

const BusinessManagerSelector: React.FC<BusinessManagerSelectorProps> = ({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidatePosition,
  statusType,
  onBusinessManagerSelected
}) => {
  const { user } = useAuth();
  const [businessManager, setBusinessManager] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!businessManager.firstName.trim() || !businessManager.lastName.trim()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez renseigner au moins le nom et prénom du Business Manager",
        variant: "destructive",
      });
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Date et heure requises",
        description: "Veuillez sélectionner une date et heure pour l'entretien",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format du Business Manager pour stockage
      const bmInfo = `${businessManager.firstName} ${businessManager.lastName}${businessManager.email ? ` (${businessManager.email})` : ''}`;
      
      // Créer la date d'entretien complète
      const [hours, minutes] = scheduledTime.split(':');
      const interviewDateTime = new Date(scheduledDate);
      interviewDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Créer automatiquement une note d'entretien "en attente"
      const noteContent = `Entretien ${statusType.toUpperCase()} avec ${businessManager.firstName} ${businessManager.lastName} - Programmé le ${format(interviewDateTime, 'dd/MM/yyyy à HH:mm', { locale: fr })}`;
      
      const result = await candidateNotesService.addNote({
        candidate_id: candidateId,
        user_id: user.id,
        content: noteContent,
        note_type: statusType,
        business_manager: bmInfo
      });

      // Créer une tâche pour le recruteur
      if (result) {
        await recruiterTasksService.createBMInterviewTask(
          user.id,
          candidateId,
          candidateName,
          candidatePosition,
          bmInfo,
          statusType,
          interviewDateTime.toISOString()
        );

        toast({
          title: "Business Manager assigné",
          description: `${businessManager.firstName} ${businessManager.lastName} a été assigné pour l'entretien ${statusType.toUpperCase()} le ${format(interviewDateTime, 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
        });
        
        onBusinessManagerSelected(bmInfo);
        onClose();
        
        // Reset form
        setBusinessManager({
          firstName: '',
          lastName: '',
          email: ''
        });
        setScheduledDate(undefined);
        setScheduledTime('');
      }
    } catch (error: any) {
      console.error('Error assigning business manager:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le Business Manager",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setBusinessManager({
      firstName: '',
      lastName: '',
      email: ''
    });
    setScheduledDate(undefined);
    setScheduledTime('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assigner un Business Manager
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le Business Manager qui sera l'interlocuteur pour l'entretien {statusType.toUpperCase()}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-right">
              Prénom *
            </Label>
            <Input
              id="firstName"
              value={businessManager.firstName}
              onChange={(e) => setBusinessManager(prev => ({ ...prev, firstName: e.target.value }))}
              className="col-span-3"
              placeholder="Prénom du Business Manager"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-right">
              Nom *
            </Label>
            <Input
              id="lastName"
              value={businessManager.lastName}
              onChange={(e) => setBusinessManager(prev => ({ ...prev, lastName: e.target.value }))}
              className="col-span-3"
              placeholder="Nom du Business Manager"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={businessManager.email}
              onChange={(e) => setBusinessManager(prev => ({ ...prev, email: e.target.value }))}
              className="col-span-3"
              placeholder="email@entreprise.com (optionnel)"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">
              Date *
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Heure *
            </Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Attribution..." : "Assigner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessManagerSelector;