import React, { useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-react';

export interface FileUploadProps {
  label?: string;
  description?: string;
  accept?: string;
  onFileChange: (file: File | null) => void;
  onUrlChange?: (url: string | null) => void;
  currentUrl?: string | null;
  maxSize?: number; // in bytes
  preview?: boolean;
  variant?: 'image' | 'document';
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  accept = 'image/*',
  onFileChange,
  onUrlChange,
  currentUrl,
  maxSize = 5 * 1024 * 1024, // 5MB default
  preview = true,
  variant = 'image',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;

    if (validateFile(file)) {
      setIsUploading(true);
      
      // Simulate upload
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        onFileChange(file);
        onUrlChange?.(url);
        setIsUploading(false);
      }, 500);
    }
  }, [maxSize, onFileChange, onUrlChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0] || null;
    handleFile(file);
  }, [handleFile]);

  const handleRemove = () => {
    onFileChange(null);
    onUrlChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {currentUrl ? (
        <div className="relative group">
          {preview && variant === 'image' ? (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <img 
                src={currentUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
              {variant === 'image' ? (
                <ImageIcon className="w-8 h-8 text-blue-500" />
              ) : (
                <FileText className="w-8 h-8 text-blue-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  Document
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Click to change
                </p>
              </div>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
            title="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 text-center transition-all',
            dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600',
            isUploading && 'opacity-50 pointer-events-none'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Upload className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            )}
            
            <div className="text-sm">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                {isUploading ? 'Uploading...' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {variant === 'image' ? 'PNG, JPG up to 5MB' : 'PDF, PNG up to 5MB'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ====================
// Color Picker
// ====================

export interface ColorPickerProps {
  label?: string;
  description?: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  description,
  value,
  onChange,
}) => {
  const presetColors = [
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#f43f5e', // rose
    '#78716c', // zinc
  ];

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}

      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border border-zinc-300 dark:border-zinc-700"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onChange(color)}
                className={cn(
                  'w-8 h-8 rounded-lg border-2 transition-all',
                  value === color 
                    ? 'border-blue-500 scale-110' 
                    : 'border-transparent hover:scale-105'
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
        
        <div className="w-32">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
};
