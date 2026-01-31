import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../Modal';
import { Loader } from '../Loader';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpload 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Please select a PNG or JPG image.'); // Simple alert for now, or pass onError prop
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      // Close is handled by parent usually, but we can ensure local state is reset
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => !isUploading && onClose()} 
      title="Add New Avatar"
    >
      <div className="space-y-4">
        {isUploading ? (
          <Loader type="spinner" text="Uploading..." />
        ) : (
          <>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Click to upload</p>
                <p className="text-sm text-gray-500">PNG or JPG (max 5MB)</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".jpg,.jpeg,.png" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
            <div className="flex justify-end gap-2 text-sm text-gray-500">
              Supported formats: PNG, JPG
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
