import { useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { CachedImage } from './CachedImage';

interface CardProps {
  image?: string;
  video?: string;
  title: string;
  selected: boolean;
  onClick: () => void;
  aspect?: string;
  duration?: string;
}

export function Card({ image, video, title, selected, onClick, aspect = 'aspect-[3/4]', duration }: CardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onClick={onClick}
      className={twMerge(
        'group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-lg',
        selected ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' : 'border-transparent hover:border-gray-200',
        aspect
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {video ? (
         <video
            ref={videoRef}
            src={video}
            poster={image}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
         />
      ) : image ? (
          <CachedImage
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
      ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500 text-sm">No Preview</span>
          </div>
      )}
      
      <div className="w-full flex items-center justify-between gap-2">
            <p className="text-white font-medium truncate">{title}</p>
            {duration && (
                <span className="text-xs text-white/90 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap">
                    {duration}
                </span>
            )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <p className="text-white font-medium truncate w-full">{title}</p>
      </div>

      {selected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
           </svg>
        </div>
      )}
    </div>
  );
}
