
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Alert component to show when features are not yet implemented
 */
export const MockDataAlert: React.FC<{ 
  feature: string; 
  icon?: React.ReactNode;
  variant?: "default" | "warning";
  language?: "en" | "fr";
}> = ({ 
  feature, 
  icon = <AlertCircle className="h-4 w-4" />,
  variant = "default",
  language = "fr"
}) => {
  const messages = {
    en: `The ${feature} feature will be available soon.`,
    fr: `La fonctionnalité ${feature} sera bientôt disponible.`
  };

  return (
    <Alert 
      variant={variant} 
      className={`mt-4 mb-2 ${
        variant === "warning" 
          ? "bg-yellow-50/80 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30" 
          : "bg-purple-50/80 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/30"
      }`}
    >
      <div className={`${
        variant === "warning" 
          ? "text-yellow-600 dark:text-yellow-400" 
          : "text-purple-600 dark:text-purple-400"
      }`}>
        {icon}
      </div>
      <AlertDescription className={`${
        variant === "warning" 
          ? "text-yellow-800 dark:text-yellow-300" 
          : "text-purple-800 dark:text-purple-300"
      }`}>
        {messages[language]}
      </AlertDescription>
    </Alert>
  );
};

export default MockDataAlert;
