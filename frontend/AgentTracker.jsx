import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

const AgentTracker = ({ steps = [], currentStep = 0, status = [] }) => {
  const progress = steps.length > 1 ? (status.filter(s => s === 'completed').length / steps.length) * 100 : 0;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between overflow-x-auto space-y-2 sm:space-y-0">
        {steps.map((step, idx) => {
          const state = status[idx] || 'pending';
          const color = state === 'completed' ? 'text-green-500' : state === 'active' ? 'text-blue-500' : 'text-gray-400';
          return (
            <div key={idx} className="flex-shrink-0 sm:flex-1 flex flex-col items-center">
              {state === 'completed' && <CheckCircle className={`w-5 h-5 mb-1 sm:mb-2 ${color}`} />}
              {state === 'active' && <Loader2 className={`w-5 h-5 mb-1 sm:mb-2 animate-spin ${color}`} />}
              {state === 'pending' && <div className="w-5 h-5 mb-1 sm:mb-2 rounded-full bg-gray-300" />}
              <span className={`text-xs sm:text-sm whitespace-nowrap ${color}`}>{step}</span>
            </div>
          );
        })}
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

export default AgentTracker;
