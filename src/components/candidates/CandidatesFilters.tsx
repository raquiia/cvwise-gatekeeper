
import React, { useState } from 'react';
import { MapPin, Briefcase, Calendar, X, Filter, Check, Building, History, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CandidatesFiltersProps {
  showFilters: boolean;
  onLocationChange: (location: string) => void;
  onCompanyChange: (company: string) => void;
  onPreviousCompanyChange: (company: string) => void;
  onExperienceChange: (experience: string) => void;
  onSkillsChange: (skills: string[]) => void;
  onSemanticSearchChange: (query: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  location: string;
  company: string;
  previousCompany: string;
  experience: string;
  semanticSearch: string;
  selectedSkills: string[];
}

const CandidatesFilters: React.FC<CandidatesFiltersProps> = ({
  showFilters,
  onLocationChange,
  onCompanyChange,
  onPreviousCompanyChange,
  onExperienceChange,
  onSkillsChange,
  onSemanticSearchChange,
  onApplyFilters,
  onResetFilters,
  location,
  company,
  previousCompany,
  experience,
  semanticSearch,
  selectedSkills
}) => {
  const [skillInput, setSkillInput] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  const skillOptions = ['Project Management', 'Agile', 'Leadership', 'JIRA', 'PMO', 'Scrum', 'Industrie', 'Marketing', 'Sales', 'Finance', 'HR', 'Legal', 'IT', 'Engineering', 'Design', 'Communication'];
  
  const filteredSkills = skillOptions.filter(skill => 
    !selectedSkills.includes(skill) && 
    skill.toLowerCase().includes(skillInput.toLowerCase())
  );
  
  const handleAddSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      onSkillsChange([...selectedSkills, skill]);
    }
  };
  
  const handleRemoveSkill = (skill: string) => {
    onSkillsChange(selectedSkills.filter(s => s !== skill));
  };
  
  const handleCustomSkillAdd = () => {
    if (skillInput && !selectedSkills.includes(skillInput)) {
      handleAddSkill(skillInput);
      setSkillInput('');
    }
  };
  
  if (!showFilters) return null;
  
  return (
    <div className="glass rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-navy-dark">Filtres avancés</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-muted-foreground hover:text-navy-dark"
          onClick={onResetFilters}
        >
          Réinitialiser
        </Button>
      </div>
      
      <div className="mb-4">
        <label className="label text-sm text-muted-foreground mb-1.5">Recherche sémantique</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Ex: chef de projet ferroviaire, développeur fullstack santé..."
            className="input-field pl-10"
            value={semanticSearch}
            onChange={(e) => onSemanticSearchChange(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Trouvez des candidats avec des profils similaires, même s'ils n'utilisent pas exactement les mêmes termes
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label text-sm text-muted-foreground mb-1.5">Localisation</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Ville, pays..."
              className="input-field pl-10"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label className="label text-sm text-muted-foreground mb-1.5">Entreprise actuelle</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Nom de l'entreprise actuelle..."
              className="input-field pl-10"
              value={company}
              onChange={(e) => onCompanyChange(e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <label className="label text-sm text-muted-foreground mb-1.5">Expérience</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Select 
              value={experience} 
              onValueChange={onExperienceChange}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Toutes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="1-3">1-3 ans</SelectItem>
                <SelectItem value="4-6">4-6 ans</SelectItem>
                <SelectItem value="7-10">7-10 ans</SelectItem>
                <SelectItem value="10+">10+ ans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <label className="label text-sm text-muted-foreground mb-1.5">A travaillé pour</label>
        <div className="relative">
          <History className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Nom d'une entreprise précédente..."
            className="input-field pl-10"
            value={previousCompany}
            onChange={(e) => onPreviousCompanyChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="mt-4">
        <label className="label text-sm text-muted-foreground mb-1.5">Compétences</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSkills.map((skill, idx) => (
            <div 
              key={idx} 
              className="px-3 py-1.5 bg-navy/10 text-navy-dark text-sm rounded-full flex items-center gap-1"
            >
              {skill}
              <button 
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-navy/30 ml-1"
                onClick={() => handleRemoveSkill(skill)}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Ajouter une compétence..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomSkillAdd();
                }
              }}
            />
            {skillInput && (
              <div className="absolute w-full bg-white rounded-md shadow-md mt-1 z-10 max-h-52 overflow-y-auto">
                {filteredSkills.map((skill, idx) => (
                  <div 
                    key={idx}
                    className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                    onClick={() => {
                      handleAddSkill(skill);
                      setSkillInput('');
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="button" onClick={handleCustomSkillAdd}>
            Ajouter
          </Button>
        </div>
      </div>
      
      <Collapsible 
        open={advancedOpen} 
        onOpenChange={setAdvancedOpen}
        className="mt-4"
      >
        <div className="flex justify-between items-center">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-navy-dark">
              <Filter size={16} />
              {advancedOpen ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés'}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-sm text-muted-foreground mb-1.5">Statut du candidat</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="qualification">En qualification</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="label text-sm text-muted-foreground mb-1.5">Type de contrat</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cdi">CDI</SelectItem>
                  <SelectItem value="cdd">CDD</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="stage">Stage</SelectItem>
                  <SelectItem value="alternance">Alternance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      <div className="mt-4 flex justify-end">
        <Button 
          className="button-primary"
          onClick={onApplyFilters}
        >
          <Check size={16} className="mr-1" />
          Appliquer les filtres
        </Button>
      </div>
    </div>
  );
};

export default CandidatesFilters;
