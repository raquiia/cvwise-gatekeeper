
import React, { useState } from 'react';
import { 
  Upload, Search, Filter, FileText, Eye, Download, 
  Trash2, Plus, Calendar, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Données fictives des CV
const resumesData = [
  {
    id: 1,
    fileName: 'Marie_Laurent_CV.pdf',
    candidateName: 'Marie Laurent',
    uploadDate: '23/07/2023',
    fileSize: '1.2 MB',
    status: 'analyzed',
    candidateId: 1
  },
  {
    id: 2,
    fileName: 'Thomas_Dubois_CV.pdf',
    candidateName: 'Thomas Dubois',
    uploadDate: '21/07/2023',
    fileSize: '890 KB',
    status: 'analyzed',
    candidateId: 2
  },
  {
    id: 3,
    fileName: 'Julie_Bernard_CV.pdf',
    candidateName: 'Julie Bernard',
    uploadDate: '20/07/2023',
    fileSize: '1.4 MB',
    status: 'analyzed',
    candidateId: 3
  },
  {
    id: 4,
    fileName: 'Nicolas_Martin_CV.pdf',
    candidateName: 'Nicolas Martin',
    uploadDate: '18/07/2023',
    fileSize: '920 KB',
    status: 'analyzed',
    candidateId: 4
  },
  {
    id: 5,
    fileName: 'Caroline_Petit_CV.pdf',
    candidateName: 'Caroline Petit',
    uploadDate: '15/07/2023',
    fileSize: '1.1 MB',
    status: 'analyzed',
    candidateId: 5
  },
  {
    id: 6,
    fileName: 'Antoine_Durand_CV.pdf',
    candidateName: 'Antoine Durand',
    uploadDate: '14/07/2023',
    fileSize: '980 KB',
    status: 'analyzed',
    candidateId: 6
  },
  {
    id: 7,
    fileName: 'Pierre_Lefevre_CV.pdf',
    candidateName: null,
    uploadDate: '10/07/2023',
    fileSize: '1.3 MB',
    status: 'pending',
    candidateId: null
  }
];

const Resumes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  // Filtrer les CV
  const filteredResumes = resumesData.filter(resume => {
    // Filtre par recherche
    const matchesSearch = !searchQuery 
      || (resume.candidateName && resume.candidateName.toLowerCase().includes(searchQuery.toLowerCase()))
      || resume.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtre par statut
    const matchesStatus = !selectedStatus || resume.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-navy-dark mb-1">CV</h1>
            <p className="text-muted-foreground">
              Gérez tous les CV importés dans le système
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Rechercher un CV..."
                className="input-field pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Link to="/resumes/upload">
              <Button className="button-primary">
                <Upload size={18} className="mr-2" />
                Importer un CV
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Filter Bar */}
        <div className="glass rounded-lg p-3 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-navy-dark mr-2">Filtres:</span>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-sm">
                  <Calendar size={16} className="mr-1" />
                  <span>Date</span>
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Aujourd'hui</DropdownMenuItem>
                <DropdownMenuItem>Cette semaine</DropdownMenuItem>
                <DropdownMenuItem>Ce mois-ci</DropdownMenuItem>
                <DropdownMenuItem>Tous</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 text-sm">
                  <span>Statut</span>
                  <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedStatus(null)}>
                  Tous
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('analyzed')}>
                  Analysés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus('pending')}>
                  En attente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground">
              Réinitialiser
            </Button>
          </div>
        </div>
        
        {/* Resumes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Upload Card */}
          <Link to="/resumes/upload" className="glass rounded-xl border-2 border-dashed border-navy/20 flex flex-col items-center justify-center p-6 h-64 hover:border-navy/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mb-3">
              <Plus size={24} className="text-navy" />
            </div>
            <p className="text-navy-dark font-medium mb-1">Importer un CV</p>
            <p className="text-sm text-muted-foreground text-center">
              Glissez-déposez ou cliquez pour sélectionner
            </p>
          </Link>
          
          {/* Resume Cards */}
          {filteredResumes.map((resume) => (
            <div 
              key={resume.id} 
              className="glass rounded-xl overflow-hidden card-hover flex flex-col"
            >
              <div className="p-4 flex-grow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-sand">
                    <FileText size={18} />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye size={14} className="mr-2" />
                        Voir le CV
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download size={14} className="mr-2" />
                        Télécharger
                      </DropdownMenuItem>
                      {resume.status === 'pending' && (
                        <DropdownMenuItem>
                          Analyser
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 size={14} className="mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="font-medium text-navy-dark break-all line-clamp-1 mb-1" title={resume.fileName}>
                  {resume.fileName}
                </h3>
                
                {resume.candidateName ? (
                  <p className="text-sm text-muted-foreground mb-3">
                    Candidat: {resume.candidateName}
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 mb-3 flex items-center">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v4m0 4h.01M5.07 19H19a2 2 0 0 0 1.75-2.98L13.75 4.99a2 2 0 0 0-3.5 0L3.25 16.02A2 2 0 0 0 5.07 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    En attente d'analyse
                  </p>
                )}
                
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar size={12} className="mr-1" />
                  Importé le {resume.uploadDate}
                </div>
                
                <div className="text-xs text-muted-foreground mt-1">
                  Taille: {resume.fileSize}
                </div>
              </div>
              
              <div className="border-t border-border/10 p-3 flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  asChild
                >
                  <Link to={`/resumes/${resume.id}`}>
                    <Eye size={14} className="mr-1" />
                    Voir
                  </Link>
                </Button>
                
                <Button variant="ghost" size="sm" className="text-xs">
                  <Download size={14} className="mr-1" />
                  Télécharger
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Resumes;
