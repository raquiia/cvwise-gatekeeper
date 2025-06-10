
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
import { User, Briefcase, MapPin, Calendar, DollarSign, Clock, FileText, Save, RotateCcw, Phone, Home, CheckCircle } from 'lucide-react';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

// Geographic validation helper
const getCountryForCity = (city: string): string => {
  const cityCountryMap: Record<string, string> = {
    'geneva': 'Switzerland',
    'genève': 'Switzerland',
    'lausanne': 'Switzerland',
    'zurich': 'Switzerland',
    'zürich': 'Switzerland',
    'bern': 'Switzerland',
    'berne': 'Switzerland',
    'basel': 'Switzerland',
    'bâle': 'Switzerland',
    'paris': 'France',
    'lyon': 'France',
    'marseille': 'France',
    'toulouse': 'France',
    'nice': 'France',
    'london': 'United Kingdom',
    'manchester': 'United Kingdom',
    'edinburgh': 'United Kingdom',
    'berlin': 'Germany',
    'munich': 'Germany',
    'hamburg': 'Germany',
    'milan': 'Italy',
    'rome': 'Italy',
    'turin': 'Italy'
  };
  
  return cityCountryMap[city.toLowerCase()] || '';
};

// Format complete address helper
const formatCompleteAddress = (address: string, postalCode: string, city: string, country: string): string => {
  const parts = [];
  
  if (address) parts.push(address);
  if (postalCode && city) {
    parts.push(`${postalCode} ${city}`);
  } else if (city) {
    parts.push(city);
  }
  if (country) parts.push(country);
  
  return parts.join(', ');
};

const ProfileTab: React.FC<ProfileTabProps> = ({ candidate, isLoading, onRefresh }) => {
  const [firstName, setFirstName] = useState(candidate.first_name || '');
  const [lastName, setLastName] = useState(candidate.last_name || '');
  const [email, setEmail] = useState(candidate.email || '');
  const [phone, setPhone] = useState(candidate.phone || '');
  const [position, setPosition] = useState(candidate.position || '');
  const [location, setLocation] = useState(candidate.location || '');
  const [address, setAddress] = useState(candidate.address || '');
  const [postalCode, setPostalCode] = useState(candidate.postal_code || '');
  const [city, setCity] = useState(candidate.city || '');
  const [country, setCountry] = useState(candidate.country || '');
  const [yearsExperience, setYearsExperience] = useState(candidate.years_experience || 0);
  const [salaryExpectation, setSalaryExpectation] = useState(candidate.salary_expectations || '');
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
    setPhone(candidate.phone || '');
    setPosition(candidate.position || '');
    setLocation(candidate.location || '');
    setAddress(candidate.address || '');
    setPostalCode(candidate.postal_code || '');
    setCity(candidate.city || '');
    setCountry(candidate.country || '');
    setYearsExperience(candidate.years_experience || 0);
    setSalaryExpectation(candidate.salary_expectations || '');
    setAvailability(candidate.availability || '');
    setNotes(candidate.notes || '');
  }, [candidate]);
  
  // Auto-complete country when city changes
  useEffect(() => {
    if (city && !country) {
      const suggestedCountry = getCountryForCity(city);
      if (suggestedCountry) {
        setCountry(suggestedCountry);
      }
    }
  }, [city, country]);
  
  // Check if we have structured address data
  const hasStructuredAddress = Boolean(address || postalCode || city || country);
  const completeAddress = formatCompleteAddress(address, postalCode, city, country);
  const isAddressComplete = Boolean(address && city && country);
  
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
        phone: phone,
        position: position,
        location: location,
        address: address,
        postal_code: postalCode,
        city: city,
        country: country,
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
              {phone && (
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adresse avec résumé amélioré */}
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Home className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                </div>
                {isAddressComplete && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Complète</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Résumé de l'adresse complète */}
              {completeAddress && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-emerald-800 flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Adresse complète
                  </Label>
                  <p className="text-emerald-700 font-medium">{completeAddress}</p>
                </div>
              )}
              
              {/* Champs d'adresse structurés */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Rue et numéro</Label>
                  <Input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Avenue du Grey 62"
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">Code postal</Label>
                    <Input
                      type="text"
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Ex: 1018"
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">Ville</Label>
                    <Input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: Lausanne"
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">Pays</Label>
                    <Input
                      type="text"
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Ex: Switzerland"
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Champ location en lecture seule si adresse structurée disponible */}
                {location && hasStructuredAddress && (
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium text-gray-500">
                      Localisation originale (remplacée par l'adresse structurée ci-dessus)
                    </Label>
                    <Input
                      type="text"
                      id="location"
                      value={location}
                      className="border-gray-200 bg-gray-50 text-gray-600"
                      readOnly
                    />
                  </div>
                )}
                
                {/* Champ location principal si pas d'adresse structurée */}
                {location && !hasStructuredAddress && (
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
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                )}
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
