import React, { useState } from 'react';
import { Linkedin, Sparkles, Copy, FileText, Camera, Import } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { extractLinkedInDataFromUrl, parseLinkedInText } from '@/services/resume/intelligentLinkedInService';
import ManualLinkedInForm from './ManualLinkedInForm';

interface IntelligentLinkedInExtractorProps {
  userId: string | undefined;
  onAnalysisComplete: (candidateId: string) => void;
}

const IntelligentLinkedInExtractor: React.FC<IntelligentLinkedInExtractorProps> = ({ 
  userId, 
  onAnalysisComplete 
}) => {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('url');
  const [showManualForm, setShowManualForm] = useState(false);
  const { toast } = useToast();

  // Extraction intelligente à partir de l'URL
  const handleUrlExtraction = async () => {
    if (!linkedinUrl.includes('linkedin.com')) {
      toast({
        title: "URL invalide",
        description: "Veuillez saisir une URL LinkedIn valide",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await extractLinkedInDataFromUrl(linkedinUrl);
      setExtractedData(result);
      
      if (result.fullName) {
        toast({
          title: "Extraction réussie",
          description: `Données extraites pour ${result.fullName}`,
        });
      } else {
        toast({
          title: "Extraction partielle",
          description: "Certaines données ont été extraites de l'URL",
        });
      }
    } catch (error: any) {
      console.error('Error extracting from URL:', error);
      toast({
        title: "Erreur d'extraction",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Parsing intelligent du texte collé
  const handleTextParsing = () => {
    if (!pastedText.trim()) {
      toast({
        title: "Texte vide",
        description: "Veuillez coller du texte depuis LinkedIn",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = parseLinkedInText(pastedText);
      setExtractedData(result);
      
      toast({
        title: "Parsing réussi",
        description: `${Object.keys(result).filter(key => result[key]).length} champs détectés`,
      });
    } catch (error: any) {
      console.error('Error parsing text:', error);
      toast({
        title: "Erreur de parsing",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Pré-remplir le formulaire manuel avec les données extraites
  const handleUseExtractedData = () => {
    if (extractedData) {
      setShowManualForm(true);
    }
  };

  if (showManualForm) {
    return (
      <ManualLinkedInForm
        userId={userId}
        linkedinUrl={linkedinUrl}
        initialData={extractedData}
        onAnalysisComplete={onAnalysisComplete}
        onBack={() => setShowManualForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mx-auto mb-4">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Extraction Intelligente LinkedIn</h2>
        <p className="text-muted-foreground">
          Plusieurs méthodes d'extraction pour optimiser vos imports
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Linkedin size={16} />
            URL
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText size={16} />
            Texte
          </TabsTrigger>
          <TabsTrigger value="screenshot" className="flex items-center gap-2">
            <Camera size={16} />
            Capture
          </TabsTrigger>
        </TabsList>

        {/* Extraction par URL */}
        <TabsContent value="url" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="text-[#0077B5]" size={20} />
                Extraction depuis l'URL
              </CardTitle>
              <CardDescription>
                Collez l'URL LinkedIn pour une extraction automatique intelligente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                />
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🧠 Extraction intelligente</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Nom d'utilisateur depuis l'URL</li>
                  <li>• Tentative d'extraction automatique des métadonnées</li>
                  <li>• Patterns avancés pour deviner les informations</li>
                </ul>
              </div>

              <Button 
                onClick={handleUrlExtraction} 
                disabled={!linkedinUrl}
                className="w-full"
              >
                <Sparkles size={16} className="mr-2" />
                Extraire depuis l'URL
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extraction par texte */}
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy size={20} />
                Parsing de texte intelligent
              </CardTitle>
              <CardDescription>
                Copiez-collez le contenu du profil LinkedIn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Collez ici le texte copié depuis LinkedIn&#10;&#10;Exemple:&#10;John Doe&#10;Développeur Full-Stack chez TechCorp&#10;Paris, France&#10;&#10;Expérience:&#10;• Développeur Senior - TechCorp (2020-present)&#10;• Développeur Junior - StartupXYZ (2018-2020)&#10;&#10;Formation:&#10;• Master Informatique - Université Paris Sorbonne"
                className="min-h-[200px] resize-y"
              />
              
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">🔍 Parsing intelligent</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Détection automatique des sections (nom, poste, localisation)</li>
                  <li>• Extraction des expériences avec dates et entreprises</li>
                  <li>• Identification des formations et compétences</li>
                  <li>• Nettoyage et structuration des données</li>
                </ul>
              </div>

              <Button 
                onClick={handleTextParsing} 
                disabled={!pastedText.trim()}
                className="w-full"
              >
                <FileText size={16} className="mr-2" />
                Parser le texte
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extraction par capture d'écran */}
        <TabsContent value="screenshot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera size={20} />
                OCR depuis capture d'écran
              </CardTitle>
              <CardDescription>
                Téléchargez une capture d'écran du profil LinkedIn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Camera size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  Glissez-déposez une capture d'écran
                </p>
                <p className="text-sm text-muted-foreground">
                  Formats acceptés: PNG, JPG, JPEG
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">📷 OCR intelligent</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Reconnaissance optique de caractères avancée</li>
                  <li>• Détection automatique des zones de texte</li>
                  <li>• Extraction des informations structurées</li>
                  <li>• Traitement d'image pour optimiser la lecture</li>
                </ul>
              </div>

              <Button disabled className="w-full">
                <Import size={16} className="mr-2" />
                Fonctionnalité à venir
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Aperçu des données extraites */}
      {extractedData && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-emerald-900">Données extraites</CardTitle>
            <CardDescription className="text-emerald-700">
              Aperçu des informations détectées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {extractedData.fullName && (
                <div>
                  <span className="font-medium">Nom:</span> {extractedData.fullName}
                </div>
              )}
              {extractedData.headline && (
                <div>
                  <span className="font-medium">Poste:</span> {extractedData.headline}
                </div>
              )}
              {extractedData.location && (
                <div>
                  <span className="font-medium">Lieu:</span> {extractedData.location}
                </div>
              )}
              {extractedData.username && (
                <div>
                  <span className="font-medium">Username:</span> {extractedData.username}
                </div>
              )}
            </div>
            
            <Button onClick={handleUseExtractedData} className="w-full">
              <Sparkles size={16} className="mr-2" />
              Utiliser ces données
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fallback vers saisie manuelle */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => setShowManualForm(true)}
          className="mx-auto"
        >
          Passer à la saisie manuelle
        </Button>
      </div>
    </div>
  );
};

export default IntelligentLinkedInExtractor;