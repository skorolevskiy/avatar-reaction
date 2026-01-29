import { useRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  image?: string;
  video?: string;
  title: string;
  selected: boolean;
  onClick: () => void;
  aspect?: string;
}

export function Card({ image, video, title, selected, onClick, aspect = 'aspect-[3/4]' }: CardProps) {
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
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
         />
      ) : (
        image && (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )
      )}
      
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
