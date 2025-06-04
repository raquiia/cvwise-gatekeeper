
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS, updateCandidateStatus, getCandidateStatus } from '@/services/data/candidateStatusService';
import { toast } from '@/hooks/use-toast';

// Define colors by status
const STATUS_COLORS: Record<string, string> = {
  'contact': 'bg-blue-500 hover:bg-blue-600',
  'qualification': 'bg-cyan-500 hover:bg-cyan-600',
  'prequalification': 'bg-purple-500 hover:bg-purple-600',
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
  onDataRefresh?: () => void;
  onGlobalRefresh?: () => Promise<void>; // NEW: Global refresh callback
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  candidateId,
  currentStatus: propCurrentStatus,
  onStatusChange,
  onDataRefresh,
  onGlobalRefresh
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(propCurrentStatus || 'contact');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  
  // Load current status from database
  useEffect(() => {
    const loadCurrentStatus = async () => {
      if (candidateId && !propCurrentStatus) {
        setIsLoadingStatus(true);
        try {
          const status = await getCandidateStatus(candidateId);
          if (status) {
            console.log('📥 Loaded current status from DB:', status);
            setCurrentStatus(status);
          }
        } catch (error) {
          console.error('❌ Error loading current status:', error);
        } finally {
          setIsLoadingStatus(false);
        }
      }
    };
    
    loadCurrentStatus();
  }, [candidateId, propCurrentStatus]);
  
  // Use prop status if available
  useEffect(() => {
    if (propCurrentStatus) {
      console.log('📥 Using prop status:', propCurrentStatus);
      setCurrentStatus(propCurrentStatus);
    }
  }, [propCurrentStatus]);
  
  // Handle status change with comprehensive refresh
  const handleStatusChange = async (status: string) => {
    if (status === currentStatus || isUpdating) return;
    
    console.log("🔄 Changing status from", currentStatus, "to:", status);
    setIsUpdating(true);
    
    try {
      const success = await updateCandidateStatus(candidateId, status);
      
      if (success) {
        console.log("✅ Status updated successfully to:", status);
        setCurrentStatus(status);
        
        toast({
          title: "Statut mis à jour",
          description: `Le statut a été modifié en "${CANDIDATE_STATUS_LABELS[status] || status}"`,
        });
        
        // Notify local components
        if (onStatusChange) {
          onStatusChange(status);
        }
        
        if (onDataRefresh) {
          onDataRefresh();
        }

        // CRITICAL: Trigger global data refresh
        if (onGlobalRefresh) {
          console.log('🌍 Triggering global candidates refresh');
          await onGlobalRefresh();
        }
      } else {
        console.error("❌ Failed to update status");
        toast({
          title: "Erreur de mise à jour",
          description: "La mise à jour du statut a échoué. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Error updating status:", error);
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
  const buttonColorClass = STATUS_COLORS[currentStatus] || 'bg-blue-500 hover:bg-blue-600';
  
  // Get display label for current status
  const currentStatusLabel = CANDIDATE_STATUS_LABELS[currentStatus] || currentStatus;
  
  if (isLoadingStatus) {
    return (
      <Button className="bg-gray-400 hover:bg-gray-400 text-white" disabled>
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
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              {currentStatusLabel}
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
