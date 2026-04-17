import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface IDProofUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

const IDProofUpload: React.FC<IDProofUploadProps> = ({ file, onChange }) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error('File size must be under 5MB');
      return;
    }
    onChange(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (file) {
    const isImage = file.type.startsWith('image/');
    return (
      <div className="relative flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
        {isImage && preview ? (
          <img src={preview} alt="ID preview" className="w-14 h-14 object-cover rounded-md" />
        ) : (
          <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-5 rounded-lg border-2 border-dashed cursor-pointer transition-all',
        'hover:border-primary/50 hover:bg-primary/5',
        dragOver ? 'border-primary bg-primary/10' : 'border-border'
      )}
    >
      <Upload className="w-6 h-6 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Upload ID Proof</p>
        <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, or PDF • Max 5MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
};

export default IDProofUpload;
