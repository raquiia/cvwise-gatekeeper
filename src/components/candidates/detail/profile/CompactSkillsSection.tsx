
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface CompactSkillsSectionProps {
  candidate: CandidateData;
}

const CompactSkillsSection: React.FC<CompactSkillsSectionProps> = ({ candidate }) => {
  const skills = ensureArray<any>(candidate.skills);

  if (skills.length === 0) {
    return null;
  }

  // Grouper les compétences par niveau si disponible
  const skillsByLevel = skills.reduce((acc: any, skill: any) => {
    const skillData = typeof skill === 'string' ? { name: skill, level: 'Non spécifié' } : skill;
    const level = skillData.level || 'Non spécifié';
    if (!acc[level]) acc[level] = [];
    acc[level].push(skillData.name || skillData.skill || skill);
    return acc;
  }, {});

  const levelOrder = ['Expert', 'Confirmé', 'Avancé', 'Intermédiaire', 'Débutant', 'Non spécifié'];
  const sortedLevels = levelOrder.filter(level => skillsByLevel[level]);

  return (
    <Card className="border-navy/10 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-3 text-navy-dark">
          <div className="p-2 rounded-lg bg-gradient-to-br from-gold/10 to-gold/20 text-gold">
            <Star className="w-5 h-5" />
          </div>
          Compétences ({skills.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedLevels.map((level) => (
          <div key={level} className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-navy" />
              <span className="text-sm font-semibold text-navy-dark">{level}</span>
              <span className="text-xs text-muted-foreground">({skillsByLevel[level].length})</span>
            </div>
            <div className="flex flex-wrap gap-2 ml-6">
              {skillsByLevel[level].map((skillName: string, idx: number) => (
                <Badge 
                  key={idx}
                  variant={level === 'Expert' ? 'default' : 'secondary'}
                  className={`text-xs ${
                    level === 'Expert' 
                      ? 'bg-gradient-to-r from-gold to-gold/80 text-white border-gold/20' 
                      : level === 'Confirmé' || level === 'Avancé'
                      ? 'bg-navy/10 text-navy border-navy/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {skillName}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CompactSkillsSection;
