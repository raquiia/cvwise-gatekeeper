
import React from 'react';
import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NoResumesState: React.FC = () => {
  return (
    <div className="glass rounded-xl p-8 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-navy/10 flex items-center justify-center mb-4">
        <FileText size={32} className="text-navy" />
      </div>
      <h2 className="text-xl font-semibold text-navy-dark mb-2">Aucun CV trouvé</h2>
      <p className="text-muted-foreground mb-6">
        Vous n'avez pas encore importé de CV dans le système.
      </p>
      <Link to="/resumes/upload">
        <Button className="button-primary">
          <Upload size={18} className="mr-2" />
          Importer un CV
        </Button>
      </Link>
    </div>
  );
};

export default NoResumesState;
