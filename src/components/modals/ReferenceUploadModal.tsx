import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../Modal';
import { Loader } from '../Loader';

interface ReferenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], label: string) => Promise<void>;
}

export const ReferenceUploadModal: React.FC<ReferenceUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpload 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [label, setLabel] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => file.type === 'video/mp4');

    if (validFiles.length !== files.length) {
      alert('Some files were ignored. Please select only MP4 videos.');
    }

    if (validFiles.length === 0) return;

    if (!label.trim()) {
      alert('Please enter a label first.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(validFiles, label);
      setLabel(''); // Reset label on success
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
      title="Add New Motion Reference"
    >
      <div className="space-y-4">
        {isUploading ? (
          <Loader type="spinner" text="Uploading reference..." />
        ) : (
          <>
            <div>
              <label htmlFor="refLabel" className="block text-sm font-medium text-gray-700 mb-1">
                Reaction Label
              </label>
              <input
                id="refLabel"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Waving Hello"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div 
              onClick={() => {
                if (!label.trim()) {
                  alert('Please enter a label first');
                  return;
                }
                fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors ${
                !label.trim() ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-blue-500 hover:bg-blue-50'
              }`}
              role="button"
              tabIndex={0}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">Click to upload videos</p>
                <p className="text-sm text-gray-500">MP4 (max 100MB)</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".mp4" 
                multiple
                className="hidden" 
                onChange={handleFileChange}
                disabled={!label.trim()}
              />
            </div>
            <div className="flex justify-end gap-2 text-sm text-gray-500">
              Supported formats: MP4
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
