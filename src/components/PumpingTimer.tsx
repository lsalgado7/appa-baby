import React, { useState } from 'react';
import { useApp } from '../context/useApp';
import { formatDuration } from '../utils/time';
import type { VolumeUnit } from '../types';
import { Play, Pause, Check, RotateCcw, FileText, Droplets } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const PumpingTimer: React.FC = () => {
  const {
    activeTimer,
    leftSeconds,
    rightSeconds,
    totalSeconds,
    isTimerRunning,
    startSide,
    pauseTimer,
    resetTimer,
    saveActiveSession,
  } = useApp();

  const [unit, setUnit] = useState<VolumeUnit>('oz');
  const [leftAmount, setLeftAmount] = useState<string>('0');
  const [rightAmount, setRightAmount] = useState<string>('0');
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isBothActive =
    activeTimer?.status === 'running' && activeTimer?.active_side === 'both';
  const isLeftActive =
    activeTimer?.status === 'running' && activeTimer?.active_side === 'left';
  const isRightActive =
    activeTimer?.status === 'running' && activeTimer?.active_side === 'right';

  const handleStartBoth = () => {
    if (isBothActive) {
      pauseTimer();
    } else {
      startSide('both', 'pumping');
    }
  };

  const handleStartLeft = () => {
    if (isLeftActive) {
      pauseTimer();
    } else {
      startSide('left', 'pumping');
    }
  };

  const handleStartRight = () => {
    if (isRightActive) {
      pauseTimer();
    } else {
      startSide('right', 'pumping');
    }
  };

  const handleAddAmount = (side: 'left' | 'right', delta: number) => {
    triggerHaptic('light');
    if (side === 'left') {
      const current = parseFloat(leftAmount) || 0;
      setLeftAmount((Math.max(0, current + delta)).toFixed(1));
    } else {
      const current = parseFloat(rightAmount) || 0;
      setRightAmount((Math.max(0, current + delta)).toFixed(1));
    }
  };

  const handleSave = async () => {
    const leftVal = parseFloat(leftAmount) || 0;
    const rightVal = parseFloat(rightAmount) || 0;
    if (totalSeconds === 0 && leftVal === 0 && rightVal === 0) return;

    setIsSaving(true);
    try {
      await saveActiveSession(notes, {
        pumpingAmounts: {
          left: leftVal,
          right: rightVal,
          unit,
        },
      });
      setNotes('');
      setLeftAmount('0');
      setRightAmount('0');
      setShowNotesInput(false);
    } finally {
      setIsSaving(false);
    }
  };

  const totalVol = (parseFloat(leftAmount) || 0) + (parseFloat(rightAmount) || 0);
  const hasSessionData = totalSeconds > 0 || totalVol > 0;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Controls: Session title + Unit toggle */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
          Pumping Session
        </span>

        <div className="flex items-center gap-2">
          {/* Unit Toggle */}
          <div className="flex items-center bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-full p-0.5 text-xs">
            <button
              onClick={() => {
                triggerHaptic('light');
                setUnit('oz');
              }}
              className={`px-2 py-0.5 rounded-full font-semibold transition ${
                unit === 'oz'
                  ? 'bg-[#1f1d1a] dark:bg-[#f4f4f5] text-white dark:text-[#09090b]'
                  : 'text-[#746f68] dark:text-[#a1a1aa]'
              }`}
            >
              oz
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setUnit('ml');
              }}
              className={`px-2 py-0.5 rounded-full font-semibold transition ${
                unit === 'ml'
                  ? 'bg-[#1f1d1a] dark:bg-[#f4f4f5] text-white dark:text-[#09090b]'
                  : 'text-[#746f68] dark:text-[#a1a1aa]'
              }`}
            >
              ml
            </button>
          </div>

          <span className="text-sm font-semibold tabular-nums text-[#1f1d1a] dark:text-[#f4f4f5]">
            {formatDuration(totalSeconds)}
          </span>
        </div>
      </div>

      {/* Dual Pump Button (Common for electric pumps) */}
      <button
        onClick={handleStartBoth}
        type="button"
        className={`w-full py-4 px-6 rounded-3xl transition-all duration-200 border flex items-center justify-between active:scale-[0.98] select-none ${
          isBothActive
            ? 'bg-[#1f1d1a] text-white border-transparent shadow-lg dark:bg-[#f4f4f5] dark:text-[#09090b]'
            : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isBothActive
                ? 'bg-white/20 dark:bg-black/15'
                : 'bg-[#e8e2d8] dark:bg-[#27272a]'
            }`}
          >
            <Droplets className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Pump Both Breasts</p>
            <p
              className={`text-xs ${
                isBothActive
                  ? 'text-white/80 dark:text-[#09090b]/80'
                  : 'text-[#746f68] dark:text-[#a1a1aa]'
              }`}
            >
              Simultaneous double pumping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBothActive ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-black/15 text-xs font-semibold">
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause Both</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8e2d8] dark:bg-[#27272a] text-[#746f68] dark:text-[#a1a1aa] text-xs font-semibold">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Both</span>
            </div>
          )}
        </div>
      </button>

      {/* Side-by-side volume and duration inputs */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Left Side */}
        <div className="bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
              Left Breast
            </span>
            <button
              onClick={handleStartLeft}
              className={`p-1.5 rounded-full text-xs font-medium transition ${
                isLeftActive
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#e8e2d8] dark:bg-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
              }`}
              title="Toggle Left Timer"
            >
              {isLeftActive ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
          </div>

          <div className="text-xs text-[#746f68] dark:text-[#a1a1aa] tabular-nums mb-3">
            Duration: {formatDuration(leftSeconds)}
          </div>

          {/* Amount input */}
          <div className="flex items-baseline justify-between mb-2">
            <input
              type="number"
              step="0.5"
              min="0"
              value={leftAmount}
              onChange={(e) => setLeftAmount(e.target.value)}
              className="text-2xl font-bold bg-transparent outline-none w-20 text-[#1f1d1a] dark:text-[#f4f4f5] tabular-nums"
            />
            <span className="text-xs font-semibold text-[#746f68] dark:text-[#a1a1aa]">
              {unit}
            </span>
          </div>

          {/* Quick volume chips */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAddAmount('left', unit === 'oz' ? 0.5 : 15)}
              className="flex-1 py-1 text-xs font-medium rounded-lg bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80"
            >
              +{unit === 'oz' ? '0.5' : '15'}
            </button>
            <button
              onClick={() => handleAddAmount('left', unit === 'oz' ? 1.0 : 30)}
              className="flex-1 py-1 text-xs font-medium rounded-lg bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80"
            >
              +{unit === 'oz' ? '1.0' : '30'}
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className="bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
              Right Breast
            </span>
            <button
              onClick={handleStartRight}
              className={`p-1.5 rounded-full text-xs font-medium transition ${
                isRightActive
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#e8e2d8] dark:bg-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
              }`}
              title="Toggle Right Timer"
            >
              {isRightActive ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
          </div>

          <div className="text-xs text-[#746f68] dark:text-[#a1a1aa] tabular-nums mb-3">
            Duration: {formatDuration(rightSeconds)}
          </div>

          {/* Amount input */}
          <div className="flex items-baseline justify-between mb-2">
            <input
              type="number"
              step="0.5"
              min="0"
              value={rightAmount}
              onChange={(e) => setRightAmount(e.target.value)}
              className="text-2xl font-bold bg-transparent outline-none w-20 text-[#1f1d1a] dark:text-[#f4f4f5] tabular-nums"
            />
            <span className="text-xs font-semibold text-[#746f68] dark:text-[#a1a1aa]">
              {unit}
            </span>
          </div>

          {/* Quick volume chips */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAddAmount('right', unit === 'oz' ? 0.5 : 15)}
              className="flex-1 py-1 text-xs font-medium rounded-lg bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80"
            >
              +{unit === 'oz' ? '0.5' : '15'}
            </button>
            <button
              onClick={() => handleAddAmount('right', unit === 'oz' ? 1.0 : 30)}
              className="flex-1 py-1 text-xs font-medium rounded-lg bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80"
            >
              +{unit === 'oz' ? '1.0' : '30'}
            </button>
          </div>
        </div>
      </div>

      {/* Total Volume Summary */}
      {totalVol > 0 && (
        <div className="text-center text-xs font-semibold text-[#746f68] dark:text-[#a1a1aa]">
          Total Pumped: <span className="text-[#1f1d1a] dark:text-[#f4f4f5] text-sm">{totalVol.toFixed(1)} {unit}</span>
        </div>
      )}

      {/* Optional Note Input */}
      {showNotesInput && (
        <div className="w-full bg-[#f3efe9] dark:bg-[#18181b] rounded-2xl p-3 border border-[#e6e2da] dark:border-[#27272a] animate-in fade-in duration-200">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add pumping notes..."
            className="w-full bg-transparent text-sm text-[#1f1d1a] dark:text-[#f4f4f5] placeholder-[#746f68] dark:placeholder-[#71717a] outline-none"
          />
        </div>
      )}

      {/* Pumping Action Buttons */}
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
            <span>Save Pumping</span>
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
