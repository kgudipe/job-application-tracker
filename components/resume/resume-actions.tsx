'use client';

import { useState } from 'react';
import { Eye, Download, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { removeResume } from '@/app/actions/resume';

interface Props {
  jobId: string;
  resumePath: string;
  resumeFilename: string;
  onReplace: () => void; // tells parent to show dropzone
}

export function ResumeActions({ jobId, resumePath, resumeFilename, onReplace }: Props) {
  const [loading, setLoading] = useState<'view' | 'download' | 'delete' | null>(null);

  async function getUrl() {
    const res = await fetch(`/api/resume/signed-url?path=${encodeURIComponent(resumePath)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Failed to get URL');
    return data.url as string;
  }

  async function handleView() {
    setLoading('view');
    try {
      const url = await getUrl();
      window.open(url, '_blank');
    } catch {
      toast.error('Could not open resume.');
    } finally {
      setLoading(null);
    }
  }

  async function handleDownload() {
    setLoading('download');
    try {
      const url = await getUrl();
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeFilename;
      a.click();
    } catch {
      toast.error('Could not download resume.');
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm('Remove this resume from the job?')) return;
    setLoading('delete');
    const result = await removeResume(jobId, resumePath);
    setLoading(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Resume removed.');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
        <span className="flex-1 truncate text-sm text-muted-foreground">{resumeFilename}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleView}
          disabled={!!loading}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          {loading === 'view' ? 'Opening…' : 'View'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!!loading}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {loading === 'download' ? 'Downloading…' : 'Download'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReplace}
          disabled={!!loading}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Replace
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={!!loading}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          {loading === 'delete' ? 'Removing…' : 'Remove'}
        </Button>
      </div>
    </div>
  );
}