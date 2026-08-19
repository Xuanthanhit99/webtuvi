import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared by Tarot and Numerology reading views (Sprint 8.5 remediation, Phase 2 — AI visibility).
 * Visually/structurally separates the AI-written narration from the deterministic result above it
 * (cards drawn / numbers calculated), and never implies the AI chose the cards or numbers — the
 * caption is explicit about that. Never renders a provider name, model identifier, or prompt.
 */
export function AiInterpretation({
  interpretation,
  isGenerating,
  onGenerate,
}: {
  interpretation: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-md border border-insight/20 bg-insight/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-caption font-medium uppercase tracking-wide text-insight">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        AI Interpretation
      </div>
      {interpretation ? (
        <p className="text-body-md text-text-primary">{interpretation}</p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-body-sm text-text-secondary">
            {isGenerating ? 'Writing your interpretation…' : 'Interpretation isn’t ready yet.'}
          </p>
          <Button variant="secondary" size="sm" onClick={onGenerate} loading={isGenerating}>
            Generate interpretation
          </Button>
        </div>
      )}
      <p className="mt-2 text-caption text-text-tertiary">
        Written by AI to narrate the result above — it never chooses or changes it.
      </p>
    </div>
  );
}
