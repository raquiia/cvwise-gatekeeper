
import React from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NoResumesState: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-8 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <FileText size={32} className="text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">Aucun CV trouvé</h2>
      <p className="text-muted-foreground mb-6">
        Vous n'avez pas encore importé de CV dans le système.
      </p>
      <Link to="/resumes/upload">
        <Button className="btn-primary-gradient">
          <Upload size={18} className="mr-2" />
          Importer un CV
        </Button>
      </Link>
    </div>
  );
};

export default NoResumesState;
