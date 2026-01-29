

interface LoaderProps {
  type: 'spinner' | 'pulse' | 'progress';
  text?: string;
  progress?: number;
}

export function Loader({ type, text, progress }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      {type === 'spinner' && (
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      )}
      
      {type === 'pulse' && (
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" />
        </div>
      )}

      {type === 'progress' && (
        <div className="w-full max-w-sm h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
             <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] w-full" />
          </div>
        </div>
      )}

      {text && <p className="text-gray-500 font-medium animate-pulse">{text}</p>}
    </div>
  );
}
