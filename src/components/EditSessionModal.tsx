import React, { useState } from 'react';
import { useApp } from '../context/useApp';
import type { TimelineItem, NursingSession, PumpingSession, FeedSide, VolumeUnit } from '../types';
import { X, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface EditSessionModalProps {
  item: TimelineItem | null;
  onClose: () => void;
}

const EditSessionForm: React.FC<{ item: TimelineItem; onClose: () => void }> = ({ item, onClose }) => {
  const { updateNursingSession, updatePumpingSession } = useApp();

  const isNursing = item.type === 'nursing';
  const nursingItem = isNursing ? (item as NursingSession) : null;
  const pumpingItem = !isNursing ? (item as PumpingSession) : null;

  const [startTime, setStartTime] = useState(() => {
    const date = new Date(item.start_time);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  const [leftMinutes, setLeftMinutes] = useState(() =>
    Math.round(item.left_duration_seconds / 60).toString()
  );
  const [rightMinutes, setRightMinutes] = useState(() =>
    Math.round(item.right_duration_seconds / 60).toString()
  );
  const [lastSide, setLastSide] = useState<FeedSide>(() =>
    isNursing ? nursingItem?.last_side || 'left' : 'left'
  );
  const [unit, setUnit] = useState<VolumeUnit>(() =>
    !isNursing ? pumpingItem?.unit || 'oz' : 'oz'
  );
  const [leftAmount, setLeftAmount] = useState(() =>
    !isNursing ? pumpingItem?.left_amount?.toString() || '0' : '0'
  );
  const [rightAmount, setRightAmount] = useState(() =>
    !isNursing ? pumpingItem?.right_amount?.toString() || '0' : '0'
  );
  const [notes, setNotes] = useState(item.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    triggerHaptic('success');

    try {
      const startIso = new Date(startTime).toISOString();
      const leftSec = (parseInt(leftMinutes, 10) || 0) * 60;
      const rightSec = (parseInt(rightMinutes, 10) || 0) * 60;
      const totalSec = leftSec + rightSec;

      const endIso = new Date(
        new Date(startIso).getTime() + (totalSec > 0 ? totalSec * 1000 : 15 * 60 * 1000)
      ).toISOString();

      if (isNursing) {
        const updated: NursingSession = {
          ...(item as NursingSession),
          start_time: startIso,
          end_time: endIso,
          left_duration_seconds: leftSec,
          right_duration_seconds: rightSec,
          last_side: lastSide,
          notes,
        };
        await updateNursingSession(updated);
      } else {
        const updated: PumpingSession = {
          ...(item as PumpingSession),
          start_time: startIso,
          end_time: endIso,
          left_duration_seconds: leftSec,
          right_duration_seconds: rightSec,
          left_amount: parseFloat(leftAmount) || 0,
          right_amount: parseFloat(rightAmount) || 0,
          unit,
          notes,
        };
        await updatePumpingSession(updated);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
      {/* Start Time */}
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

      {/* Duration Splits */}
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

      {/* Nursing Specific: Last side */}
      {isNursing && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa] mb-1">
            Last Side Fed
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
      )}

      {/* Pumping Specific: Volume amounts */}
      {!isNursing && (
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
          Notes
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-xl px-3 py-2 text-sm text-[#1f1d1a] dark:text-[#f4f4f5] outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-semibold text-white dark:text-[#09090b] bg-[#1f1d1a] dark:bg-[#f4f4f5] hover:opacity-90 active:scale-[0.98] transition shadow-md"
      >
        <Check className="w-4 h-4" />
        <span>Update Session</span>
      </button>
    </form>
  );
};

export const EditSessionModal: React.FC<EditSessionModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full sm:max-w-md bg-[#f9f8f6] dark:bg-[#121215] border border-[#e6e2da] dark:border-[#27272a] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#e6e2da] dark:border-[#27272a]">
          <h2 className="text-lg font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
            Edit {item.type === 'nursing' ? 'Nursing' : 'Pumping'} Session
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#746f68] dark:text-[#a1a1aa] hover:bg-[#e8e2d8] dark:hover:bg-[#27272a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <EditSessionForm key={item.id} item={item} onClose={onClose} />
      </div>
    </div>
  );
};
