import React, { useState } from 'react';
import { useApp } from '../context/useApp';
import { getSupabaseConfig, resetSupabaseClient } from '../services/supabase';
import { X, Copy, Check, Share2, Database, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface FamilyPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FamilyPairingModal: React.FC<FamilyPairingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { familyId, setFamilyId, isSupabaseConfigured } = useApp();

  const [inputFamilyId, setInputFamilyId] = useState(familyId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Supabase Custom Config
  const [showConfig, setShowConfig] = useState(false);
  const config = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseKey, setSupabaseKey] = useState(config.key);
  const [savedSettings, setSavedSettings] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    triggerHaptic('light');
    const shareUrl = `${window.location.origin}/?family=${familyId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(familyId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputFamilyId.trim()) {
      triggerHaptic('success');
      setFamilyId(inputFamilyId.trim().toLowerCase());
      onClose();
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('success');
    localStorage.setItem('appa_supabase_url', supabaseUrl.trim());
    localStorage.setItem('appa_supabase_anon_key', supabaseKey.trim());
    resetSupabaseClient();
    setSavedSettings(true);
    setTimeout(() => {
      setSavedSettings(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full sm:max-w-md bg-[#f9f8f6] dark:bg-[#121215] border border-[#e6e2da] dark:border-[#27272a] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#e6e2da] dark:border-[#27272a]">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
              Family Sync
            </h2>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                isSupabaseConfigured
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              }`}
            >
              {isSupabaseConfigured ? 'Live Cloud Sync' : 'Local Storage Only'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#746f68] dark:text-[#a1a1aa] hover:bg-[#e8e2d8] dark:hover:bg-[#27272a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-5">
          {/* Active Family Code Card */}
          <div className="bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-2xl p-4 text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#746f68] dark:text-[#a1a1aa]">
              Your Family Pairing Code
            </span>
            <div className="text-2xl font-bold tracking-tight text-[#1f1d1a] dark:text-[#f4f4f5] my-2 select-all font-mono">
              {familyId}
            </div>

            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#e8e2d8] dark:bg-[#27272a] text-xs font-semibold text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-90 active:scale-[0.98] transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Share Sync Link'}</span>
              </button>
            </div>

            <p className="text-xs text-[#746f68] dark:text-[#a1a1aa] mt-3 leading-relaxed">
              Open the share link on your partner's iPhone or Google Pixel to instantly mirror logs and active timers.
            </p>
          </div>

          {/* Switch / Join Another Code */}
          <form onSubmit={handleJoinFamily} className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
              Join Partner's Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputFamilyId}
                onChange={(e) => setInputFamilyId(e.target.value)}
                placeholder="e.g. appa-427"
                className="flex-1 bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-[#e8e2d8] dark:bg-[#27272a] text-xs font-semibold text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-90"
              >
                Switch
              </button>
            </div>
          </form>

          {/* Advanced Supabase Config Accordion */}
          <div className="pt-2 border-t border-[#e6e2da] dark:border-[#27272a]">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center justify-between w-full text-xs font-semibold text-[#746f68] dark:text-[#a1a1aa] hover:text-[#1f1d1a] dark:hover:text-[#f4f4f5]"
            >
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Backend Credentials</span>
              </span>
              <span>{showConfig ? 'Hide' : 'Configure'}</span>
            </button>

            {showConfig && (
              <form onSubmit={handleSaveSupabaseConfig} className="mt-3 flex flex-col gap-3">
                <p className="text-[11px] text-[#746f68] dark:text-[#a1a1aa] leading-relaxed">
                  Enter your Supabase project credentials for instant real-time synchronization between iOS and Android. You can also configure them via <code className="px-1 py-0.5 rounded bg-[#e8e2d8] dark:bg-[#27272a]">.env</code> file.
                </p>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#746f68] dark:text-[#a1a1aa] mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#1f1d1a] dark:text-[#f4f4f5] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#746f68] dark:text-[#a1a1aa] mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-xs text-[#1f1d1a] dark:text-[#f4f4f5] outline-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-1 py-2 px-4 rounded-xl text-xs font-semibold text-white dark:text-[#09090b] bg-[#1f1d1a] dark:bg-[#f4f4f5] hover:opacity-90 flex items-center justify-center gap-1.5"
                >
                  {savedSettings ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Saved! Reloading...</span>
                    </>
                  ) : (
                    <span>Save & Connect Supabase</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
