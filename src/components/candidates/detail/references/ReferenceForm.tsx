import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { CreateReferenceData, UpdateReferenceData } from '@/services/data/candidateReferencesService';

interface ReferenceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReferenceData | UpdateReferenceData) => void;
  candidateId: string;
  initialData?: Partial<CreateReferenceData>;
  isEditing?: boolean;
}

const ReferenceForm: React.FC<ReferenceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  candidateId,
  initialData,
  isEditing = false
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateReferenceData>({
    defaultValues: {
      candidate_id: candidateId,
      name: initialData?.name || '',
      company: initialData?.company || '',
      position: initialData?.position || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      relationship: initialData?.relationship || ''
    }
  });

  const relationshipValue = watch('relationship');

  const handleFormSubmit = (data: CreateReferenceData) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la référence' : 'Ajouter une référence'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  {...register('company')}
                  placeholder="Entreprise XYZ"
                />
              </div>
              <div>
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  {...register('position')}
                  placeholder="Directeur RH"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="jean.dupont@xyz.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="relationship">Relation avec le candidat</Label>
              <Select value={relationshipValue} onValueChange={(value) => setValue('relationship', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager direct</SelectItem>
                  <SelectItem value="colleague">Collègue</SelectItem>
                  <SelectItem value="hr">Responsable RH</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="subordinate">Collaborateur</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit">
              {isEditing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReferenceForm;