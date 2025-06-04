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
import { useDebounce } from '@/hooks/use-debounce';
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
  const [linkedin, setLinkedin] = useState(candidate.linkedin || '');
  const [github, setGithub] = useState(candidate.github || '');
  const [portfolio, setPortfolio] = useState(candidate.portfolio || '');
  const [personalWebsite, setPersonalWebsite] = useState(candidate.personal_website || '');
  const [cv, setCv] = useState(candidate.cv || '');
  const [profileSummary, setProfileSummary] = useState(candidate.profile_summary || '');
  const [openToRemote, setOpenToRemote] = useState(candidate.open_to_remote || false);
  const [openToRelocation, setOpenToRelocation] = useState(candidate.open_to_relocation || false);
  const [notes, setNotes] = useState(candidate.notes || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const debouncedFirstName = useDebounce(firstName, 500);
  const debouncedLastName = useDebounce(lastName, 500);
  const debouncedEmail = useDebounce(email, 500);
  const debouncedPosition = useDebounce(position, 500);
  const debouncedLocation = useDebounce(location, 500);
  const debouncedYearsExperience = useDebounce(yearsExperience, 500);
  const debouncedSalaryExpectation = useDebounce(salaryExpectation, 500);
  const debouncedAvailability = useDebounce(availability, 500);
  const debouncedLinkedin = useDebounce(linkedin, 500);
  const debouncedGithub = useDebounce(github, 500);
  const debouncedPortfolio = useDebounce(portfolio, 500);
  const debouncedPersonalWebsite = useDebounce(personalWebsite, 500);
  const debouncedCv = useDebounce(cv, 500);
  const debouncedProfileSummary = useDebounce(profileSummary, 500);
  const debouncedOpenToRemote = useDebounce(openToRemote, 500);
  const debouncedOpenToRelocation = useDebounce(openToRelocation, 500);
  const debouncedNotes = useDebounce(notes, 500);
  
  const { user } = useAuth();
  
  useEffect(() => {
    setFirstName(candidate.first_name || '');
    setLastName(candidate.last_name || '');
    setEmail(candidate.email || '');
    setPosition(candidate.position || '');
    setLocation(candidate.location || '');
    setYearsExperience(candidate.years_experience || 0);
    setSalaryExpectation(candidate.salary_expectations || candidate.salary_expectation || '');
    setAvailability(candidate.availability || '');
    setLinkedin(candidate.linkedin || '');
    setGithub(candidate.github || '');
    setPortfolio(candidate.portfolio || '');
    setPersonalWebsite(candidate.personal_website || '');
    setCv(candidate.cv || '');
    setProfileSummary(candidate.profile_summary || '');
    setOpenToRemote(candidate.open_to_remote || false);
    setOpenToRelocation(candidate.open_to_relocation || false);
    setNotes(candidate.notes || '');
  }, [candidate]);
  
  useEffect(() => {
    const updateCandidate = async () => {
      if (!candidate.id || !user?.id) return;
      
      try {
        setIsSaving(true);
        await candidateService.updateCandidate({
          id: candidate.id,
          first_name: debouncedFirstName,
          last_name: debouncedLastName,
          email: debouncedEmail,
          position: debouncedPosition,
          location: debouncedLocation,
          years_experience: debouncedYearsExperience,
          salary_expectations: debouncedSalaryExpectation,
          availability: debouncedAvailability,
          linkedin: debouncedLinkedin,
          github: debouncedGithub,
          portfolio: debouncedPortfolio,
          personal_website: debouncedPersonalWebsite,
          cv: debouncedCv,
          profile_summary: debouncedProfileSummary,
          open_to_remote: debouncedOpenToRemote,
          open_to_relocation: debouncedOpenToRelocation,
          notes: debouncedNotes
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
    
    if (
      debouncedFirstName !== candidate.first_name ||
      debouncedLastName !== candidate.last_name ||
      debouncedEmail !== candidate.email ||
      debouncedPosition !== candidate.position ||
      debouncedLocation !== candidate.location ||
      debouncedYearsExperience !== candidate.years_experience ||
      debouncedSalaryExpectation !== (candidate.salary_expectations || candidate.salary_expectation) ||
      debouncedAvailability !== candidate.availability ||
      debouncedLinkedin !== candidate.linkedin ||
      debouncedGithub !== candidate.github ||
      debouncedPortfolio !== candidate.portfolio ||
      debouncedPersonalWebsite !== candidate.personal_website ||
      debouncedCv !== candidate.cv ||
      debouncedProfileSummary !== candidate.profile_summary ||
      debouncedOpenToRemote !== candidate.open_to_remote ||
      debouncedOpenToRelocation !== candidate.open_to_relocation ||
      debouncedNotes !== candidate.notes
    ) {
      updateCandidate();
    }
  }, [
    candidate,
    debouncedFirstName,
    debouncedLastName,
    debouncedEmail,
    debouncedPosition,
    debouncedLocation,
    debouncedYearsExperience,
    debouncedSalaryExpectation,
    debouncedAvailability,
    debouncedLinkedin,
    debouncedGithub,
    debouncedPortfolio,
    debouncedPersonalWebsite,
    debouncedCv,
    debouncedProfileSummary,
    debouncedOpenToRemote,
    debouncedOpenToRelocation,
    debouncedNotes,
    onRefresh,
    user
  ]);
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  return (
    <div className="grid gap-4">
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
          <h3 className="text-lg font-semibold">Liens</h3>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              type="url"
              id="linkedin"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="github">GitHub</Label>
              <Input
                type="url"
                id="github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="portfolio">Portfolio</Label>
              <Input
                type="url"
                id="portfolio"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="personalWebsite">Site personnel</Label>
            <Input
              type="url"
              id="personalWebsite"
              value={personalWebsite}
              onChange={(e) => setPersonalWebsite(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cv">CV</Label>
            <Input
              type="url"
              id="cv"
              value={cv}
              onChange={(e) => setCv(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Préférences</h3>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="openToRemote"
              checked={openToRemote}
              onCheckedChange={(checked) => setOpenToRemote(!!checked)}
            />
            <Label htmlFor="openToRemote">Ouvert au télétravail</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="openToRelocation"
              checked={openToRelocation}
              onCheckedChange={(checked) => setOpenToRelocation(!!checked)}
            />
            <Label htmlFor="openToRelocation">Ouvert à la relocalisation</Label>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Résumé</h3>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label htmlFor="profileSummary">Résumé du profil</Label>
            <Textarea
              id="profileSummary"
              value={profileSummary}
              onChange={(e) => setProfileSummary(e.target.value)}
              className="resize-none"
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
            />
          </div>
        </CardContent>
      </Card>

      <ScoreDisplay 
        candidate={candidate}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default ProfileTab;
