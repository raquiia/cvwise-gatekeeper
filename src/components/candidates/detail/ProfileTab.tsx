
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { candidateService } from '@/services/data/candidateService';
import type { CandidateData } from '@/services/data/candidateService';
import { useAuth } from '@/context/AuthContext';
import ScoreDisplay from './ScoreDisplay';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  const [firstName, setFirstName] = useState(candidate.first_name || '');
  const [lastName, setLastName] = useState(candidate.last_name || '');
  const [email, setEmail] = useState(candidate.email || '');
  const [position, setPosition] = useState(candidate.position || '');
  const [location, setLocation] = useState(candidate.location || '');
  const [yearsExperience, setYearsExperience] = useState(candidate.years_experience || 0);
  const [salaryExpectation, setSalaryExpectation] = useState(candidate.salary_expectations || candidate.salary_expectation || '');
  const [availability, setAvailability] = useState(candidate.availability || '');
  const [notes, setNotes] = useState(candidate.notes || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  
  // Update local state when candidate prop changes
  useEffect(() => {
    setFirstName(candidate.first_name || '');
    setLastName(candidate.last_name || '');
    setEmail(candidate.email || '');
    setPosition(candidate.position || '');
    setLocation(candidate.location || '');
    setYearsExperience(candidate.years_experience || 0);
    setSalaryExpectation(candidate.salary_expectations || candidate.salary_expectation || '');
    setAvailability(candidate.availability || '');
    setNotes(candidate.notes || '');
  }, [candidate]);
  
  const handleSave = async () => {
    if (!candidate.id || !user?.id) return;
    
    try {
      setIsSaving(true);
      await candidateService.updateCandidate({
        id: candidate.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        position: position,
        location: location,
        years_experience: yearsExperience,
        salary_expectations: salaryExpectation,
        availability: availability,
        notes: notes
      });
      
      toast({
        title: "Profil mis à jour",
        description: "Les informations du candidat ont été mises à jour avec succès.",
      });
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error updating candidate:", error);
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Une erreur s'est produite lors de la mise à jour du profil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <div className="grid gap-4 p-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Informations personnelles</h3>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Poste actuel</Label>
              <Input
                type="text"
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">Lieu</Label>
              <Input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearsExperience">Années d'expérience</Label>
              <Input
                type="number"
                id="yearsExperience"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="salaryExpectation">Salaire souhaité</Label>
              <Input
                type="text"
                id="salaryExpectation"
                value={salaryExpectation}
                onChange={(e) => setSalaryExpectation(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="availability">Disponibilité</Label>
            <Input
              type="text"
              id="availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Notes</h3>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isSaving}
        >
          Actualiser
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <ScoreDisplay 
        candidate={candidate}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default ProfileTab;
