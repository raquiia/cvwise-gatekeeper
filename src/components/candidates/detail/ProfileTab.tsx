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
import { User, Briefcase, MapPin, Calendar, DollarSign, Clock, FileText, Save, RotateCcw, Phone, Home, CheckCircle, Eye, Mail } from 'lucide-react';

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
  const { user } = useAuth();

  // Parse location string to extract structured address
  const parseLocationAddress = (locationStr: string) => {
    if (!locationStr) return null;
    
    console.log('🔍 Parsing location string:', locationStr);
    
    // Pour "Chemin des chaumets 17 1239 Collex, GE" format
    const cleanLocation = locationStr.trim();
    
    // Extraire le code postal (4-5 chiffres)
    const postalMatch = cleanLocation.match(/\b(\d{4,5})\b/);
    const extractedPostalCode = postalMatch ? postalMatch[1] : '';
    
    // Diviser par virgule pour séparer l'adresse principale de la région/pays
    const parts = cleanLocation.split(',').map(p => p.trim());
    
    let streetAddress = '';
    let cityName = '';
    let countryCode = '';
    
    if (parts.length >= 2) {
      // La dernière partie est probablement le pays/région (comme "GE")
      countryCode = parts[parts.length - 1];
      
      // La première partie contient rue + code postal + ville
      const mainPart = parts[0];
      
      if (extractedPostalCode) {
        // Diviser au niveau du code postal
        const postalIndex = mainPart.indexOf(extractedPostalCode);
        if (postalIndex > 0) {
          streetAddress = mainPart.substring(0, postalIndex).trim();
          // Après le code postal c'est la ville
          const afterPostal = mainPart.substring(postalIndex + extractedPostalCode.length).trim();
          cityName = afterPostal;
        }
      }
    }
    
    // Convertir les codes pays
    const countryMap: { [key: string]: string } = {
      'GE': 'Suisse',
      'CH': 'Suisse',
      'FR': 'France',
      'DE': 'Allemagne',
      'IT': 'Italie'
    };
    
    const fullCountry = countryMap[countryCode] || countryCode || '';
    
    const result = {
      address: streetAddress,
      postal_code: extractedPostalCode,
      city: cityName,
      country: fullCountry
    };
    
    console.log('✅ Parsed address result:', result);
    return result;
  };

  // Load candidate data
  useEffect(() => {
    if (!candidate) return;
    
    console.log('🔍 ProfileTab: Loading candidate data:', {
      id: candidate.id,
      location: candidate.location,
      address: candidate.address,
      postal_code: candidate.postal_code,
      city: candidate.city,
      country: candidate.country
    });

    setFirstName(candidate.first_name || '');
    setLastName(candidate.last_name || '');
    setEmail(candidate.email || '');
    setPhone(candidate.phone || '');
    setPosition(candidate.position || '');
    setLocation(candidate.location || '');

    // Pour l'adresse structurée, utiliser les champs de base de données s'ils sont disponibles, sinon analyser location
    const hasStructuredData = candidate.address || candidate.postal_code || candidate.city || candidate.country;
    
    if (hasStructuredData) {
      setAddress(candidate.address || '');
      setPostalCode(candidate.postal_code || '');
      setCity(candidate.city || '');
      setCountry(candidate.country || '');
    } else if (candidate.location) {
      // Analyser la chaîne location pour extraire les données structurées
      const parsed = parseLocationAddress(candidate.location);
      if (parsed) {
        setAddress(parsed.address);
        setPostalCode(parsed.postal_code);
        setCity(parsed.city);
        setCountry(parsed.country);
      }
    } else {
      setAddress('');
      setPostalCode('');
      setCity('');
      setCountry('');
    }

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

  // Obtenir les données d'adresse actuelles (depuis les champs BD ou analysées depuis location)
  const getCurrentAddressData = () => {
    const hasDbData = candidate.address || candidate.postal_code || candidate.city || candidate.country;
    
    if (hasDbData) {
      return {
        address: candidate.address || '',
        postal_code: candidate.postal_code || '',
        city: candidate.city || '',
        country: candidate.country || ''
      };
    } else if (candidate.location) {
      return parseLocationAddress(candidate.location) || {
        address: '',
        postal_code: '',
        city: '',
        country: ''
      };
    }
    
    return {
      address: '',
      postal_code: '',
      city: '',
      country: ''
    };
  };

  const currentAddressData = getCurrentAddressData();

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

          {/* Section Adresse détaillée extraite du CV */}
          <Card className="shadow-sm border border-gray-200/80">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Home className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Adresse détaillée extraite du CV</h3>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Affichage détaillé ligne par ligne des données actuelles */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Adresse extraite du CV :</span>
                </div>
                
                <div className="ml-7 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium w-24">Adresse:</span>
                    <span className="text-sm text-gray-800 font-medium">
                      {currentAddressData.address || 'Non spécifiée'}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium w-24">Code postal:</span>
                    <span className="text-sm text-gray-800 font-medium">
                      {currentAddressData.postal_code || 'Non spécifié'}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium w-24">Ville:</span>
                    <span className="text-sm text-gray-800 font-medium">
                      {currentAddressData.city || 'Non spécifiée'}
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium w-24">Pays:</span>
                    <span className="text-sm text-gray-800 font-medium">
                      {currentAddressData.country || 'Non spécifié'}
                    </span>
                  </div>

                  {/* Debug info */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-400">
                      <div>Location original: {candidate.location || 'Vide'}</div>
                      <div>Données BD: {candidate.address || candidate.postal_code || candidate.city || candidate.country ? 'Présentes' : 'Vides'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Champs d'édition */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Modifier l'adresse</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">Rue et numéro</Label>
                    <Input type="text" id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Chemin des chaumets 17" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">Code postal</Label>
                    <Input type="text" id="postalCode" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="Ex: 1239" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">Ville</Label>
                    <Input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Collex" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">Pays</Label>
                    <Input type="text" id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="Ex: Suisse" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700">Localisation (format libre)</Label>
                  <Input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Geneva, Switzerland" className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

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
