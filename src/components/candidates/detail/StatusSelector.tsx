
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
import { toast } from '@/hooks/use-toast';

// Define colors by status
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
  currentStatus?: string;
  onStatusChange?: (newStatus: string) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  candidateId,
  currentStatus: propCurrentStatus,
  onStatusChange 
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(propCurrentStatus || 'initial');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Load current status only if not provided as prop
  useEffect(() => {
    if (propCurrentStatus) {
      setCurrentStatus(propCurrentStatus);
      return;
    }
    
    const loadCurrentStatus = async () => {
      if (!candidateId) {
        console.error("No candidate ID provided");
        return;
      }
      
      setIsLoading(true);
      try {
        console.log("Loading status for candidate:", candidateId);
        const status = await candidateStatusService.getCandidateStatus(candidateId);
        console.log("Loaded status:", status);
        
        if (status) {
          setCurrentStatus(status);
        } else {
          console.log("No status found, using initial");
          setCurrentStatus('initial');
        }
      } catch (error) {
        console.error("Error loading status:", error);
        setCurrentStatus('initial');
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger le statut actuel",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCurrentStatus();
  }, [candidateId, propCurrentStatus]);
  
  // Change status
  const handleStatusChange = async (status: string) => {
    if (status === currentStatus) return; // Do nothing if status is already selected
    
    console.log("Changing status from", currentStatus, "to:", status);
    setIsUpdating(true);
    
    try {
      const success = await candidateStatusService.updateCandidateStatus(candidateId, status);
      
      if (success) {
        console.log("Status updated successfully to:", status);
        setCurrentStatus(status);
        
        toast({
          title: "Statut mis à jour",
          description: `Le statut a été modifié en "${CANDIDATE_STATUS_LABELS[status]}"`,
        });
        
        if (onStatusChange) {
          onStatusChange(status);
        }
      } else {
        console.error("Failed to update status");
        toast({
          title: "Erreur de mise à jour",
          description: "La mise à jour du statut a échoué. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Determine button color based on current status
  const buttonColorClass = STATUS_COLORS[currentStatus] || 'bg-gray-500 hover:bg-gray-600';
  
  if (isLoading && !propCurrentStatus) {
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
              Statut: {CANDIDATE_STATUS_LABELS[currentStatus] || 'Inconnu'}
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
