
import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface UseCaseSlide {
  title: string;
  description: string;
  image: string;
  keyPoints: string[];
  technologies: string[];
}

interface UseCaseSlideProps {
  slide: UseCaseSlide;
  isActive: boolean;
}

const UseCaseSlide: React.FC<UseCaseSlideProps> = ({ slide, isActive }) => {
  return (
    <div 
      className={cn(
        "absolute inset-0 transition-opacity duration-500 ease-in-out p-8",
        isActive ? "opacity-100 z-10" : "opacity-0 z-0"
      )}
    >
      <div className="flex flex-col md:flex-row h-full gap-6">
        {/* Image column */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-video overflow-hidden rounded-xl shadow-lg">
            <img 
              src={slide.image} 
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        </div>
        
        {/* Content column */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            {slide.title}
          </h2>
          
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {slide.description}
          </p>
          
          {/* Key Points */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Points clés:</h3>
            <ul className="space-y-2">
              {slide.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 mr-2">
                    {index + 1}
                  </span>
                  <span className="text-sm">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Technologies */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Technologies utilisées:</h3>
            <div className="flex flex-wrap gap-2">
              {slide.technologies.map((tech, index) => (
                <Badge key={index} variant="secondary" className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCaseSlide;
