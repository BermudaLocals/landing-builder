'use client';

import { useEffect, useState } from 'react';
import { X, Copy, Check, Download } from 'lucide-react';
import { Component } from './LandingPageBuilder';

interface ExportDialogProps {
  components: Component[];
  onClose: () => void;
}

export default function ExportDialog({ components, onClose }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      try {
        const response = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ components }),
        });
        if (!response.ok) {
          throw new Error(`Export failed (${response.status})`);
        }
        const data = await response.json();
        if (!cancelled) {
          setHtml(data.html || '');
          setCss(data.css || '');
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Export failed');
          setLoading(false);
        }
      }
    };

    generate();
    return () => {
      cancelled = true;
    };
  }, [components]);

  const activeCode = activeTab === 'html' ? html : css;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = () => {
    const isHtml = activeTab === 'html';
    const blob = new Blob([activeCode], { type: isHtml ? 'text/html' : 'text/css' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = isHtml ? 'index.html' : 'styles.css';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Code</h2>
            <p className="text-sm text-gray-500">
              Static HTML and CSS generated from the current canvas.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === 'html'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              HTML
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                activeTab === 'css'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              CSS
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              disabled={loading || !!error}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={downloadFile}
              disabled={loading || !!error}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Generating code...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : (
            <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words font-mono">
              {activeCode}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
