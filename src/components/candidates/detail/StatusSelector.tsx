
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS, candidateStatusService } from '@/services/data/candidateStatusService';

// Définition des couleurs par statut
const STATUS_COLORS: Record<string, string> = {
  'initial': 'bg-gray-500 hover:bg-gray-600',
  'contact': 'bg-blue-500 hover:bg-blue-600',
  'prequalification': 'bg-cyan-500 hover:bg-cyan-600',
  'ec1': 'bg-violet-500 hover:bg-violet-600',
  'ec2': 'bg-indigo-500 hover:bg-indigo-600',
  'presentation_client': 'bg-amber-500 hover:bg-amber-600',
  'en_mission': 'bg-emerald-500 hover:bg-emerald-600',
  'refus': 'bg-red-500 hover:bg-red-600',
  'ancien_employe': 'bg-slate-500 hover:bg-slate-600'
};

interface StatusSelectorProps {
  candidateId: string;
  onStatusChange?: (newStatus: string) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  candidateId,
  onStatusChange 
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(CANDIDATE_STATUSES.INITIAL);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Charger le statut actuel
  useEffect(() => {
    const loadCurrentStatus = async () => {
      setIsLoading(true);
      const status = await candidateStatusService.getCandidateStatus(candidateId);
      setCurrentStatus(status || CANDIDATE_STATUSES.INITIAL);
      setIsLoading(false);
    };
    
    loadCurrentStatus();
  }, [candidateId]);
  
  // Changer le statut
  const handleStatusChange = async (status: string) => {
    setIsUpdating(true);
    const success = await candidateStatusService.updateCandidateStatus(candidateId, status);
    
    if (success) {
      setCurrentStatus(status);
      if (onStatusChange) {
        onStatusChange(status);
      }
    }
    
    setIsUpdating(false);
  };
  
  // Déterminer la couleur du bouton en fonction du statut actuel
  const buttonColorClass = STATUS_COLORS[currentStatus] || 'bg-gray-500 hover:bg-gray-600';
  
  if (isLoading) {
    return (
      <Button disabled className="w-full md:w-auto">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Chargement...
      </Button>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isUpdating}>
        <Button 
          className={`w-full md:w-auto ${buttonColorClass} text-white`}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              Statut: {CANDIDATE_STATUS_LABELS[currentStatus]}
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {Object.entries(CANDIDATE_STATUS_LABELS).map(([value, label]) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleStatusChange(value)}
            className="flex items-center justify-between cursor-pointer"
          >
            {label}
            {value === currentStatus && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusSelector;
