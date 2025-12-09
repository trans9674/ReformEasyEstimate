import React from 'react';

interface SetupStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const steps = [
  { number: 1, label: '撮影' },
  { number: 2, label: '配置調整' },
  { number: 3, label: '外周設定' },
  { number: 4, label: '長さ設定' },
];

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);


export const SetupStepper: React.FC<SetupStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-lg pointer-events-auto">
      <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg flex items-center justify-around border border-gray-200">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <button
              onClick={() => onStepClick(step.number)}
              disabled={step.number >= currentStep}
              className="flex-1 flex flex-col items-center justify-center text-center disabled:cursor-not-allowed group px-1"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep === step.number
                    ? 'bg-blue-500 border-blue-600 text-white'
                    : step.number < currentStep
                    ? 'bg-white border-gray-400 text-gray-700 group-hover:bg-blue-50 group-hover:border-blue-400'
                    : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                <span className="font-bold text-lg">{step.number}</span>
              </div>
              <span
                className={`text-[10px] font-semibold mt-1 transition-colors duration-300 whitespace-nowrap ${
                  currentStep === step.number
                    ? 'text-blue-600'
                    : step.number < currentStep
                    ? 'text-gray-600 group-hover:text-blue-500'
                    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <ArrowRightIcon className="w-5 h-5 text-gray-300 mx-1 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};