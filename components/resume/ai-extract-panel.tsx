'use client';

import { Sparkles, RotateCcw, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ParsedResumeResult } from '@/lib/types';
import type { UseFormRegister } from 'react-hook-form';
import type { JobFormValues } from '@/lib/validations';

interface Props {
  result: ParsedResumeResult;
  loading: boolean;
  onReExtract: () => void;
  onManual: () => void;
  register: UseFormRegister<JobFormValues>;
}

const providerLabel: Record<string, string> = {
  gemini: 'Gemini',
  ollama: 'Ollama (local)',
  manual: 'Manual',
};

export function AiExtractPanel({ result, loading, onReExtract, onManual, register }: Props) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">
            {loading ? 'Extracting…' : `Extracted via ${providerLabel[result.provider] ?? result.provider}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onReExtract}
            disabled={loading}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Re-extract
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onManual}
            disabled={loading}
          >
            <PenLine className="mr-1 h-3 w-3" />
            Enter manually
          </Button>
        </div>
      </div>

      {result.needsManualEntry && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          AI extraction unavailable — please fill in manually.
        </p>
      )}

      {result.warnings.length > 0 && !result.needsManualEntry && (
        <p className="text-xs text-muted-foreground">{result.warnings[0]}</p>
      )}

      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="resume_email" className="text-xs">Email</Label>
          <Input
            id="resume_email"
            className="h-8 text-sm"
            disabled={loading}
            {...register('resume_email')}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="resume_phone" className="text-xs">Phone</Label>
          <Input
            id="resume_phone"
            className="h-8 text-sm"
            disabled={loading}
            {...register('resume_phone')}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="resume_location" className="text-xs">Location</Label>
          <Input
            id="resume_location"
            className="h-8 text-sm"
            disabled={loading}
            {...register('resume_location')}
          />
        </div>
      </div>
    </div>
  );
}