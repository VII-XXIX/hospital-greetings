import React from 'react';
import { Check } from 'lucide-react';

interface StepWizardProps {
  currentStep: number;
  totalSteps: number;
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep, totalSteps }) => {
  const steps = ['Occasion', 'Language', 'Design', 'Personalize'];

  return (
    <div className="w-full py-8 px-4">
      <div className="flex items-center justify-between relative max-w-3xl mx-auto">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1.5 bg-white rounded-full -z-10 shadow-sm" />
        
        {/* Active Line */}
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1.5 bg-primary rounded-full -z-10 transition-all duration-500 ease-in-out" 
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
        
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={label} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm ${
                  isActive ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 
                  isCompleted ? 'bg-primarySoft text-primary' : 'bg-white text-gray-300'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
              </div>
              <span className={`text-xs mt-3 font-medium tracking-wide transition-colors duration-300 ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};