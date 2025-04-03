
import React from 'react';
import { MapPin, Briefcase, Calendar, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CandidatesFiltersProps {
  showFilters: boolean;
}

const CandidatesFilters: React.FC<CandidatesFiltersProps> = ({ showFilters }) => {
  if (!showFilters) return null;
  
  return (
    <div className="glass rounded-lg p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-navy-dark">Filtres avancés</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-muted-foreground hover:text-navy-dark"
        >
          Réinitialiser
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Localisation</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Ville, pays..."
              className="input-field pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="label">Entreprise</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Nom de l'entreprise..."
              className="input-field pl-10"
            />
          </div>
        </div>
        
        <div>
          <label className="label">Expérience</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <select className="input-field pl-10 w-full appearance-none pr-10">
              <option value="">Toutes</option>
              <option value="1-3">1-3 ans</option>
              <option value="4-6">4-6 ans</option>
              <option value="7-10">7-10 ans</option>
              <option value="10+">10+ ans</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <label className="label">Compétences</label>
        <div className="flex flex-wrap gap-2">
          {['Project Management', 'Agile', 'Leadership', 'JIRA', 'PMO', 'Scrum', 'Industrie'].map((skill, idx) => (
            <div 
              key={idx} 
              className="px-3 py-1.5 bg-navy/10 text-navy-dark text-sm rounded-full flex items-center gap-1 cursor-pointer hover:bg-navy/20 transition-colors"
            >
              {skill}
              <div className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-navy/30">
                <Plus size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button className="button-primary">
          Appliquer les filtres
        </Button>
      </div>
    </div>
  );
};

export default CandidatesFilters;
