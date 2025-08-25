import React, { useState, useEffect } from 'react';
import { Send, Search, Users, Building2, Calendar, Bot, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface SourceOption {
  value: string;
  label: string;
}

interface SourceCategory {
  label: string;
  icon: React.ComponentType<any>;
  sources: SourceOption[];
}

const sourceCategories: Record<string, SourceCategory> = {
  application: {
    label: "Application",
    icon: Send,
    sources: [
      { value: "application_linkedin", label: "LinkedIn" },
      { value: "application_mp_website", label: "MP Website" },
      { value: "application_apec", label: "Apec" },
      { value: "application_indeed", label: "Indeed" },
      { value: "application_hellowork", label: "Hellowork" },
      { value: "application_infojob", label: "Infojob" },
      { value: "application_handshake", label: "Handshake" },
      { value: "application_alten_push", label: "Alten Recruitment Push" }
    ]
  },
  hunt: {
    label: "Hunt",
    icon: Search,
    sources: [
      { value: "hunt_linkedin", label: "LinkedIn" },
      { value: "hunt_indeed", label: "Indeed" },
      { value: "hunt_seek", label: "Seek" },
      { value: "hunt_apec", label: "Apec" },
      { value: "hunt_hellowork", label: "Hellowork" }
    ]
  },
  referral: {
    label: "Referral",
    icon: Users,
    sources: [
      { value: "referral_mp", label: "from MP" },
      { value: "referral_client", label: "Client" },
      { value: "referral_alten", label: "Alten" },
      { value: "referral_alumni", label: "Alumni" }
    ]
  },
  mobility: {
    label: "Mobility",
    icon: Building2,
    sources: [
      { value: "mobility_mp", label: "MP" },
      { value: "mobility_alten", label: "Alten" }
    ]
  },
  recruitment_events: {
    label: "Recruitment Events",
    icon: Calendar,
    sources: [
      { value: "recruitment_fair", label: "Recruitment fair" },
      { value: "recruitment_other_fair", label: "Other Fair" }
    ]
  },
  automated_ai: {
    label: "Automated by AI",
    icon: Bot,
    sources: [
      { value: "automated_ai", label: "AI Generated" }
    ]
  }
};

interface SourceSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Sélectionner la provenance",
  className = ""
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");

  // Initialize category and source from value
  useEffect(() => {
    if (value) {
      for (const [categoryKey, category] of Object.entries(sourceCategories)) {
        const foundSource = category.sources.find(source => source.value === value);
        if (foundSource) {
          setSelectedCategory(categoryKey);
          setSelectedSource(value);
          break;
        }
      }
    } else {
      setSelectedCategory("");
      setSelectedSource("");
    }
  }, [value]);

  const handleCategorySelect = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setSelectedSource("");
    
    // If category has only one source, auto-select it
    const category = sourceCategories[categoryKey];
    if (category.sources.length === 1) {
      const singleSource = category.sources[0].value;
      setSelectedSource(singleSource);
      onValueChange(singleSource);
    }
  };

  const handleSourceSelect = (sourceValue: string) => {
    setSelectedSource(sourceValue);
    onValueChange(sourceValue);
  };

  const handleReset = () => {
    setSelectedCategory("");
    setSelectedSource("");
    onValueChange("");
  };

  const getDisplayValue = () => {
    if (!selectedCategory || !selectedSource) return placeholder;
    
    const category = sourceCategories[selectedCategory];
    const source = category.sources.find(s => s.value === selectedSource);
    
    return `${category.label} - ${source?.label}`;
  };

  return (
    <div className={className}>
      {!selectedCategory ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Choisissez une catégorie :</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(sourceCategories).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleCategorySelect(key)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-4 min-h-[80px]">
                    <Icon size={20} className="mb-2 text-primary" />
                    <span className="text-sm font-medium text-center">{category.label}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{sourceCategories[selectedCategory].label}</span>
              <ChevronRight size={14} />
              <span>Source spécifique</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Changer de catégorie
            </Button>
          </div>
          
          {sourceCategories[selectedCategory].sources.length > 1 ? (
            <Select value={selectedSource} onValueChange={handleSourceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la source" />
              </SelectTrigger>
              <SelectContent>
                {sourceCategories[selectedCategory].sources.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 border rounded-md bg-muted/50">
              <span className="text-sm font-medium">
                {sourceCategories[selectedCategory].sources[0].label}
              </span>
            </div>
          )}
          
          {selectedSource && (
            <div className="p-3 border rounded-md bg-accent/50">
              <p className="text-sm">
                <span className="font-medium">Sélectionné :</span> {getDisplayValue()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};