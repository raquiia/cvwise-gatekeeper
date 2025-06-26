
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Code, 
  Palette, 
  Users, 
  Brain, 
  Languages,
  Award,
  TrendingUp,
  Star
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';
import { ensureArray } from '@/utils/candidateUtils';

interface AdvancedSkillsSectionProps {
  candidate: CandidateData;
}

const AdvancedSkillsSection: React.FC<AdvancedSkillsSectionProps> = ({ candidate }) => {
  const skills = ensureArray<any>(candidate.skills);
  const languages = ensureArray<any>(candidate.languages);
  
  // Catégoriser les compétences
  const categorizeSkills = (skills: any[]) => {
    const categories = {
      technical: [] as any[],
      software: [] as any[],
      soft: [] as any[],
      other: [] as any[]
    };
    
    skills.forEach(skill => {
      const skillName = typeof skill === 'string' ? skill.toLowerCase() : skill.name?.toLowerCase() || '';
      
      if (skillName.includes('javascript') || skillName.includes('python') || skillName.includes('java') || 
          skillName.includes('react') || skillName.includes('vue') || skillName.includes('developer') ||
          skillName.includes('programming') || skillName.includes('coding')) {
        categories.technical.push(skill);
      } else if (skillName.includes('photoshop') || skillName.includes('figma') || skillName.includes('design') ||
                 skillName.includes('adobe') || skillName.includes('sketch')) {
        categories.software.push(skill);
      } else if (skillName.includes('communication') || skillName.includes('leadership') || 
                 skillName.includes('management') || skillName.includes('teamwork')) {
        categories.soft.push(skill);
      } else {
        categories.other.push(skill);
      }
    });
    
    return categories;
  };

  const categorizedSkills = categorizeSkills(skills);
  
  const getSkillLevel = (skill: any) => {
    if (typeof skill === 'string') return 70; // Valeur par défaut
    return skill.level_numeric || skill.level || 70;
  };

  const SkillCategory = ({ 
    title, 
    icon: Icon, 
    skills, 
    color, 
    bgColor 
  }: { 
    title: string; 
    icon: any; 
    skills: any[]; 
    color: string; 
    bgColor: string; 
  }) => {
    if (skills.length === 0) return null;
    
    return (
      <div className={`bg-gradient-to-br ${bgColor} rounded-xl p-6 border border-opacity-20`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${color} bg-white/50`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <Badge variant="outline" className="ml-auto">
            {skills.length}
          </Badge>
        </div>
        
        <div className="space-y-3">
          {skills.slice(0, 6).map((skill, idx) => {
            const skillName = typeof skill === 'string' ? skill : skill.name || 'Compétence';
            const level = getSkillLevel(skill);
            
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{skillName}</span>
                  <span className="text-xs text-gray-500">{level}%</span>
                </div>
                <Progress value={level} className="h-2" />
              </div>
            );
          })}
          
          {skills.length > 6 && (
            <div className="text-center pt-2">
              <Badge variant="outline" className="text-xs">
                +{skills.length - 6} autres compétences
              </Badge>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-navy/10 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-3 text-navy-dark">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Brain className="w-6 h-6" />
          </div>
          Expertise & Compétences
          <Badge variant="outline" className="ml-auto bg-purple-50 text-purple-700 border-purple-200">
            {skills.length + languages.length} compétences
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Grille des catégories de compétences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkillCategory
            title="Compétences Techniques"
            icon={Code}
            skills={categorizedSkills.technical}
            color="text-blue-600"
            bgColor="from-blue-50 to-cyan-50"
          />
          
          <SkillCategory
            title="Outils & Logiciels"
            icon={Palette}
            skills={categorizedSkills.software}
            color="text-purple-600"
            bgColor="from-purple-50 to-pink-50"
          />
          
          <SkillCategory
            title="Soft Skills"
            icon={Users}
            skills={categorizedSkills.soft}
            color="text-green-600"
            bgColor="from-green-50 to-emerald-50"
          />
          
          <SkillCategory
            title="Autres Compétences"
            icon={Award}
            skills={categorizedSkills.other}
            color="text-orange-600"
            bgColor="from-orange-50 to-yellow-50"
          />
        </div>

        {/* Langues */}
        {languages.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500 text-white">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Langues</h3>
              <Badge variant="outline" className="ml-auto bg-indigo-50 text-indigo-700">
                {languages.length}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {languages.map((lang: any, idx: number) => {
                const langName = typeof lang === 'string' ? lang : lang.language || 'Langue';
                const level = lang.level || 'Non spécifié';
                
                return (
                  <div key={idx} className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{langName}</span>
                      <Star className="w-4 h-4 text-gold" />
                    </div>
                    <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-600">
                      {level}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message si pas de compétences */}
        {skills.length === 0 && languages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium mb-2">Aucune compétence enregistrée</p>
            <p className="text-sm">Les compétences apparaîtront ici une fois le profil enrichi.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSkillsSection;
