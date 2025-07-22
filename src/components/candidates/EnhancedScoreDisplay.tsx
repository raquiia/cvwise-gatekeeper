
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, TrendingUp, Award, MapPin, GraduationCap, Target } from 'lucide-react';
import { getSkillsSuggestions } from '@/services/data/candidate-matching/skillsMatchingUtils';

interface EnhancedScoreDisplayProps {
  score: number;
  breakdown?: {
    skills?: number;
    experience?: number;
    education?: number;
    location?: number;
    profileSummary?: number;
    cvStructure?: number;
  };
  explanation?: string;
  candidateSkills?: string[];
  jobRequiredSkills?: string[];
  jobPreferredSkills?: string[];
  isJobSpecific?: boolean;
}

const EnhancedScoreDisplay: React.FC<EnhancedScoreDisplayProps> = ({
  score,
  breakdown,
  explanation,
  candidateSkills = [],
  jobRequiredSkills = [],
  jobPreferredSkills = [],
  isJobSpecific = false
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 55) return 'text-amber-600 bg-amber-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (isJobSpecific) {
      if (score >= 85) return 'Candidat idéal';
      if (score >= 70) return 'Très bon match';
      if (score >= 55) return 'Match correct';
      if (score >= 40) return 'Match partiel';
      return 'Match faible';
    } else {
      if (score >= 85) return 'Profil excellent';
      if (score >= 70) return 'Très bon profil';
      if (score >= 55) return 'Bon profil';
      if (score >= 40) return 'Profil à développer';
      return 'Profil incomplet';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 55) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Générer des suggestions d'amélioration
  const suggestions = isJobSpecific && candidateSkills.length > 0 ? 
    getSkillsSuggestions(candidateSkills, [...jobRequiredSkills, ...jobPreferredSkills]) : 
    null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {isJobSpecific ? 'Score de correspondance' : 'Score de complétude'}
          </CardTitle>
          <Badge className={`px-3 py-1 text-sm font-bold ${getScoreColor(score)}`}>
            {score}/100
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{getScoreLabel(score)}</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Score global avec indicateur visuel */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Score global</span>
            <span className="font-semibold">{score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Breakdown détaillé */}
        {breakdown && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp size={16} />
              Détail par catégorie
            </h4>
            
            <div className="grid grid-cols-1 gap-3">
              {breakdown.skills !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-blue-500" />
                    <span className="text-sm">Compétences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.skills} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{breakdown.skills}</span>
                  </div>
                </div>
              )}
              
              {breakdown.experience !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-purple-500" />
                    <span className="text-sm">Expérience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.experience} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{breakdown.experience}</span>
                  </div>
                </div>
              )}
              
              {breakdown.education !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} className="text-green-500" />
                    <span className="text-sm">Formation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.education} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{breakdown.education}</span>
                  </div>
                </div>
              )}
              
              {breakdown.location !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-red-500" />
                    <span className="text-sm">Localisation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={breakdown.location} className="w-20 h-2" />
                    <span className="text-xs font-medium w-8">{breakdown.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Explication IA */}
        {explanation && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Analyse détaillée</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
          </div>
        )}

        {/* Suggestions d'amélioration */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 flex items-center gap-2">
              <Lightbulb size={16} />
              Suggestions d'amélioration
            </h4>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedScoreDisplay;
