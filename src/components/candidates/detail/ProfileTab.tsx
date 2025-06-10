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
  
  // Charger TOUTES les données du candidat
  useEffect(() => {
    if (!candidate) return;
    
    console.log('🔍 ProfileTab: Chargement des données candidat:', {
      id: candidate.id,
      address: candidate.address,
      postal_code: candidate.postal_code,
      city: candidate.city,
      country: candidate.country,
      location: candidate.location
    });
    
    // Charger tous les champs
    setFirstName(candidate.first_name || '');
    setLastName(candidate.last_name || '');
    setEmail(candidate.email || '');
    setPhone(candidate.phone || '');
    setPosition(candidate.position || '');
    setLocation(candidate.location || '');
    
    // Charger les données d'adresse structurées DIRECTEMENT depuis la base
    setAddress(candidate.address || '');
    setPostalCode(candidate.postal_code || '');
    setCity(candidate.city || '');
    setCountry(candidate.country || '');
    
    setYearsExperience(candidate.years_experience || 0);
    setSalaryExpectation(candidate.salary_expectations || '');
    setAvailability(candidate.availability || '');
    setNotes(candidate.notes || '');
  }, [candidate]);

  const handleSave = async () => {
    if (!candidate.id || !user?.id) return;
    
    try {
      setIsSaving(true);
      
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
      
      await candidateService.updateCandidate(updateData);
      
      toast({
        title: "Profil mis à jour",
        description: "Les informations du candidat ont été mises à jour avec succès.",
      });
      
      if (onRefresh) {
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

  // Construire l'adresse complète DIRECTEMENT depuis les données de la base
  const buildRealAddress = () => {
    const addressParts = [];
    
    // Utiliser DIRECTEMENT les vraies valeurs depuis la base de données
    if (candidate.address) addressParts.push(candidate.address);
    if (candidate.postal_code && candidate.city) {
      addressParts.push(`${candidate.postal_code} ${candidate.city}`);
    } else if (candidate.city) {
      addressParts.push(candidate.city);
    }
    if (candidate.country) addressParts.push(candidate.country);
    
    return addressParts.length > 0 ? addressParts.join(', ') : candidate.location || 'Adresse non spécifiée';
  };

  const realCompleteAddress = buildRealAddress();
  const hasRealStructuredData = Boolean(candidate.address || candidate.postal_code || candidate.city || candidate.country);
  
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
                  placeholder="Ex: +41 22 123 45 67"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Adresse COMPLÈTEMENT REFAITE */}
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
                  {hasRealStructuredData && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Extraite du CV</span>
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
              
              {/* Affichage de l'adresse complète RÉELLE */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                <Label className="text-sm font-medium text-emerald-800 flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4" />
                  📍 Adresse extraite du CV
                </Label>
                
                <div className="bg-white rounded-lg border-2 border-emerald-300 p-4">
                  <div className="text-2xl font-bold text-emerald-800 mb-2">
                    🏠 {realCompleteAddress}
                  </div>
                  {hasRealStructuredData ? (
                    <div className="text-sm text-emerald-600">
                      ✅ Adresse complète extraite et structurée
                    </div>
                  ) : (
                    <div className="text-sm text-amber-600">
                      ⚠️ Localisation générale uniquement
                    </div>
                  )}
                </div>
                
                {/* Affichage des données structurées RÉELLES */}
                {hasRealStructuredData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {candidate.address && (
                      <div className="bg-white p-3 rounded border border-emerald-200">
                        <div className="text-emerald-600 font-medium text-xs">🏠 RUE</div>
                        <div className="text-emerald-800 font-bold">{candidate.address}</div>
                      </div>
                    )}
                    {candidate.postal_code && (
                      <div className="bg-white p-3 rounded border border-emerald-200">
                        <div className="text-emerald-600 font-medium text-xs">📮 CODE</div>
                        <div className="text-emerald-800 font-bold">{candidate.postal_code}</div>
                      </div>
                    )}
                    {candidate.city && (
                      <div className="bg-white p-3 rounded border border-emerald-200">
                        <div className="text-emerald-600 font-medium text-xs">🏙️ VILLE</div>
                        <div className="text-emerald-800 font-bold">{candidate.city}</div>
                      </div>
                    )}
                    {candidate.country && (
                      <div className="bg-white p-3 rounded border border-emerald-200">
                        <div className="text-emerald-600 font-medium text-xs">🌍 PAYS</div>
                        <div className="text-emerald-800 font-bold">{candidate.country}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Debug des données brutes DIRECTES */}
              {showRawData && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Données brutes de la base</Label>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
{JSON.stringify({
  'candidate.address': candidate.address,
  'candidate.postal_code': candidate.postal_code, 
  'candidate.city': candidate.city,
  'candidate.country': candidate.country,
  'candidate.location': candidate.location
}, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Champs d'édition avec vraies valeurs pré-remplies */}
              <div className="space-y-4 border-t pt-6">
                <Label className="text-base font-medium text-gray-800">Modifier l'adresse</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Rue et numéro</Label>
                  <Input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Chemin des chaumets 17"
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
                      placeholder="Ex: 1239"
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
                      placeholder="Ex: Collex"
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
                    placeholder="Ex: Geneva, Switzerland"
                    className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ... keep existing code (professional info card) */}
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

          {/* ... keep existing code (notes card) */}
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
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
                  rows={5}
                  placeholder="Ajoutez vos notes personnelles sur ce candidat..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ... keep existing code (sidebar with actions and score) */}
        <div className="space-y-6">
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
