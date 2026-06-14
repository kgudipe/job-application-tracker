'use client';

import { useCallback, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function ResumeUpload({ file, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function validate(f: File): string | null {
    if (f.type !== 'application/pdf') return 'Only PDF files are accepted.';
    if (f.size > MAX_SIZE) return 'File must be under 5 MB.';
    return null;
  }

  const handleFile = useCallback(
    (f: File) => {
      const error = validate(f);
      if (error) { setErr(error); return; }
      setErr(null);
      onChange(f);
    },
    [onChange],
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">{file.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => { setErr(null); onChange(null); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <UploadCloud className="h-7 w-7 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Drop a PDF here or click to browse</p>
          <p className="text-xs text-muted-foreground">Max 5 MB</p>
        </div>
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={onInputChange}
        />
      </label>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}