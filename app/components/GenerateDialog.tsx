'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Component } from './LandingPageBuilder';

interface GenerateDialogProps {
  projectId: string;
  onGenerated: (components: Component[]) => void;
  onClose: () => void;
}

export default function GenerateDialog({ projectId, onGenerated, onClose }: GenerateDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [state, setState] = useState<'idle' | 'generating' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setState('generating');
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Generation failed (${response.status})`);
      }
      // The route persists and returns only validated components — the
      // canvas refreshes straight from that response.
      onGenerated(data.components as Component[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Generate with AI
            </h2>
            <p className="text-sm text-gray-500">
              Describe your landing page. Generated content replaces the current canvas.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Example: A landing page for a yoga studio in Austin offering online classes"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={state === 'generating'}
          />
          <div className="text-xs text-gray-400 text-right">{prompt.length}/1000</div>

          {state === 'error' && error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={state === 'generating'}
            >
              Cancel
            </button>
            <button
              onClick={generate}
              disabled={state === 'generating' || prompt.trim().length < 10}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {state === 'generating' ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
