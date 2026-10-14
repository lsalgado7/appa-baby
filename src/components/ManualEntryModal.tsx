import React, { useState } from 'react';
import { useApp } from '../context/useApp';
import type { SessionType, VolumeUnit, FeedSide, MilkType } from '../types';
import { X, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose }) => {
  const { loggedBy, addNursingSession, addPumpingSession, addBottleFeeding } = useApp();

  const [sessionType, setSessionType] = useState<SessionType>('nursing');
  const [startTime, setStartTime] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 20);
    return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  const [leftMinutes, setLeftMinutes] = useState<string>('10');
  const [rightMinutes, setRightMinutes] = useState<string>('10');
  const [bottleDurationMinutes, setBottleDurationMinutes] = useState<string>('15');
  const [lastSide, setLastSide] = useState<FeedSide>('right');
  const [unit, setUnit] = useState<VolumeUnit>('oz');
  const [leftAmount, setLeftAmount] = useState<string>('2.0');
  const [rightAmount, setRightAmount] = useState<string>('2.0');
  const [bottleAmount, setBottleAmount] = useState<string>('3.5');
  const [milkType, setMilkType] = useState<MilkType>('breast_milk');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    triggerHaptic('success');

    try {
      const startIso = new Date(startTime).toISOString();

      if (sessionType === 'nursing') {
        const leftSec = (parseInt(leftMinutes, 10) || 0) * 60;
        const rightSec = (parseInt(rightMinutes, 10) || 0) * 60;
        const totalSec = leftSec + rightSec;
        const endIso = new Date(
          new Date(startIso).getTime() + (totalSec > 0 ? totalSec * 1000 : 15 * 60 * 1000)
        ).toISOString();

        await addNursingSession({
          start_time: startIso,
          end_time: endIso,
          left_duration_seconds: leftSec,
          right_duration_seconds: rightSec,
          last_side: lastSide,
          logged_by: loggedBy,
          notes,
        });
      } else if (sessionType === 'pumping') {
        const leftSec = (parseInt(leftMinutes, 10) || 0) * 60;
        const rightSec = (parseInt(rightMinutes, 10) || 0) * 60;
        const totalSec = leftSec + rightSec;
        const endIso = new Date(
          new Date(startIso).getTime() + (totalSec > 0 ? totalSec * 1000 : 15 * 60 * 1000)
        ).toISOString();

        await addPumpingSession({
          start_time: startIso,
          end_time: endIso,
          left_duration_seconds: leftSec,
          right_duration_seconds: rightSec,
          left_amount: parseFloat(leftAmount) || 0,
          right_amount: parseFloat(rightAmount) || 0,
          unit,
          logged_by: loggedBy,
          notes,
        });
      } else if (sessionType === 'bottle') {
        const durSec = (parseInt(bottleDurationMinutes, 10) || 0) * 60;
        const endIso = new Date(
          new Date(startIso).getTime() + (durSec > 0 ? durSec * 1000 : 10 * 60 * 1000)
        ).toISOString();

        await addBottleFeeding({
          start_time: startIso,
          end_time: endIso,
          duration_seconds: durSec,
          amount: parseFloat(bottleAmount) || 0,
          unit,
          milk_type: milkType,
          logged_by: loggedBy,
          notes,
        });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full sm:max-w-md bg-[#f9f8f6] dark:bg-[#121215] border border-[#e6e2da] dark:border-[#27272a] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#e6e2da] dark:border-[#27272a]">
          <h2 className="text-lg font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
            Manual Log Entry
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#746f68] dark:text-[#a1a1aa] hover:bg-[#e8e2d8] dark:hover:bg-[#27272a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* Type selector */}
          <div className="flex bg-[#e8e2d8] dark:bg-[#18181b] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setSessionType('nursing')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                sessionType === 'nursing'
                  ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
                  : 'text-[#746f68] dark:text-[#a1a1aa]'
              }`}
            >
              Nursing
            </button>
            <button
              type="button"
              onClick={() => setSessionType('bottle')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                sessionType === 'bottle'
                  ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
                  : 'text-[#746f68] dark:text-[#a1a1aa]'
              }`}
            >
              Bottle
            </button>
            <button
              type="button"
              onClick={() => setSessionType('pumping')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                sessionType === 'pumping'
                  ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
                  : 'text-[#746f68] dark:text-[#a1a1aa]'
              }`}
            >
              Pumping
            </button>
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
            />
          </div>

          {/* Nursing Specific: Splits & Last Side */}
          {sessionType === 'nursing' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
                    Left (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={leftMinutes}
                    onChange={(e) => setLeftMinutes(e.target.value)}
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
                    Right (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={rightMinutes}
                    onChange={(e) => setRightMinutes(e.target.value)}
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
                  Last Breast Fed
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLastSide('left')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      lastSide === 'left'
                        ? 'bg-[#1f1d1a] text-white border-transparent dark:bg-[#f4f4f5] dark:text-[#09090b]'
                        : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
                    }`}
                  >
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => setLastSide('right')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      lastSide === 'right'
                        ? 'bg-[#1f1d1a] text-white border-transparent dark:bg-[#f4f4f5] dark:text-[#09090b]'
                        : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
                    }`}
                  >
                    Right
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Bottle Specific: Amount, Milk Type & Duration */}
          {sessionType === 'bottle' && (
            <>
              {/* Milk Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
                  Bottle Content
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMilkType('breast_milk')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      milkType === 'breast_milk'
                        ? 'bg-[#1f1d1a] text-white border-transparent dark:bg-[#f4f4f5] dark:text-[#09090b]'
                        : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
                    }`}
                  >
                    Breast Milk
                  </button>
                  <button
                    type="button"
                    onClick={() => setMilkType('formula')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      milkType === 'formula'
                        ? 'bg-[#1f1d1a] text-white border-transparent dark:bg-[#f4f4f5] dark:text-[#09090b]'
                        : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
                    }`}
                  >
                    Formula
                  </button>
                  <button
                    type="button"
                    onClick={() => setMilkType('mixed')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      milkType === 'mixed'
                        ? 'bg-[#1f1d1a] text-white border-transparent dark:bg-[#f4f4f5] dark:text-[#09090b]'
                        : 'bg-[#f3efe9] dark:bg-[#18181b] border-[#e6e2da] dark:border-[#27272a] text-[#746f68] dark:text-[#a1a1aa]'
                    }`}
                  >
                    Mixed
                  </button>
                </div>
              </div>

              {/* Amount and Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
                      Amount
                    </label>
                    <div className="flex bg-[#e8e2d8] dark:bg-[#18181b] p-0.5 rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => setUnit('oz')}
                        className={`px-1.5 py-0.2 rounded font-medium ${
                          unit === 'oz'
                            ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
                            : 'text-[#746f68] dark:text-[#a1a1aa]'
                        }`}
                      >
                        oz
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnit('ml')}
                        className={`px-1.5 py-0.2 rounded font-medium ${
                          unit === 'ml'
                            ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
                            : 'text-[#746f68] dark:text-[#a1a1aa]'
                        }`}
                      >
                        ml
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={bottleAmount}
                    onChange={(e) => setBottleAmount(e.target.value)}
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bottleDurationMinutes}
                    onChange={(e) => setBottleDurationMinutes(e.target.value)}
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Pumping Specific: Volume amounts */}
          {sessionType === 'pumping' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
                  Milk Output
                </label>
                <div className="flex bg-[#e8e2d8] dark:bg-[#18181b] p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setUnit('oz')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      unit === 'oz'
                        ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
                        : 'text-[#746f68] dark:text-[#a1a1aa]'
                    }`}
                  >
                    oz
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('ml')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      unit === 'ml'
                        ? 'bg-[#1f1d1a] text-white dark:bg-[#f4f4f5] dark:text-[#09090b]'
                        : 'text-[#746f68] dark:text-[#a1a1aa]'
                    }`}
                  >
                    ml
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-[#746f68] dark:text-[#a1a1aa] mb-1">
                    Left ({unit})
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={leftAmount}
                    onChange={(e) => setLeftAmount(e.target.value)}
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-[#746f68] dark:text-[#a1a1aa] mb-1">
                    Right ({unit})
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={rightAmount}
                    onChange={(e) => setRightAmount(e.target.value)}
                    className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. drank happily, drowsy..."
              className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-semibold text-white dark:text-[#09090b] bg-[#1f1d1a] dark:bg-[#f4f4f5] hover:opacity-90 active:scale-[0.98] transition shadow-md"
          >
            <Check className="w-4 h-4" />
            <span>Save Entry</span>
          </button>
        </form>
      </div>
    </div>
  );
};
