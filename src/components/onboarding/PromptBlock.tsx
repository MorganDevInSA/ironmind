'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface PromptBlockProps {
  text: string;
  filename: string;
  label?: string;
  rows?: number;
}

export function PromptBlock({ text, filename, label, rows = 16 }: PromptBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#5E5E5E]">{label}</p>
      )}

      <textarea
        readOnly
        value={text}
        rows={rows}
        className="w-full rounded-lg px-4 py-3 font-mono text-xs leading-relaxed
          bg-[rgba(8,8,8,0.9)] border border-[rgba(65,50,50,0.40)]
          text-[#9A9A9A] resize-none focus:outline-none overflow-y-auto"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
            shadow-[0_8px_20px_rgba(220,38,38,0.22)]
            hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#9A9A9A]
            bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
            hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[#F0F0F0]
            active:scale-95 transition-all duration-200"
        >
          <Download size={15} />
          Download .md
        </button>
      </div>
    </div>
  );
}
