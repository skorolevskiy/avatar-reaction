import { type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface StepProps {
  title: string;
  stepNumber: number;
  isActive: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function Step({
  title,
  stepNumber,
  isActive,
  isCompleted,
  isDisabled,
  onToggle,
  children,
}: StepProps) {
  return (
    <div
      className={twMerge(
        'border rounded-lg mb-4 overflow-hidden transition-all duration-300 bg-white shadow-sm',
        isDisabled && 'opacity-50 pointer-events-none bg-gray-50'
      )}
    >
      <button
        onClick={onToggle}
        disabled={isDisabled}
        className='w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors'
      >
        <div className='flex items-center gap-3'>
          {isCompleted ? (
            <CheckCircle2 className='w-6 h-6 text-green-500' />
          ) : (
            <div className={twMerge(
              'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium',
              isActive ? 'border-blue-500 text-blue-500' : 'border-gray-300 text-gray-400'
            )}>
              {stepNumber}
            </div>
          )}
          <span className={twMerge('font-medium text-lg', isActive ? 'text-gray-900' : 'text-gray-500')}>
            {title}
          </span>
        </div>
      </button>

      {isActive && (
        <div className='p-4 border-t animate-in fade-in slide-in-from-top-2 duration-300'>
          {children}
        </div>
      )}
    </div>
  );
}
