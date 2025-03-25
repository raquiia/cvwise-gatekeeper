
import React, { useState } from 'react';
import { 
  Search, Filter, Download, Upload, UserPlus, MoreHorizontal,
  ChevronDown, CheckCircle, XCircle, Star, Eye, Trash2,
  ArrowUpDown, SlidersHorizontal, MapPin, Briefcase, Calendar,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

const candidatesData = [
  {
    id: 1,
    name: 'Marie Laurent',
    position: 'Chef de projet industriel',
    location: 'Lyon, France',
    experience: '8 ans',
    skills: ['Project Management', 'Agile', 'Leadership'],
    company: 'TechInd SA',
    status: 'active',
    score: 92,
    lastUpdate: '23/07/2023'
  },
  {
    id: 2,
    name: 'Thomas Dubois',
    position: 'PMO Senior',
    location: 'Paris, France',
    experience: '10 ans',
    skills: ['PMO', 'JIRA', 'Scrum'],
    company: 'Consulting Group',
    status: 'active',
    score: 86,
    lastUpdate: '21/07/2023'
  },
  {
    id: 3,
    name: 'Julie Bernard',
    position: 'Project Manager',
    location: 'Marseille, France',
    experience: '6 ans',
    skills: ['Agile', 'Management', 'Industrie'],
    company: 'IndusTech',
    status: 'active',
    score: 78,
    lastUpdate: '20/07/2023'
  },
  {
    id: 4,
    name: 'Nicolas Martin',
    position: 'Directeur de projets',
    location: 'Toulouse, France',
    experience: '12 ans',
    skills: ['Leadership', 'Stratégie', 'PMO'],
    company: 'AeroSpace Inc',
    status: 'active',
    score: 65,
    lastUpdate: '18/07/2023'
  },
  {
    id: 5,
    name: 'Caroline Petit',
    position: 'Ingénieur industriel',
    location: 'Lille, France',
    experience: '4 ans',
    skills: ['Engineering', 'Projets', 'CAD'],
    company: 'TechnoSolutions',
    status: 'inactive',
    score: 54,
    lastUpdate: '15/07/2023'
  },
  {
    id: 6,
    name: 'Antoine Durand',
    position: 'PMO / Chef de projet',
    location: 'Bordeaux, France',
    experience: '7 ans',
    skills: ['PMO', 'Gestion de projet', 'Industrie'],
    company: 'ConsultInd',
    status: 'active',
    score: 81,
    lastUpdate: '14/07/2023'
  },
  {
    id: 7,
    name: 'Camille Leroy',
    position: 'Responsable PMO',
    location: 'Nantes, France',
    experience: '9 ans',
    skills: ['Project Control', 'Leadership', 'Transformation'],
    company: 'TransfoTech',
    status: 'active',
    score: 88,
    lastUpdate: '12/07/2023'
  }
];

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtrer les candidats en fonction des critères de recherche
  const filteredCandidates = candidatesData.filter(candidate => {
    // Filtre par recherche (nom, poste, compétences)
    const matchesSearch = !searchQuery 
      || candidate.name.toLowerCase().includes(searchQuery.toLowerCase())
      || candidate.position.toLowerCase().includes(searchQuery.toLowerCase())
      || candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtre par statut
    const matchesStatus = !selectedStatus || candidate.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-navy-dark mb-1">Candidats</h1>
            <p className="text-muted-foreground">
              Gérez et analysez votre vivier de talents
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Rechercher un candidat..."
                className="input-field pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} className="mr-2" />
                Filtres
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Download size={16} className="mr-2" />
                    Exporter
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload size={16} className="mr-2" />
                    Importer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Link to="/candidates/add">
                <Button className="button-primary flex-1 sm:flex-none">
                  <UserPlus size={18} className="mr-2" />
                  Nouveau
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
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
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
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
        )}
        
        {/* Candidates Table */}
        <div className="glass rounded-xl overflow-hidden">
          {/* Table Header with Sort Controls */}
          <div className="p-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-navy-dark">
                {filteredCandidates.length} candidats
              </span>
              
              <Separator orientation="vertical" className="h-4" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-navy-dark">
                    <span>Statut</span>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                    Tous
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('active')}>
                    <CheckCircle size={14} className="mr-2 text-emerald-500" />
                    Actifs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedStatus('inactive')}>
                    <XCircle size={14} className="mr-2 text-red-500" />
                    Inactifs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
                <ArrowUpDown size={14} className="mr-1" />
                Trier
              </Button>
              
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
                <SlidersHorizontal size={14} className="mr-1" />
                Colonnes
              </Button>
            </div>
          </div>
          
          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-navy/5">
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Nom</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Poste</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Entreprise</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark hidden lg:table-cell">Localisation</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark hidden lg:table-cell">Expérience</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Compétences</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark">Score</th>
                  <th className="text-left p-4 text-sm font-medium text-navy-dark hidden md:table-cell">Mise à jour</th>
                  <th className="text-center p-4 text-sm font-medium text-navy-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-border/10 hover:bg-navy/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy-dark font-medium">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-medium text-navy-dark">{candidate.name}</span>
                          <div className="flex items-center mt-0.5">
                            {candidate.status === 'active' ? (
                              <div className="flex items-center text-xs text-emerald-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></div>
                                Actif
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-red-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></div>
                                Inactif
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-navy-dark">
                      {candidate.position}
                    </td>
                    <td className="p-4 text-navy-dark">
                      {candidate.company}
                    </td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {candidate.location}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">
                      {candidate.experience}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.map((skill, idx) => (
                          <span key={idx} className="inline-block px-2 py-0.5 bg-navy/10 text-navy-dark text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`rating-chip ${
                        candidate.score > 85 ? 'rating-high' : 
                        candidate.score > 65 ? 'rating-medium' : 
                        'rating-low'
                      }`}>
                        <Star size={12} />
                        {candidate.score}%
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {candidate.lastUpdate}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye size={16} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              Éditer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 size={14} className="mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Candidates;
