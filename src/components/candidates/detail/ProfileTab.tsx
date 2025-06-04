
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { candidateService } from '@/services/data/candidateService';
import type { CandidateData } from '@/services/data/candidateService';
import { useAuth } from '@/context/AuthContext';
import ScoreDisplay from './ScoreDisplay';
import { User, Briefcase, MapPin, Calendar, DollarSign, Clock, FileText, Save, RotateCcw } from 'lucide-react';

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
    console.log('ProfileTab: Updating state from candidate prop', {
      candidateNotes: candidate.notes,
      currentNotesState: notes
    });
    
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
      console.log('ProfileTab: Saving candidate with notes:', notes);
      
      const updateData = {
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
      };
      
      console.log('ProfileTab: Update data being sent:', updateData);
      
      await candidateService.updateCandidate(updateData);
      
      toast({
        title: "Profil mis à jour",
        description: "Les informations du candidat ont été mises à jour avec succès.",
      });
      
      // Refresh the data to ensure consistency
      if (onRefresh) {
        console.log('ProfileTab: Calling onRefresh to reload data');
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
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">Prénom</Label>
                  <Input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Nom</Label>
                  <Input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informations professionnelles */}
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informations professionnelles</h3>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Poste actuel
                  </Label>
                  <Input
                    type="text"
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localisation
                  </Label>
                  <Input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Années d'expérience
                  </Label>
                  <Input
                    type="number"
                    id="yearsExperience"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Number(e.target.value))}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryExpectation" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salaire souhaité
                  </Label>
                  <Input
                    type="text"
                    id="salaryExpectation"
                    value={salaryExpectation}
                    onChange={(e) => setSalaryExpectation(e.target.value)}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Disponibilité
                </Label>
                <Input
                  type="text"
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Notes personnelles</h3>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes personnelles</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => {
                    console.log('ProfileTab: Notes field changed to:', e.target.value);
                    setNotes(e.target.value);
                  }}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
                  rows={5}
                  placeholder="Ajoutez vos notes personnelles sur ce candidat..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec actions et score */}
        <div className="space-y-6">
          {/* Actions */}
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isSaving}
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardContent>
          </Card>

          {/* Score IA */}
          <ScoreDisplay 
            candidate={candidate}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
