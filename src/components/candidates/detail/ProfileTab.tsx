
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
import { User, Briefcase, MapPin, Calendar, DollarSign, Clock, FileText, Save, RotateCcw, Phone, Home, Mail, AlertCircle } from 'lucide-react';

interface ProfileTabProps {
  candidate: CandidateData;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  candidate,
  isLoading,
  onRefresh
}) => {
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
  const [hasAddressData, setHasAddressData] = useState(false);
  const { user } = useAuth();

  // Load candidate data with improved address handling
  useEffect(() => {
    if (!candidate) return;

    console.log('📋 Loading candidate data:', {
      name: `${candidate.first_name} ${candidate.last_name}`,
      address: candidate.address || 'Empty',
      postal_code: candidate.postal_code || 'Empty',
      city: candidate.city || 'Empty',
      country: candidate.country || 'Empty'
    });

    setFirstName(candidate.first_name || '');
    setLastName(candidate.last_name || '');
    setEmail(candidate.email || '');
    setPhone(candidate.phone || '');
    setPosition(candidate.position || '');
    setLocation(candidate.location || '');
    
    // Handle address fields with proper null/empty checking
    const candidateAddress = candidate.address || '';
    const candidatePostalCode = candidate.postal_code || '';
    const candidateCity = candidate.city || '';
    const candidateCountry = candidate.country || '';
    
    setAddress(candidateAddress);
    setPostalCode(candidatePostalCode);
    setCity(candidateCity);
    setCountry(candidateCountry);
    
    // Check if we have any meaningful address data
    const hasAnyAddressData = candidateAddress.trim() !== '' || 
                             candidatePostalCode.trim() !== '' || 
                             candidateCity.trim() !== '' || 
                             candidateCountry.trim() !== '';
    
    setHasAddressData(hasAnyAddressData);
    
    setYearsExperience(candidate.years_experience || 0);
    setSalaryExpectation(candidate.salary_expectations || '');
    setAvailability(candidate.availability || '');
    setNotes(candidate.notes || '');
  }, [candidate]);

  const handleSave = async () => {
    if (!candidate.id || !user?.id) return;
    
    try {
      setIsSaving(true);
      console.log('💾 Saving candidate data with address:', {
        address,
        postal_code: postalCode,
        city,
        country
      });
      
      const updateData = {
        id: candidate.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        position: position,
        location: location,
        address: address.trim(),
        postal_code: postalCode.trim(),
        city: city.trim(),
        country: country.trim(),
        years_experience: yearsExperience,
        salary_expectations: salaryExpectation,
        availability: availability,
        notes: notes
      };
      
      await candidateService.updateCandidate(updateData);
      
      toast({
        title: "Profil mis à jour",
        description: "Les informations du candidat ont été mises à jour avec succès."
      });
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("❌ Error updating candidate:", error);
      toast({
        title: "Erreur de mise à jour",
        description: error.message || "Une erreur s'est produite lors de la mise à jour du profil.",
        variant: "destructive"
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
                  <Input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Nom</Label>
                  <Input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: +41 22 123 45 67" className="border-gray-300 focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Section Adresse avec indicateur de statut */}
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Home className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                {!hasAddressData && (
                  <div className="flex items-center gap-1 text-amber-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Données manquantes</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Rue et numéro</Label>
                  <Input 
                    type="text" 
                    id="address" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="Ex: Rue des Exemples 123" 
                    className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${!address ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">Code postal</Label>
                  <Input 
                    type="text" 
                    id="postalCode" 
                    value={postalCode} 
                    onChange={e => setPostalCode(e.target.value)} 
                    placeholder="Ex: 1234" 
                    className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${!postalCode ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700">Ville</Label>
                  <Input 
                    type="text" 
                    id="city" 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    placeholder="Ex: Genève" 
                    className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${!city ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium text-gray-700">Pays</Label>
                  <Input 
                    type="text" 
                    id="country" 
                    value={country} 
                    onChange={e => setCountry(e.target.value)} 
                    placeholder="Ex: Suisse" 
                    className={`border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 ${!country ? 'bg-gray-50' : ''}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localisation (format libre)
                </Label>
                <Input 
                  type="text" 
                  id="location" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  placeholder="Ex: Geneva, Switzerland" 
                  className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" 
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
                  <Input type="text" id="position" value={position} onChange={e => setPosition(e.target.value)} className="border-gray-300 focus:border-green-500 focus:ring-green-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Années d'expérience
                  </Label>
                  <Input type="number" id="yearsExperience" value={yearsExperience} onChange={e => setYearsExperience(Number(e.target.value))} className="border-gray-300 focus:border-green-500 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryExpectation" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Salaire souhaité
                  </Label>
                  <Input type="text" id="salaryExpectation" value={salaryExpectation} onChange={e => setSalaryExpectation(e.target.value)} className="border-gray-300 focus:border-green-500 focus:ring-green-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Disponibilité
                  </Label>
                  <Input type="text" id="availability" value={availability} onChange={e => setAvailability(e.target.value)} className="border-gray-300 focus:border-green-500 focus:ring-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes personnelles */}
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
                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none" rows={5} placeholder="Ajoutez vos notes personnelles sur ce candidat..." />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions panel */}
        <div className="space-y-6">
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <Button variant="outline" onClick={handleRefresh} disabled={isSaving} className="w-full border-gray-300 hover:bg-gray-50">
                <RotateCcw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardContent>
          </Card>

          <ScoreDisplay candidate={candidate} isLoading={isLoading} onRefresh={handleRefresh} />
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
