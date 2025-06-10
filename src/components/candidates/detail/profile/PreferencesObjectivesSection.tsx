
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Heart, User, BookOpen } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { safeString, ensureArray } from '@/utils/candidateUtils';

interface PreferencesObjectivesSectionProps {
  candidate: CandidateData;
}

const PreferencesObjectivesSection: React.FC<PreferencesObjectivesSectionProps> = ({ candidate }) => {
  const career_objectives = safeString(candidate.career_objectives);
  const professional_values = safeString(candidate.professional_values);
  const interests = safeString(candidate.interests);
  const continuous_training = ensureArray<any>(candidate.continuous_training);

  const hasObjectives = career_objectives.trim().length > 0;
  const hasValues = professional_values.trim().length > 0;
  const hasInterests = interests.trim().length > 0;
  const hasTraining = continuous_training.length > 0;

  const hasContent = hasObjectives || hasValues || hasInterests || hasTraining;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-navy/10 text-navy">
            <Target className="w-5 h-5" />
          </div>
          Préférences & Objectifs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Objectifs de carrière */}
        {hasObjectives && (
          <div className="space-y-3">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objectifs de carrière
            </h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-navy-dark leading-relaxed whitespace-pre-wrap">{career_objectives}</p>
            </div>
          </div>
        )}

        {/* Valeurs professionnelles */}
        {hasValues && (
          <div className="space-y-3">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Valeurs professionnelles
            </h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-navy-dark leading-relaxed whitespace-pre-wrap">{professional_values}</p>
            </div>
          </div>
        )}

        {/* Centres d'intérêt */}
        {hasInterests && (
          <div className="space-y-3">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Centres d'intérêt
            </h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-navy-dark leading-relaxed whitespace-pre-wrap">{interests}</p>
            </div>
          </div>
        )}

        {/* Formation continue */}
        {hasTraining && (
          <div className="space-y-4">
            <h4 className="font-semibold text-navy-dark border-b border-navy/10 pb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Formation continue ({continuous_training.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {continuous_training.map((training: any, idx: number) => (
                <div key={idx} className="p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-start">
                    <BookOpen className="mr-3 text-navy h-5 w-5 mt-1 flex-shrink-0" />
                    <div className="space-y-1">
                      <h5 className="font-medium text-navy-dark">
                        {typeof training === 'string' ? 
                          training : 
                          training.name || training.title || 'Formation'}
                      </h5>
                      {training.provider && (
                        <p className="text-sm text-navy">{training.provider}</p>
                      )}
                      {training.date && (
                        <p className="text-xs text-muted-foreground">{training.date}</p>
                      )}
                      {training.duration && (
                        <p className="text-xs text-muted-foreground">Durée : {training.duration}</p>
                      )}
                      {training.description && (
                        <p className="text-sm text-navy-dark mt-2">{training.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreferencesObjectivesSection;
