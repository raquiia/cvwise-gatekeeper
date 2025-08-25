
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
import { supabase } from '@/integrations/supabase/client';

// Define colors by status
const STATUS_COLORS: Record<string, string> = {
  'prise_contact': 'bg-blue-500 hover:bg-blue-600',
  'ps': 'bg-cyan-500 hover:bg-cyan-600',
  'ci1': 'bg-violet-500 hover:bg-violet-600',
  'ci2': 'bg-indigo-500 hover:bg-indigo-600',
  'ci3': 'bg-purple-500 hover:bg-purple-600',
  'pipeline': 'bg-amber-500 hover:bg-amber-600',
  'formal_offer': 'bg-orange-500 hover:bg-orange-600',
  'contingent_offer': 'bg-yellow-500 hover:bg-yellow-600',
  'offer_declined': 'bg-red-500 hover:bg-red-600',
  'offer_accepted': 'bg-green-500 hover:bg-green-600',
  'contract_signed': 'bg-emerald-500 hover:bg-emerald-600',
  'hired': 'bg-teal-500 hover:bg-teal-600'
};

interface StatusSelectorProps {
  candidateId: string;
  onStatusChange?: (newStatus: string) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  candidateId,
  onStatusChange 
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(CANDIDATE_STATUSES.PRISE_CONTACT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showBusinessManagerSelector, setShowBusinessManagerSelector] = useState<boolean>(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [candidateInfo, setCandidateInfo] = useState<{name: string, position: string}>({ name: '', position: '' });
  
  // Load current status and candidate info
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
          console.log("No status found, using prise_contact");
          setCurrentStatus(CANDIDATE_STATUSES.PRISE_CONTACT);
        }
      } catch (error) {
        console.error("Error loading status:", error);
        setCurrentStatus(CANDIDATE_STATUSES.PRISE_CONTACT);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCurrentStatus();
    loadCandidateInfo();
  }, [candidateId]);

  const loadCandidateInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('first_name, last_name, position')
        .eq('id', candidateId)
        .single();

      if (data && !error) {
        setCandidateInfo({
          name: `${data.first_name} ${data.last_name}`,
          position: data.position || 'Poste non spécifié'
        });
      }
    } catch (error) {
      console.error('Error loading candidate info:', error);
    }
  };
  
  // Change status
  const handleStatusChange = async (status: string) => {
    if (status === currentStatus) return; // Do nothing if status is already selected
    
    console.log("Changing status to:", status);
    
    // Si c'est CI1, CI2 ou CI3, ouvrir le sélecteur de Business Manager
    if (status === 'ci1' || status === 'ci2' || status === 'ci3') {
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
                Étape: {CANDIDATE_STATUS_LABELS[currentStatus] || 'Inconnu'}
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
        candidateName={candidateInfo.name}
        candidatePosition={candidateInfo.position}
        statusType={pendingStatus as 'ci1' | 'ci2' | 'ci3'}
        onBusinessManagerSelected={handleBusinessManagerSelected}
      />
    </>
  );
};

export default StatusSelector;
