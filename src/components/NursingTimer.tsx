import React, { useState } from 'react';
import { useApp } from '../context/useApp';
import { formatDuration } from '../utils/time';
import { Play, Pause, Check, RotateCcw, FileText } from 'lucide-react';

export const NursingTimer: React.FC = () => {
  const {
    activeTimer,
    leftSeconds,
    rightSeconds,
    totalSeconds,
    isTimerRunning,
    startSide,
    pauseTimer,
    switchSide,
    resetTimer,
    saveActiveSession,
  } = useApp();

  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isLeftActive =
    activeTimer?.status === 'running' && activeTimer?.active_side === 'left';
  const isRightActive =
    activeTimer?.status === 'running' && activeTimer?.active_side === 'right';

  const handleLeftTap = () => {
    if (isLeftActive) {
      pauseTimer();
    } else {
      if (isRightActive) {
        switchSide('left');
      } else {
        startSide('left', 'nursing');
      }
    }
  };

  const handleRightTap = () => {
    if (isRightActive) {
      pauseTimer();
    } else {
      if (isLeftActive) {
        switchSide('right');
      } else {
        startSide('right', 'nursing');
      }
    }
  };

  const handleSave = async () => {
    if (totalSeconds === 0) return;
    setIsSaving(true);
    try {
      await saveActiveSession(notes);
      setNotes('');
      setShowNotesInput(false);
    } finally {
      setIsSaving(false);
    }
  };

  const hasSessionData = totalSeconds > 0;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Total Duration Banner */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
          Nursing Session
        </span>
        <span className="text-sm font-semibold tabular-nums text-[#1f1d1a] dark:text-[#f4f4f5]">
          Total: {formatDuration(totalSeconds)}
        </span>
      </div>

      {/* Dual Left / Right Nara Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* LEFT BREAST */}
        <button
          onClick={handleLeftTap}
          type="button"
          className={`relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-200 border text-left active:scale-[0.98] select-none ${
            isLeftActive
              ? 'bg-[#1f1d1a] text-white border-transparent shadow-lg dark:bg-[#f4f4f5] dark:text-[#09090b]'
              : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:border-[#d1ccbf] dark:hover:border-[#3f3f46]'
          }`}
          style={{ minHeight: '160px' }}
        >
          {isLeftActive && (
            <span className="absolute top-3.5 right-3.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}

          <span
            className={`text-xs font-bold uppercase tracking-wider mb-1 ${
              isLeftActive
                ? 'text-white/80 dark:text-[#09090b]/80'
                : 'text-[#746f68] dark:text-[#a1a1aa]'
            }`}
          >
            Left
          </span>

          <span className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums my-1">
            {formatDuration(leftSeconds)}
          </span>

          <div
            className={`mt-2 flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
              isLeftActive
                ? 'bg-white/20 dark:bg-black/15 text-white dark:text-[#09090b]'
                : 'bg-[#e8e2d8] dark:bg-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
            }`}
          >
            {isLeftActive ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>{leftSeconds > 0 ? 'Resume' : 'Start'}</span>
              </>
            )}
          </div>
        </button>

        {/* RIGHT BREAST */}
        <button
          onClick={handleRightTap}
          type="button"
          className={`relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-200 border text-left active:scale-[0.98] select-none ${
            isRightActive
              ? 'bg-[#1f1d1a] text-white border-transparent shadow-lg dark:bg-[#f4f4f5] dark:text-[#09090b]'
              : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:border-[#d1ccbf] dark:hover:border-[#3f3f46]'
          }`}
          style={{ minHeight: '160px' }}
        >
          {isRightActive && (
            <span className="absolute top-3.5 right-3.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}

          <span
            className={`text-xs font-bold uppercase tracking-wider mb-1 ${
              isRightActive
                ? 'text-white/80 dark:text-[#09090b]/80'
                : 'text-[#746f68] dark:text-[#a1a1aa]'
            }`}
          >
            Right
          </span>

          <span className="text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums my-1">
            {formatDuration(rightSeconds)}
          </span>

          <div
            className={`mt-2 flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
              isRightActive
                ? 'bg-white/20 dark:bg-black/15 text-white dark:text-[#09090b]'
                : 'bg-[#e8e2d8] dark:bg-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
            }`}
          >
            {isRightActive ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>{rightSeconds > 0 ? 'Resume' : 'Start'}</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Optional Note Accordion */}
      {showNotesInput && (
        <div className="w-full bg-[#f3efe9] dark:bg-[#18181b] rounded-2xl p-3 border border-[#e6e2da] dark:border-[#27272a] animate-in fade-in duration-200">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add feeding notes (e.g. good latch, sleepy, spitting up)..."
            className="w-full bg-transparent text-sm text-[#1f1d1a] dark:text-[#f4f4f5] placeholder-[#746f68] dark:placeholder-[#71717a] outline-none"
          />
        </div>
      )}

      {/* Session Action Buttons */}
      {hasSessionData && (
        <div className="flex items-center gap-2 pt-1">
          {/* Pause button if running */}
          {isTimerRunning && (
            <button
              onClick={pauseTimer}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-semibold text-white dark:text-[#09090b] bg-[#1f1d1a] dark:bg-[#f4f4f5] hover:opacity-90 active:scale-[0.98] transition shadow-md ${
              isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Finish & Save</span>
          </button>

          {/* Note Toggle Button */}
          <button
            onClick={() => setShowNotesInput(!showNotesInput)}
            className={`p-3 rounded-2xl border transition active:scale-[0.98] ${
              notes || showNotesInput
                ? 'bg-[#1f1d1a] text-white border-transparent dark:bg-[#f4f4f5] dark:text-[#09090b]'
                : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
            }`}
            title="Add notes"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Reset / Cancel Button */}
          <button
            onClick={resetTimer}
            className="p-3 rounded-2xl bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa] hover:text-rose-500 dark:hover:text-rose-400 transition active:scale-[0.98]"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
