
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

interface SkillsComparisonProps {
  matchedSkills: string[];
  missingSkills: string[];
  className?: string;
}

const SkillsComparison: React.FC<SkillsComparisonProps> = ({ 
  matchedSkills, 
  missingSkills,
  className 
}) => {
  const hasMatchedSkills = matchedSkills && matchedSkills.length > 0;
  const hasMissingSkills = missingSkills && missingSkills.length > 0;
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Comparaison des compétences
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-3">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Check size={18} className="text-green-600 dark:text-green-500" />
              <h3 className="font-medium">Compétences correspondantes</h3>
            </div>
            
            {hasMatchedSkills ? (
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill, index) => (
                  <Badge 
                    key={`matched-${index}`} 
                    className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                <AlertTriangle size={14} />
                <span>Aucune compétence correspondante trouvée</span>
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <X size={18} className="text-red-600 dark:text-red-500" />
              <h3 className="font-medium">Compétences manquantes</h3>
            </div>
            
            {hasMissingSkills ? (
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill, index) => (
                  <Badge 
                    key={`missing-${index}`} 
                    className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                <Check size={14} className="text-green-600" />
                <span>Toutes les compétences requises sont présentes</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Analyse basée sur le contenu du CV</p>
                <p>Les compétences sont extraites automatiquement du document. Pour une analyse plus précise, assurez-vous que le CV mentionne clairement les compétences techniques.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillsComparison;
