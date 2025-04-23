
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCasesData } from './useCasesData';
import UseCaseSlide from './UseCaseSlide';

const UseCasesSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = useCasesData;

  const goToPrevious = () => {
    setActiveIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setActiveIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="relative">
      {/* Slide container */}
      <div className="relative min-h-[500px] md:min-h-[600px] rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-navy-dark/80 mb-4">
        {slides.map((slide, index) => (
          <UseCaseSlide 
            key={index}
            slide={slide}
            isActive={index === activeIndex}
          />
        ))}
        
        {/* Navigation buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/80 dark:bg-navy/80 shadow-lg hover:bg-white dark:hover:bg-navy"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white/80 dark:bg-navy/80 shadow-lg hover:bg-white dark:hover:bg-navy"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Slide indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === activeIndex
                ? "bg-indigo-600 w-8"
                : "bg-gray-300 dark:bg-gray-600 hover:bg-indigo-400"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default UseCasesSlider;
