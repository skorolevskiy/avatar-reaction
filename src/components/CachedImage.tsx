import { useState } from 'react';
import { useCachedImage } from '../hooks/useCachedImage';
import { twMerge } from 'tailwind-merge';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export function CachedImage({ src, className, alt, ...props }: CachedImageProps) {
  const { src: imageSrc } = useCachedImage(src);
  const [isError, setIsError] = useState(false);

  // If loading, we could show a skeleton or loader.
  // But for now, let's just make it seamless or show a small spinner.
  
  if (isError) {
      return (
         <div className={twMerge("bg-gray-200 flex items-center justify-center", className)}>
             <span className="text-xs text-gray-400">Error</span>
         </div>
      );
  }

  return (
    <>
      <img 
        src={imageSrc} 
        alt={alt} 
        className={className}
        onError={() => setIsError(true)}
        {...props} 
      />
    </>
  );
}
