import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Clock, MapPin, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { recruitmentProcessService, RecruitmentProcess } from '@/services/data/recruitmentProcessService';
import { useGeoData } from '@/hooks/useGeoData';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecruitmentProcessHistoryProps {
  candidateId: string;
  currentStatus: string;
  onProcessStarted?: () => void;
}

const statusLabels: Record<string, string> = {
  'prise_contact': 'Prise de contact',
  'ps': 'Pré-sélection',
  'ci1': 'Entretien CI1',
  'ci2': 'Entretien CI2', 
  'ci3': 'Entretien CI3',
  'pipeline': 'Pipeline',
  'formal_offer': 'Offre formelle',
  'contingent_offer': 'Offre conditionnelle',
  'offer_declined': 'Offre refusée',
  'offer_accepted': 'Offre acceptée',
  'contract_signed': 'Contrat signé',
  'hired': 'Embauché'
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'prise_contact': 'bg-blue-100 text-blue-800',
    'ps': 'bg-yellow-100 text-yellow-800',
    'ci1': 'bg-orange-100 text-orange-800',
    'ci2': 'bg-orange-100 text-orange-800',
    'ci3': 'bg-orange-100 text-orange-800',
    'pipeline': 'bg-purple-100 text-purple-800',
    'formal_offer': 'bg-green-100 text-green-800',
    'contingent_offer': 'bg-green-100 text-green-800',
    'offer_declined': 'bg-red-100 text-red-800',
    'offer_accepted': 'bg-green-100 text-green-800',
    'contract_signed': 'bg-green-100 text-green-800',
    'hired': 'bg-emerald-100 text-emerald-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const RecruitmentProcessHistory: React.FC<RecruitmentProcessHistoryProps> = ({
  candidateId,
  currentStatus,
  onProcessStarted
}) => {
  const [processes, setProcesses] = useState<RecruitmentProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProcessDialog, setShowNewProcessDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedHub, setSelectedHub] = useState<string>('');
  const [processNotes, setProcessNotes] = useState('');
  const [startingProcess, setStartingProcess] = useState(false);
  
  const { toast } = useToast();
  const { countries, hubs } = useGeoData();

  const filteredHubs = selectedCountry 
    ? hubs.filter(hub => hub.country_id === selectedCountry)
    : [];

  useEffect(() => {
    loadProcessHistory();
  }, [candidateId]);

  const loadProcessHistory = async () => {
    try {
      setLoading(true);
      const history = await recruitmentProcessService.getCandidateRecruitmentHistory(candidateId);
      setProcesses(history);
    } catch (error) {
      console.error('Error loading recruitment history:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des processus",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewProcess = async () => {
    if (!selectedHub) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un hub",
        variant: "destructive"
      });
      return;
    }

    try {
      setStartingProcess(true);
      await recruitmentProcessService.startNewProcess(candidateId, selectedHub, processNotes);
      
      toast({
        title: "Succès",
        description: "Nouveau processus de recrutement démarré"
      });

      setShowNewProcessDialog(false);
      setSelectedCountry('');
      setSelectedHub('');
      setProcessNotes('');
      
      await loadProcessHistory();
      onProcessStarted?.();
    } catch (error) {
      console.error('Error starting new process:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer le nouveau processus",
        variant: "destructive"
      });
    } finally {
      setStartingProcess(false);
    }
  };

  const isRejectedStatus = currentStatus?.includes('refuse') || currentStatus === 'refus';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des processus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Historique des processus</CardTitle>
        {isRejectedStatus && (
          <Dialog open={showNewProcessDialog} onOpenChange={setShowNewProcessDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau processus
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Démarrer un nouveau processus</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="country">Pays</Label>
                  <Select value={selectedCountry} onValueChange={(value) => {
                    setSelectedCountry(value);
                    setSelectedHub('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCountry && (
                  <div>
                    <Label htmlFor="hub">Hub</Label>
                    <Select value={selectedHub} onValueChange={setSelectedHub}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un hub" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredHubs.map((hub) => (
                          <SelectItem key={hub.id} value={hub.id}>
                            {hub.name} - {hub.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={processNotes}
                    onChange={(e) => setProcessNotes(e.target.value)}
                    placeholder="Raison du nouveau processus..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewProcessDialog(false)}
                    disabled={startingProcess}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleStartNewProcess}
                    disabled={startingProcess || !selectedHub}
                  >
                    {startingProcess ? 'Démarrage...' : 'Démarrer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {processes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Aucun processus de recrutement enregistré
          </p>
        ) : (
          <div className="space-y-4">
            {processes.map((process) => (
              <div key={process.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">
                      Processus #{process.process_number}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Démarré {formatDistanceToNow(new Date(process.started_at), { locale: fr, addSuffix: true })}
                      </div>
                      {process.ended_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Terminé {formatDistanceToNow(new Date(process.ended_at), { locale: fr, addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(process.status)}>
                    {statusLabels[process.status] || process.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{process.hub.name} - {process.hub.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{process.recruiter.first_name} {process.recruiter.last_name}</span>
                  </div>
                </div>

                {process.outcome && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm"><strong>Résultat:</strong> {process.outcome}</p>
                  </div>
                )}

                {process.notes && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm"><strong>Notes:</strong> {process.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};