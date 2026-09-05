import React, { useState, useEffect } from 'react';
import {
  NotebookPen,
  X,
  Trash2,
  Copy,
  Check,
  Download,
  Clock,
  Save,
  Tag,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'razor_recon_audit_scratchpad_notes';

interface AuditNotepadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditNotepadDrawer: React.FC<AuditNotepadDrawerProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved !== null) {
        setNotes(saved);
      } else {
        // Initial helpful starter note
        const defaultStarter = `[AUDIT SCRATCHPAD - TRACK 04]
• Check UTR9948000 with HDFC branch clearing desk.
• Review Case C Ghost Orders for Shopify webhook retries.
• Verify MDR Invoice GST credit under GSTR-2B filing for FY25-Q1.`;
        setNotes(defaultStarter);
        localStorage.setItem(LOCAL_STORAGE_KEY, defaultStarter);
      }
    } catch (err) {
      console.error('Failed to read from localStorage', err);
    }
  }, []);

  // Save notes to localStorage on edit
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    setSaveStatus('saving');
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, val);
      setTimeout(() => setSaveStatus('saved'), 350);
    } catch (err) {
      console.error('Failed to write to localStorage', err);
    }
  };

  // Insert timestamp or quick tag
  const insertSnippet = (snippet: string) => {
    const updated = notes ? `${notes}\n${snippet} ` : `${snippet} `;
    setNotes(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, updated);
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
    }
  };

  const insertTimestamp = () => {
    const now = new Date();
    const timeStr = `[${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] - `;
    insertSnippet(timeStr);
  };

  // Copy notes to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Download notes as text file
  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Notes_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear notes
  const handleClear = () => {
    setNotes('');
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
    setShowClearConfirm(false);
  };

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const charCount = notes.length;
  const lineCount = notes ? notes.split('\n').length : 0;

  return (
    <div
      id="notepad-drawer-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex justify-end transition-opacity animate-in fade-in duration-200"
    >
      <div
        id="notepad-drawer-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-slate-900 text-slate-100 shadow-2xl border-l border-slate-700/80 flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <NotebookPen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Auditor Scratchpad
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  Live Sync
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Personal reconciliation work notes</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="close-notepad-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close drawer (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick actions strip */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={insertTimestamp}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] font-mono transition border border-slate-700"
              title="Insert current date and time"
            >
              <Clock className="h-3 w-3 text-indigo-400" />
              <span>Timestamp</span>
            </button>
            <button
              onClick={() => insertSnippet('• [DISPUTE]')}
              className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 flex items-center gap-1 text-[10px] font-mono transition border border-rose-900/50"
            >
              <Tag className="h-2.5 w-2.5" />
              <span>Dispute</span>
            </button>
            <button
              onClick={() => insertSnippet('• [ACTION]')}
              className="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 flex items-center gap-1 text-[10px] font-mono transition border border-amber-900/50"
            >
              <Tag className="h-2.5 w-2.5" />
              <span>Action</span>
            </button>
            <button
              onClick={() => insertSnippet('• [VERIFIED]')}
              className="px-2 py-1 rounded bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 flex items-center gap-1 text-[10px] font-mono transition border border-emerald-900/50"
            >
              <Tag className="h-2.5 w-2.5" />
              <span>Verified</span>
            </button>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <Save className="h-3 w-3 text-emerald-400" />
            <span className={saveStatus === 'saving' ? 'text-amber-400' : 'text-slate-400'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Auto-saved'}
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-4 flex flex-col bg-slate-900">
          <textarea
            id="audit-scratchpad-textarea"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Type your confidential reconciliation notes here... (e.g. Check UTR9948000 with Axis branch, follow up with merchant for ORD-1052...)"
            className="w-full flex-1 bg-slate-950 text-slate-100 p-3.5 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono text-xs leading-relaxed resize-none placeholder:text-slate-600 transition"
          />
        </div>

        {/* Footer info and controls */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="text-[11px] font-mono text-slate-400">
            <span>{charCount} chars</span>
            <span className="mx-1.5">•</span>
            <span>{lineCount} lines</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy button */}
            <button
              id="copy-notes-btn"
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 text-xs transition"
              title="Copy notes to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </button>

            {/* Download button */}
            <button
              id="download-notes-btn"
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 text-xs transition"
              title="Download notes as .txt"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px]">Export</span>
            </button>

            {/* Clear notes */}
            {showClearConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  id="confirm-clear-notes-btn"
                  onClick={handleClear}
                  className="px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition shadow-xs"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="clear-notes-btn"
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
                title="Clear all notes"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
