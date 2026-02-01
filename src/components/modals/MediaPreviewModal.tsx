import React, { useEffect, useRef } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  type: 'image' | 'video';
  title: string;
}

export function MediaPreviewModal({ isOpen, onClose, url, type, title }: MediaPreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title}.${type === 'video' ? 'mp4' : 'png'}`; // Simple extension assumption
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-5xl max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 text-white/90 px-2">
            <h3 className="text-lg font-medium truncate flex-1 pr-4">{title}</h3>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Media Container */}
        <div className="flex-1 overflow-hidden rounded-xl bg-black border border-white/10 flex items-center justify-center relative group min-h-[300px]">
             {type === 'video' ? (
                <video 
                    src={url} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                />
             ) : (
                <img 
                    src={url} 
                    alt={title} 
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                />
             )}
        </div>

        {/* Footer/Actions */}
        <div className="mt-4 flex justify-center gap-4">
            <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-full hover:bg-gray-100 font-medium transition-colors shadow-lg"
            >
                <Download className="w-4 h-4" />
                Скачать
            </button>
            <a 
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 font-medium transition-colors backdrop-blur-sm border border-white/10"
            >
                <ExternalLink className="w-4 h-4" />
                Открыть в новой вкладке
            </a>
        </div>
      </div>
    </div>
  );
}
