import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Link as LinkIcon, 
  QrCode, 
  Users,
  Sparkles
} from 'lucide-react';
import { GameDocument } from '../types';

interface ShareMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameDocument;
}

export const ShareMatchModal: React.FC<ShareMatchModalProps> = ({
  isOpen,
  onClose,
  game
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  // Generate shareable link
  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareLink = `${currentUrl}?game=${game.code}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(game.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1117]/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="share-match-modal"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-black/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100">Invite Player</h2>
              <p className="text-xs text-slate-400">Share room code or instant URL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Indicator */}
          {game.status === 'WAITING_FOR_PLAYER' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <p className="text-xs text-amber-300 font-medium">
                Waiting for your friend to open the link or enter the match code...
              </p>
            </div>
          )}

          {/* Short Game Code Section */}
          <div className="space-y-1.5 text-center">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Short Match Code
            </label>
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-3xl font-black font-mono tracking-widest text-indigo-400">
                {game.code}
              </span>
              <button
                id="copy-modal-code-btn"
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer border border-slate-700"
                title="Copy Match Code"
              >
                {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Direct Share Link Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Direct Invite Link
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800">
              <LinkIcon className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
              <input
                type="text"
                readOnly
                value={shareLink}
                className="flex-1 bg-transparent text-xs text-slate-300 focus:outline-none truncate font-mono"
              />
              <button
                id="copy-modal-link-btn"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">How multiplayer works:</p>
            <p>1. Send the link or 6-character code to your friend.</p>
            <p>2. Once they join, Firestore will immediately sync both boards in real-time!</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer border border-slate-700"
          >
            Back to Match
          </button>
        </div>
      </div>
    </div>
  );
};
