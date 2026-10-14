import React, { useState } from 'react';
import { useApp } from '../context/useApp';
import type { VolumeUnit, MilkType } from '../types';
import { formatDuration } from '../utils/time';
import { Play, Pause, Check, RotateCcw, FileText, Milk, Baby } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export const BottleLogger: React.FC = () => {
  const {
    activeTimer,
    totalSeconds,
    isTimerRunning,
    startSide,
    pauseTimer,
    resetTimer,
    saveActiveSession,
    logQuickBottle,
  } = useApp();

  const [unit, setUnit] = useState<VolumeUnit>('oz');
  const [milkType, setMilkType] = useState<MilkType>('breast_milk');
  const [amount, setAmount] = useState<string>('3.5');
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isBottleTimerRunning =
    activeTimer?.session_type === 'bottle' && isTimerRunning;
  const hasRunningTimer =
    activeTimer?.session_type === 'bottle' && totalSeconds > 0;

  const handleStartTimer = () => {
    if (isBottleTimerRunning) {
      pauseTimer();
    } else {
      startSide('left', 'bottle');
    }
  };

  const handleAddAmount = (delta: number) => {
    triggerHaptic('light');
    const current = parseFloat(amount) || 0;
    setAmount(Math.max(0, current + delta).toFixed(1));
  };

  const handleSetPreset = (val: number) => {
    triggerHaptic('light');
    setAmount(val.toFixed(1));
  };

  const handleSave = async () => {
    const vol = parseFloat(amount) || 0;
    if (vol === 0 && totalSeconds === 0) return;

    setIsSaving(true);
    try {
      if (hasRunningTimer) {
        await saveActiveSession(notes, {
          bottle: {
            amount: vol,
            unit,
            milkType,
          },
        });
      } else {
        await logQuickBottle(vol, unit, milkType, 0, notes);
      }
      setNotes('');
      setShowNotesInput(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Session Title & Unit Toggle */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
          Bottle Feeding
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

          {hasRunningTimer && (
            <span className="text-sm font-semibold tabular-nums text-[#1f1d1a] dark:text-[#f4f4f5]">
              {formatDuration(totalSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Milk Type Selector */}
      <div className="flex bg-[#f3efe9] dark:bg-[#18181b] p-1 rounded-2xl border border-[#e6e2da] dark:border-[#27272a]">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setMilkType('breast_milk');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            milkType === 'breast_milk'
              ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] shadow-xs'
              : 'text-[#746f68] dark:text-[#a1a1aa]'
          }`}
        >
          Breast Milk
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setMilkType('formula');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            milkType === 'formula'
              ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] shadow-xs'
              : 'text-[#746f68] dark:text-[#a1a1aa]'
          }`}
        >
          Formula
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setMilkType('mixed');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            milkType === 'mixed'
              ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b] shadow-xs'
              : 'text-[#746f68] dark:text-[#a1a1aa]'
          }`}
        >
          Mixed
        </button>
      </div>

      {/* Main Volume Display & Stepper Card */}
      <div className="bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-3xl p-6 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#e8e2d8] dark:bg-[#27272a] flex items-center justify-center text-[#1f1d1a] dark:text-[#f4f4f5]">
            <Milk className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
            Bottle Amount
          </span>
        </div>

        {/* Big Volume Input */}
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            step="0.5"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-5xl font-bold tracking-tight bg-transparent text-center outline-none w-36 text-[#1f1d1a] dark:text-[#f4f4f5] tabular-nums"
          />
          <span className="text-xl font-semibold text-[#746f68] dark:text-[#a1a1aa]">
            {unit}
          </span>
        </div>

        {/* Quick presets & increments */}
        <div className="w-full flex items-center justify-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleAddAmount(unit === 'oz' ? 0.5 : 15)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80 active:scale-[0.98] transition"
          >
            +{unit === 'oz' ? '0.5' : '15'}
          </button>
          <button
            onClick={() => handleAddAmount(unit === 'oz' ? 1.0 : 30)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80 active:scale-[0.98] transition"
          >
            +{unit === 'oz' ? '1.0' : '30'}
          </button>
          <button
            onClick={() => handleSetPreset(unit === 'oz' ? 2.0 : 60)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80 active:scale-[0.98] transition"
          >
            {unit === 'oz' ? '2.0' : '60'}
          </button>
          <button
            onClick={() => handleSetPreset(unit === 'oz' ? 3.0 : 90)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80 active:scale-[0.98] transition"
          >
            {unit === 'oz' ? '3.0' : '90'}
          </button>
          <button
            onClick={() => handleSetPreset(unit === 'oz' ? 4.0 : 120)}
            className="py-1.5 px-3 text-xs font-semibold rounded-xl bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5] hover:opacity-80 active:scale-[0.98] transition"
          >
            {unit === 'oz' ? '4.0' : '120'}
          </button>
        </div>
      </div>

      {/* Optional Bottle Feeding Timer Card */}
      <div className="bg-[#f3efe9]/60 dark:bg-[#18181b]/60 border border-[#e6e2da] dark:border-[#27272a] rounded-2xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Baby className="w-4 h-4 text-[#746f68] dark:text-[#a1a1aa]" />
          <div>
            <p className="text-xs font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
              Feeding Duration
            </p>
            <p className="text-[11px] text-[#746f68] dark:text-[#a1a1aa]">
              {hasRunningTimer
                ? `Running: ${formatDuration(totalSeconds)}`
                : 'Optional live timer'}
            </p>
          </div>
        </div>

        <button
          onClick={handleStartTimer}
          type="button"
          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition active:scale-[0.98] ${
            isBottleTimerRunning
              ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
              : 'bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5]'
          }`}
        >
          {isBottleTimerRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{hasRunningTimer ? 'Resume' : 'Start Timer'}</span>
            </>
          )}
        </button>
      </div>

      {/* Optional Note Accordion */}
      {showNotesInput && (
        <div className="w-full bg-[#f3efe9] dark:bg-[#18181b] rounded-2xl p-3 border border-[#e6e2da] dark:border-[#27272a] animate-in fade-in duration-200">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add bottle notes (e.g. drank all, burped well)..."
            className="w-full bg-transparent text-sm text-[#1f1d1a] dark:text-[#f4f4f5] placeholder-[#746f68] dark:placeholder-[#71717a] outline-none"
          />
        </div>
      )}

      {/* Primary Log Action Button */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold text-white dark:text-[#09090b] bg-[#1f1d1a] dark:bg-[#f4f4f5] hover:opacity-90 active:scale-[0.98] transition shadow-md ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Check className="w-4 h-4" />
          <span>
            {hasRunningTimer
              ? `Save Bottle (${amount} ${unit} • ${Math.round(totalSeconds / 60)}m)`
              : `Log Bottle (${amount} ${unit})`}
          </span>
        </button>

        {/* Note Toggle */}
        <button
          onClick={() => setShowNotesInput(!showNotesInput)}
          className={`p-3.5 rounded-2xl border transition active:scale-[0.98] ${
            notes || showNotesInput
              ? 'bg-[#1f1d1a] text-white border-transparent dark:bg-[#f4f4f5] dark:text-[#09090b]'
              : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
          }`}
          title="Add notes"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Reset Timer if timer active */}
        {hasRunningTimer && (
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa] hover:text-rose-500 dark:hover:text-rose-400 transition active:scale-[0.98]"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
