
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Briefcase, RefreshCw, Info, Brain } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface AIScoreDisplayProps {
  candidateId: string;
  score: number | null;
  explanation: string;
  breakdown: any;
  isLoading: boolean;
  isJobSpecific: boolean;
  error: string | null;
  onRefresh?: () => void;
}

const AIScoreDisplay: React.FC<AIScoreDisplayProps> = ({
  candidateId,
  score,
  explanation,
  breakdown,
  isLoading,
  isJobSpecific,
  error,
  onRefresh
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(true); // Ouvert par défaut
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de calcul IA</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw size={16} className="mr-2" />
                Réessayer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 mb-4 flex items-center justify-center">
              <Brain className="w-12 h-12 text-purple-600 animate-pulse" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="mt-4 text-sm text-purple-600 font-medium">
              ✨ Analyse IA en cours...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (score === null) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Score IA non calculé</h3>
            <p className="text-sm text-gray-500 mb-4">Cliquez pour calculer le score avec l'IA</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="default" size="sm">
                <Sparkles size={16} className="mr-2" />
                Calculer avec l'IA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getScoreEvaluation = (score: number) => {
    if (score >= 85) {
      return { 
        label: isJobSpecific ? 'Correspondance excellente' : 'Profil excellent', 
        color: 'text-emerald-800', 
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-300'
      };
    } else if (score >= 70) {
      return { 
        label: isJobSpecific ? 'Très bonne correspondance' : 'Très bon profil', 
        color: 'text-green-800', 
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300'
      };
    } else if (score >= 55) {
      return { 
        label: isJobSpecific ? 'Correspondance correcte' : 'Bon profil', 
        color: 'text-amber-800', 
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300'
      };
    } else if (score >= 40) {
      return { 
        label: isJobSpecific ? 'Correspondance partielle' : 'Profil à développer', 
        color: 'text-orange-800', 
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-300'
      };
    } else {
      return { 
        label: isJobSpecific ? 'Correspondance faible' : 'Profil incomplet', 
        color: 'text-red-800', 
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300'
      };
    }
  };
  
  const evaluation = getScoreEvaluation(score);
  
  const scoreComponents = isJobSpecific ? [
    { label: 'Compétences requises', score: breakdown.skills || 0, maxPoints: 25, color: 'text-blue-600' },
    { label: 'Expérience pertinente', score: breakdown.experience || 0, maxPoints: 20, color: 'text-green-600' },
    { label: 'Niveau d\'études', score: breakdown.education || 0, maxPoints: 20, color: 'text-purple-600' },
    { label: 'Localisation', score: breakdown.location || 0, maxPoints: 10, color: 'text-orange-600' },
    { label: 'Langues', score: breakdown.languages || 0, maxPoints: 5, color: 'text-pink-600' },
    { label: 'Adéquation culturelle', score: breakdown.culturalFit || 0, maxPoints: 10, color: 'text-indigo-600' },
    { label: 'Disponibilité', score: breakdown.availability || 0, maxPoints: 5, color: 'text-teal-600' },
    { label: 'Notes d\'entretien', score: breakdown.interviewBonus || 0, maxPoints: 5, color: 'text-yellow-600' }
  ] : [
    { label: 'Formations', score: breakdown.education || 0, maxPoints: 20, color: 'text-purple-600' },
    { label: 'Expériences', score: breakdown.experience || 0, maxPoints: 20, color: 'text-green-600' },
    { label: 'Compétences', score: breakdown.skills || 0, maxPoints: 20, color: 'text-blue-600' },
    { label: 'Langues', score: breakdown.languages || 0, maxPoints: 10, color: 'text-pink-600' },
    { label: 'Localisation/Mobilité', score: breakdown.location || 0, maxPoints: 10, color: 'text-orange-600' },
    { label: 'Résumé professionnel', score: breakdown.profileSummary || 0, maxPoints: 10, color: 'text-indigo-600' },
    { label: 'Structure du CV', score: breakdown.cvStructure || 0, maxPoints: 10, color: 'text-teal-600' }
  ];
  
  return (
    <Card className={`border-2 ${evaluation.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Score IA</CardTitle>
            <Badge variant={isJobSpecific ? "default" : "secondary"} className="text-xs">
              {isJobSpecific ? <Briefcase size={10} className="mr-1" /> : <Target size={10} className="mr-1" />}
              {isJobSpecific ? 'Correspondance' : 'Complétude'}
            </Badge>
          </div>
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 w-8 p-0"
              title="Recalculer avec l'IA"
            >
              <RefreshCw size={14} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 bg-gradient-to-br ${
              score >= 85 ? 'from-emerald-500 to-emerald-600 border-emerald-300' : 
              score >= 70 ? 'from-green-500 to-green-600 border-green-300' :
              score >= 55 ? 'from-amber-500 to-amber-600 border-amber-300' :
              score >= 40 ? 'from-orange-500 to-orange-600 border-orange-300' :
              'from-red-500 to-red-600 border-red-300'
            }`}>
              {score}
              <span className="text-sm ml-1">%</span>
            </div>
            <div className="absolute -bottom-2 -right-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className={`mt-4 px-4 py-2 rounded-full text-sm font-medium ${evaluation.bgColor} ${evaluation.color}`}>
            {evaluation.label}
          </div>
          
          <div className="mt-2 text-xs text-purple-600 font-medium flex items-center gap-1">
            <Brain size={12} />
            Analysé par Intelligence Artificielle
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Détail de l'analyse IA
          </h4>
          
          {scoreComponents.map((component, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{component.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{component.score}/{component.maxPoints}</span>
                  <span className="text-sm font-bold">{Math.round((component.score / component.maxPoints) * 100)}%</span>
                </div>
              </div>
              <Progress 
                value={(component.score / component.maxPoints) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>

        {/* Toujours afficher l'explication si elle existe */}
        {explanation && explanation.trim() && (
          <>
            <Separator className="my-4" />
            
            <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Info size={16} />
                    Analyse détaillée de l'IA
                  </span>
                  <span className="text-xs text-gray-500">
                    {isExplanationOpen ? 'Masquer' : 'Voir'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {explanation}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        <Separator className="my-4" />

        <div className="text-center">
          <div className="text-xs text-gray-500 mb-2">
            {isJobSpecific 
              ? 'Score de correspondance calculé par IA'
              : 'Score de complétude calculé par IA'}
          </div>
          <div className="text-xs text-purple-600 font-medium">
            ✨ Système de scoring intelligent avec OpenAI
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIScoreDisplay;
