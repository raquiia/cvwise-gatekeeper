
import React, { useState } from 'react';
import { Info, Mail, Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { usePendingRegistrations } from '@/hooks/usePendingRegistrations';

const PendingUsersList: React.FC = () => {
  const { pendingRegistrations, loading, approveRegistration, rejectRegistration } = usePendingRegistrations();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; registrationId: string }>({
    open: false,
    registrationId: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = (registrationId: string) => {
    approveRegistration(registrationId);
  };

  const handleReject = (registrationId: string) => {
    setRejectDialog({ open: true, registrationId });
  };

  const confirmReject = () => {
    if (rejectDialog.registrationId) {
      rejectRegistration(rejectDialog.registrationId, rejectionReason);
      setRejectDialog({ open: false, registrationId: '' });
      setRejectionReason('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            Utilisateurs en attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mx-auto"></div>
            <p className="text-muted-foreground mt-2">Chargement des demandes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              Utilisateurs en attente
            </CardTitle>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100">
              {pendingRegistrations.length} demandes
            </Badge>
          </div>
          <CardDescription>
            Validez ou rejetez les demandes d'inscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucune demande en attente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRegistrations.map((registration) => (
                <div key={registration.id} className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-4">
                      <AvatarFallback className="bg-navy/10 text-navy-dark">
                        {registration.first_name[0]}{registration.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-navy-dark">
                        {registration.first_name} {registration.last_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={12} />
                        {registration.email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {registration.company && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            <Briefcase size={10} className="mr-1" />
                            {registration.company}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {formatDate(registration.created_at)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      onClick={() => handleApprove(registration.id)}
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleReject(registration.id)}
                    >
                      <XCircle size={16} className="mr-1" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, registrationId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande d'inscription</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet (optionnel)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, registrationId: '' })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingUsersList;
