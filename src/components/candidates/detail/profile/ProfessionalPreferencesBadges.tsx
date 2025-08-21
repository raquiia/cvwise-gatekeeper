import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar, 
  Car, 
  Home, 
  FileText,
  Clock
} from 'lucide-react';
import { CandidateData } from '@/services/data/candidateService';

interface ProfessionalPreferencesBadgesProps {
  candidate: CandidateData;
}

const ProfessionalPreferencesBadges: React.FC<ProfessionalPreferencesBadgesProps> = ({ candidate }) => {
  const preferences = [
    {
      key: 'salary',
      value: candidate.salary_expectations,
      icon: DollarSign,
      color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
      label: 'Prétentions'
    },
    {
      key: 'availability',
      value: candidate.availability,
      icon: Calendar,
      color: 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 border-blue-200',
      label: 'Disponibilité'
    },
    {
      key: 'mobility',
      value: candidate.mobility,
      icon: Car,
      color: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200',
      label: 'Mobilité'
    },
    {
      key: 'remote',
      value: candidate.remote_preference,
      icon: Home,
      color: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
      label: 'Télétravail'
    },
    {
      key: 'contract',
      value: candidate.contract_type,
      icon: FileText,
      color: 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200',
      label: 'Contrat'
    }
  ];

  const visiblePreferences = preferences.filter(pref => pref.value && pref.value.trim());

  if (visiblePreferences.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-navy/5 via-purple/5 to-pink/5 rounded-xl p-6 border border-navy/10 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-navy to-navy-dark text-white shadow-sm">
          <Clock className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-navy-dark">Préférences Professionnelles</h3>
        <Badge variant="outline" className="bg-navy/10 text-navy border-navy/20">
          Issues des entretiens
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {visiblePreferences.map((pref) => {
          const IconComponent = pref.icon;
          return (
            <div
              key={pref.key}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-sm border transition-all hover:shadow-md ${pref.color}`}
            >
              <IconComponent className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-xs opacity-75">{pref.label}:</span>
              <span className="font-semibold">{pref.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProfessionalPreferencesBadges;