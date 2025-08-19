import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { candidateNotesService } from '@/services/data/candidateNotesService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface BusinessManagerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  statusType: 'ec1' | 'ec2';
  onBusinessManagerSelected: (businessManager: string) => void;
}

const BusinessManagerSelector: React.FC<BusinessManagerSelectorProps> = ({
  isOpen,
  onClose,
  candidateId,
  statusType,
  onBusinessManagerSelected
}) => {
  const { user } = useAuth();
  const [businessManager, setBusinessManager] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
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
      
      // Créer automatiquement une note d'entretien "en attente"
      const noteContent = `Entretien ${statusType.toUpperCase()} avec ${businessManager.firstName} ${businessManager.lastName} - En attente de réalisation`;
      
      const result = await candidateNotesService.addNote({
        candidate_id: candidateId,
        user_id: user.id,
        content: noteContent,
        note_type: statusType,
        business_manager: bmInfo
      });

      if (result) {
        toast({
          title: "Business Manager assigné",
          description: `${businessManager.firstName} ${businessManager.lastName} a été assigné pour l'entretien ${statusType.toUpperCase()}`,
        });
        
        onBusinessManagerSelected(bmInfo);
        onClose();
        
        // Reset form
        setBusinessManager({
          firstName: '',
          lastName: '',
          email: ''
        });
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