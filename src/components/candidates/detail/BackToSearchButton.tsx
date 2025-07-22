
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackToSearchButtonProps {
  hasActiveSearch?: boolean;
  searchQuery?: string;
}

const BackToSearchButton: React.FC<BackToSearchButtonProps> = ({
  hasActiveSearch = false,
  searchQuery = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBack}
      className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-border/50 hover:bg-accent/80 transition-all duration-200"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {hasActiveSearch ? (
        <span className="flex items-center gap-2">
          <Search className="w-3 h-3" />
          Retour à la recherche "{searchQuery}"
        </span>
      ) : (
        'Retour à la liste'
      )}
    </Button>
  );
};

export default BackToSearchButton;
