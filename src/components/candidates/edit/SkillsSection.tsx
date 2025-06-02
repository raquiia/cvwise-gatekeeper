
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormValues } from './candidateEditSchema';

interface SkillsSectionProps {
  form: UseFormReturn<FormValues>;
  formValues: FormValues;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ form, formValues }) => {
  const [skillsInput, setSkillsInput] = useState('');

  const handleAddSkill = () => {
    if (skillsInput.trim()) {
      const currentSkills = form.getValues('skills') || [];
      form.setValue('skills', [...currentSkills, skillsInput.trim()]);
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    const currentSkills = form.getValues('skills') || [];
    form.setValue('skills', currentSkills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Compétences</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {formValues.skills?.map((skill, index) => (
          <div key={index} className="bg-navy/10 px-3 py-1 rounded-full flex items-center">
            <span>{skill}</span>
            <button 
              type="button"
              onClick={() => handleRemoveSkill(index)} 
              className="ml-2 text-navy/60 hover:text-navy/80"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="Ajouter une compétence"
          className="border-navy/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSkill();
            }
          }}
        />
        <Button 
          type="button" 
          onClick={handleAddSkill}
          variant="outline"
        >
          Ajouter
        </Button>
      </div>
    </div>
  );
};

export default SkillsSection;
