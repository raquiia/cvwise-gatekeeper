
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Clock, Hash, MapPin, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface SearchSuggestion {
  type: 'skill' | 'location' | 'company' | 'recent';
  value: string;
  label: string;
  icon: LucideIcon;
}

interface EnhancedSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  searchQuery,
  onSearchChange,
  suggestions = [],
  recentSearches = []
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock suggestions for demo
  const defaultSuggestions: SearchSuggestion[] = [
    { type: 'skill', value: 'React', label: 'React', icon: Hash },
    { type: 'skill', value: 'TypeScript', label: 'TypeScript', icon: Hash },
    { type: 'skill', value: 'Python', label: 'Python', icon: Hash },
    { type: 'location', value: 'Paris', label: 'Paris', icon: MapPin },
    { type: 'location', value: 'Lyon', label: 'Lyon', icon: MapPin },
    { type: 'company', value: 'Google', label: 'Google', icon: Briefcase },
    { type: 'company', value: 'Microsoft', label: 'Microsoft', icon: Briefcase },
  ];

  const allSuggestions = [...defaultSuggestions, ...suggestions];

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 6));
    } else {
      // Show recent searches when no query
      const recentSuggestions = recentSearches.slice(0, 4).map(search => ({
        type: 'recent' as const,
        value: search,
        label: search,
        icon: Clock
      }));
      setFilteredSuggestions(recentSuggestions);
    }
  }, [searchQuery, suggestions, recentSearches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.value);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'skill': return 'bg-blue-50 text-blue-700';
      case 'location': return 'bg-green-50 text-green-700';
      case 'company': return 'bg-purple-50 text-purple-700';
      case 'recent': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Rechercher par nom, compétences, entreprise..."
          className="pl-10 pr-10 border-purple-200/50 dark:border-purple-800/30 focus-visible:ring-purple-500 bg-white/70 dark:bg-navy-dark/40 backdrop-blur-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-white/95 dark:bg-navy-dark/95 backdrop-blur-md border-purple-200/50 dark:border-purple-800/30 shadow-lg max-h-80 overflow-y-auto">
          <div className="p-2">
            {searchQuery.length === 0 && recentSearches.length > 0 && (
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Recherches récentes
              </div>
            )}
            
            {filteredSuggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <button
                  key={`${suggestion.type}-${suggestion.value}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-colors"
                >
                  <Icon size={14} className="text-muted-foreground" />
                  <span className="flex-1 text-sm">{suggestion.label}</span>
                  <Badge variant="secondary" className={`text-xs ${getTypeColor(suggestion.type)}`}>
                    {suggestion.type === 'recent' ? 'récent' : suggestion.type}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSearch;
