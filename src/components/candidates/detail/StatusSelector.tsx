
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
import BusinessManagerSelector from './BusinessManagerSelector';

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
  onStatusChange?: (newStatus: string) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  candidateId,
  onStatusChange 
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(CANDIDATE_STATUSES.INITIAL);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showBusinessManagerSelector, setShowBusinessManagerSelector] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  
  // Load current status
  useEffect(() => {
    const loadCurrentStatus = async () => {
      if (!candidateId) {
        console.error("No candidate ID provided");
        setIsLoading(false);
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
          setCurrentStatus(CANDIDATE_STATUSES.INITIAL);
        }
      } catch (error) {
        console.error("Error loading status:", error);
        setCurrentStatus(CANDIDATE_STATUSES.INITIAL);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCurrentStatus();
  }, [candidateId]);
  
  // Change status
  const handleStatusChange = async (status: string) => {
    if (status === currentStatus) return; // Do nothing if status is already selected
    
    console.log("Changing status to:", status);
    
    // Si c'est EC1 ou EC2, ouvrir le sélecteur de Business Manager
    if (status === 'ec1' || status === 'ec2') {
      setPendingStatus(status);
      setShowBusinessManagerSelector(true);
      return;
    }
    
    // Sinon, procéder normalement
    await updateCandidateStatus(status);
  };
  
  const updateCandidateStatus = async (status: string) => {
    setIsUpdating(true);
    
    try {
      const success = await candidateStatusService.updateCandidateStatus(candidateId, status);
      
      if (success) {
        console.log("Status updated successfully to:", status);
        setCurrentStatus(status);
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
  
  const handleBusinessManagerSelected = async (businessManager: string) => {
    console.log("Business Manager selected:", businessManager, "for status:", pendingStatus);
    // Procéder avec le changement de statut
    await updateCandidateStatus(pendingStatus);
    setPendingStatus('');
  };
  
  const handleBusinessManagerSelectorClose = () => {
    setShowBusinessManagerSelector(false);
    setPendingStatus('');
  };
  
  // Determine button color based on current status
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
    <>
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
      
      <BusinessManagerSelector
        isOpen={showBusinessManagerSelector}
        onClose={handleBusinessManagerSelectorClose}
        candidateId={candidateId}
        statusType={pendingStatus as 'ec1' | 'ec2'}
        onBusinessManagerSelected={handleBusinessManagerSelected}
      />
    </>
  );
};

export default StatusSelector;
