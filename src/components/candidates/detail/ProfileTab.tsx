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
import { User, Briefcase, MapPin, Calendar, DollarSign, Clock, FileText, Save, RotateCcw, Phone, Home, CheckCircle, Eye } from 'lucide-react';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [availability, setAvailability] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const { user } = useAuth();
  
  // Update local state when candidate prop changes - CORRECTION CRITIQUE
  useEffect(() => {
    if (!candidate) {
      console.log('🔍 ProfileTab: No candidate data provided');
      return;
    }
    
    console.log('🔍 ProfileTab: Updating states with candidate data:', {
      candidateId: candidate.id,
      address: candidate.address,
      postal_code: candidate.postal_code,
      city: candidate.city,
      country: candidate.country,
      location: candidate.location
    });
    
    // CORRECTION: Mise à jour OBLIGATOIRE de TOUS les champs
    setFirstName(candidate.first_name || '');
    setLastName(candidate.last_name || '');
    setEmail(candidate.email || '');
    setPhone(candidate.phone || '');
    setPosition(candidate.position || '');
    setLocation(candidate.location || '');
    
    // CORRECTION CRITIQUE: Mise à jour FORCÉE des champs d'adresse
    const candidateAddress = candidate.address || '';
    const candidatePostalCode = candidate.postal_code || '';
    const candidateCity = candidate.city || '';
    const candidateCountry = candidate.country || '';
    
    console.log('✅ ProfileTab: Setting address fields to:', {
      address: candidateAddress,
      postal_code: candidatePostalCode,
      city: candidateCity,
      country: candidateCountry
    });
    
    setAddress(candidateAddress);
    setPostalCode(candidatePostalCode);
    setCity(candidateCity);
    setCountry(candidateCountry);
    
    setYearsExperience(candidate.years_experience || 0);
    setSalaryExpectation(candidate.salary_expectations || '');
    setAvailability(candidate.availability || '');
    setNotes(candidate.notes || '');
    
    console.log('✅ ProfileTab: All states updated successfully');
  }, [candidate.id, candidate.address, candidate.postal_code, candidate.city, candidate.country, candidate.location, candidate.first_name, candidate.last_name, candidate.email, candidate.phone, candidate.position, candidate.years_experience, candidate.salary_expectations, candidate.availability, candidate.notes]);
  
  // Auto-complete country when city changes
  useEffect(() => {
    if (city && !country) {
      const suggestedCountry = getCountryForCity(city);
      if (suggestedCountry) {
        console.log(`🌍 Auto-completing country for ${city}: ${suggestedCountry}`);
        setCountry(suggestedCountry);
      }
    }
  }, [city, country]);
  
  // Debug current address state
  const completeFormattedAddress = formatCompleteAddress(address, postalCode, city, country);
  const hasAnyAddressData = Boolean(address || postalCode || city || country || location);
  
  console.log('📍 Current form state vs candidate data:', {
    formState: { address, postal_code: postalCode, city, country, location },
    candidateData: { 
      address: candidate.address, 
      postal_code: candidate.postal_code, 
      city: candidate.city, 
      country: candidate.country, 
      location: candidate.location 
    },
    completeFormattedAddress,
    hasAnyAddressData
  });

  const handleSave = async () => {
    if (!candidate.id || !user?.id) return;
    
    try {
      setIsSaving(true);
      console.log('💾 ProfileTab: Saving candidate with address data:', {
        address,
        postal_code: postalCode,
        city,
        country,
        location
      });
      
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
      
      console.log('📤 ProfileTab: Complete update data:', updateData);
      
      await candidateService.updateCandidate(updateData);
      
      toast({
        title: "Profil mis à jour",
        description: "Les informations du candidat ont été mises à jour avec succès.",
      });
      
      // Refresh the data to ensure consistency
      if (onRefresh) {
        console.log('🔄 ProfileTab: Calling onRefresh to reload data');
        onRefresh();
      }
    } catch (error: any) {
      console.error("❌ Error updating candidate:", error);
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

          {/* Section Adresse avec correction */}
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Home className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Adresse complète</h3>
                </div>
                <div className="flex items-center gap-2">
                  {hasAnyAddressData && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Données extraites</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Debug
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Affichage systématique des données extraites */}
              {hasAnyAddressData && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-emerald-800 flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4" />
                    📍 Informations d'adresse extraites
                  </Label>
                  
                  {/* Adresse complète formatée si disponible */}
                  {completeFormattedAddress && (
                    <div className="mb-4 p-3 bg-white rounded border border-emerald-300">
                      <div className="text-lg font-bold text-emerald-800">
                        🏠 {completeFormattedAddress}
                      </div>
                    </div>
                  )}
                  
                  {/* Détails par champ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {address && (
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-emerald-600 font-medium">🏠 Rue:</span>
                        <div className="text-emerald-800 font-medium">{address}</div>
                      </div>
                    )}
                    {postalCode && (
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-emerald-600 font-medium">📮 Code postal:</span>
                        <div className="text-emerald-800 font-medium">{postalCode}</div>
                      </div>
                    )}
                    {city && (
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-emerald-600 font-medium">🏙️ Ville:</span>
                        <div className="text-emerald-800 font-medium">{city}</div>
                      </div>
                    )}
                    {country && (
                      <div className="bg-white p-2 rounded border border-emerald-200">
                        <span className="text-emerald-600 font-medium">🌍 Pays:</span>
                        <div className="text-emerald-800 font-medium">{country}</div>
                      </div>
                    )}
                    {location && (
                      <div className="bg-white p-2 rounded border border-emerald-200 md:col-span-2">
                        <span className="text-emerald-600 font-medium">📍 Localisation:</span>
                        <div className="text-emerald-800 font-medium">{location}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Debug des données brutes */}
              {showRawData && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Données brutes (Debug)</Label>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
{JSON.stringify({
  address: candidate.address,
  postal_code: candidate.postal_code, 
  city: candidate.city,
  country: candidate.country,
  location: candidate.location
}, null, 2)}
                  </pre>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block mt-4">États locaux actuels</Label>
                  <pre className="text-xs text-blue-600 whitespace-pre-wrap">
{JSON.stringify({
  address: address,
  postal_code: postalCode,
  city: city,
  country: country,
  location: location
}, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Champs d'édition - CORRECTION: VALEURS PRÉ-REMPLIES */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-medium text-gray-800">Modifier l'adresse</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Rue et numéro</Label>
                  <Input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={!address ? "Ex: Rue Philippe-Plantamour 17" : ''}
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
                      placeholder={!postalCode ? "Ex: 1201" : ''}
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
                      placeholder={!city ? "Ex: Geneva" : ''}
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
                      placeholder={!country ? "Ex: Switzerland" : ''}
                      className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Champ location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localisation (format libre)
                  </Label>
                  <Input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={!location ? "Ex: Geneva, Switzerland" : ''}
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
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
