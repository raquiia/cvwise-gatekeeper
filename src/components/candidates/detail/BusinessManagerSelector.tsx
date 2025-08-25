import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Users, Calendar as CalendarIcon, Clock, Edit3 } from 'lucide-react';
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

// Fonction pour normaliser les noms (suppression accents, minuscules, espaces -> points)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garde seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '.') // Remplace espaces par points
    .replace(/\.+/g, '.') // Évite les points multiples
    .replace(/^\.+|\.+$/g, ''); // Supprime points en début/fin
};

// Fonction pour générer l'email automatiquement
const generateEmail = (firstName: string, lastName: string): string => {
  if (!firstName.trim() || !lastName.trim()) return '';
  
  const normalizedFirstName = normalizeText(firstName.trim());
  const normalizedLastName = normalizeText(lastName.trim());
  
  return `${normalizedFirstName}.${normalizedLastName}@migso-pcubed.com`;
};

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
  const [isEmailCustomized, setIsEmailCustomized] = useState(false);

  // Auto-génération de l'email quand firstName et lastName sont renseignés
  useEffect(() => {
    if (!isEmailCustomized && businessManager.firstName && businessManager.lastName) {
      const generatedEmail = generateEmail(businessManager.firstName, businessManager.lastName);
      setBusinessManager(prev => ({ ...prev, email: generatedEmail }));
    }
  }, [businessManager.firstName, businessManager.lastName, isEmailCustomized]);

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
    setIsEmailCustomized(false);
    onClose();
  };

  const handleCustomizeEmail = () => {
    setIsEmailCustomized(true);
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
            <div className="col-span-3 flex gap-2">
              <Input
                id="email"
                type="email"
                value={businessManager.email}
                onChange={(e) => setBusinessManager(prev => ({ ...prev, email: e.target.value }))}
                className="flex-1"
                placeholder="email@migso-pcubed.com"
                readOnly={!isEmailCustomized}
              />
              {!isEmailCustomized && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCustomizeEmail}
                  className="px-3"
                  title="Personnaliser l'email"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {businessManager.email && !isEmailCustomized && (
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-start-2 col-span-3">
                <p className="text-sm text-muted-foreground">
                  📧 Email généré automatiquement selon le format Migso-PCubed
                </p>
              </div>
            </div>
          )}
          
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