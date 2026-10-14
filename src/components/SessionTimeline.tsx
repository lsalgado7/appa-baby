import React from 'react';
import { useApp } from '../context/useApp';
import type { TimelineItem, NursingSession, PumpingSession, BottleFeeding } from '../types';
import { formatClockTime, formatDateLabel, formatDurationText } from '../utils/time';
import { Droplets, Heart, Trash2, Edit3, MessageSquare, Milk } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface SessionTimelineProps {
  onEditSession: (item: TimelineItem) => void;
}

export const SessionTimeline: React.FC<SessionTimelineProps> = ({ onEditSession }) => {
  const {
    nursingSessions,
    pumpingSessions,
    bottleFeedings,
    deleteNursingSession,
    deletePumpingSession,
    deleteBottleFeeding,
  } = useApp();

  // Combine and sort chronologically descending
  const timelineItems: TimelineItem[] = [
    ...nursingSessions.map((s) => ({ ...s, type: 'nursing' as const })),
    ...pumpingSessions.map((s) => ({ ...s, type: 'pumping' as const })),
    ...bottleFeedings.map((s) => ({ ...s, type: 'bottle' as const })),
  ].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // Group by date label
  const groupedItems = timelineItems.reduce<{ [dateKey: string]: TimelineItem[] }>(
    (groups, item) => {
      const dateKey = formatDateLabel(item.start_time);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
      return groups;
    },
    {}
  );

  const handleDelete = (item: TimelineItem) => {
    triggerHaptic('warning');
    if (confirm('Delete this entry?')) {
      if (item.type === 'nursing') {
        deleteNursingSession(item.id);
      } else if (item.type === 'pumping') {
        deletePumpingSession(item.id);
      } else if (item.type === 'bottle') {
        deleteBottleFeeding(item.id);
      }
    }
  };

  if (timelineItems.length === 0) {
    return (
      <div className="w-full text-center py-10 px-4 bg-[#f3efe9]/50 dark:bg-[#18181b]/50 rounded-3xl border border-dashed border-[#e6e2da] dark:border-[#27272a]">
        <p className="text-sm font-medium text-[#746f68] dark:text-[#a1a1aa]">
          No sessions recorded yet
        </p>
        <p className="text-xs text-[#746f68]/80 dark:text-[#a1a1aa]/80 mt-1">
          Your feedings and pump sessions will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      {Object.entries(groupedItems).map(([dateLabel, items]) => (
        <div key={dateLabel} className="flex flex-col gap-2.5">
          <div className="px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
              {dateLabel}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const isNursing = item.type === 'nursing';
              const isPumping = item.type === 'pumping';
              const isBottle = item.type === 'bottle';

              const nursingItem = isNursing ? (item as NursingSession) : null;
              const pumpingItem = isPumping ? (item as PumpingSession) : null;
              const bottleItem = isBottle ? (item as BottleFeeding) : null;

              const totalDuration = isNursing
                ? nursingItem!.left_duration_seconds + nursingItem!.right_duration_seconds
                : isPumping
                ? pumpingItem!.left_duration_seconds + pumpingItem!.right_duration_seconds
                : bottleItem!.duration_seconds;

              const milkLabel =
                bottleItem?.milk_type === 'breast_milk'
                  ? 'Breast Milk'
                  : bottleItem?.milk_type === 'formula'
                  ? 'Formula'
                  : 'Mixed';

              return (
                <div
                  key={item.id}
                  className="bg-[#f3efe9] dark:bg-[#18181b] border border-[#e6e2da] dark:border-[#27272a] rounded-2xl p-3.5 flex items-start justify-between gap-3 shadow-2xs hover:border-[#d1ccbf] dark:hover:border-[#3f3f46] transition"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isNursing
                          ? 'bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5]'
                          : isPumping
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isNursing ? (
                        <Heart className="w-4 h-4 fill-current opacity-80" />
                      ) : isPumping ? (
                        <Droplets className="w-4 h-4" />
                      ) : (
                        <Milk className="w-4 h-4" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1f1d1a] dark:text-[#f4f4f5] uppercase tracking-wider">
                          {isNursing ? 'Nursing' : isPumping ? 'Pumping' : 'Bottle'}
                        </span>
                        <span className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
                          • {formatClockTime(item.start_time)}
                        </span>
                        {item.logged_by && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#e8e2d8] dark:bg-[#27272a] text-[#746f68] dark:text-[#a1a1aa]">
                            {item.logged_by}
                          </span>
                        )}
                      </div>

                      {/* Main Metric */}
                      <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                        {isNursing && (
                          <>
                            <span className="text-sm font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
                              {formatDurationText(totalDuration)}
                            </span>
                            <span className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
                              (L: {Math.round(nursingItem!.left_duration_seconds / 60)}m, R:{' '}
                              {Math.round(nursingItem!.right_duration_seconds / 60)}m)
                            </span>
                          </>
                        )}

                        {isPumping && (
                          <>
                            <span className="text-sm font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
                              {(
                                (pumpingItem!.left_amount || 0) +
                                (pumpingItem!.right_amount || 0)
                              ).toFixed(1)}{' '}
                              {pumpingItem!.unit}
                            </span>
                            {totalDuration > 0 && (
                              <span className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
                                ({formatDurationText(totalDuration)})
                              </span>
                            )}
                          </>
                        )}

                        {isBottle && (
                          <>
                            <span className="text-sm font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
                              {bottleItem!.amount.toFixed(1)} {bottleItem!.unit}
                            </span>
                            <span className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
                              ({milkLabel}
                              {totalDuration > 0
                                ? ` • ${formatDurationText(totalDuration)}`
                                : ''}
                              )
                            </span>
                          </>
                        )}
                      </div>

                      {/* Notes snippet */}
                      {item.notes && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#746f68] dark:text-[#a1a1aa] italic">
                          <MessageSquare className="w-3 h-3 shrink-0 opacity-70" />
                          <span className="truncate">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditSession(item)}
                      className="p-1.5 rounded-lg text-[#746f68] dark:text-[#a1a1aa] hover:bg-[#e8e2d8] dark:hover:bg-[#27272a] transition"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg text-[#746f68] dark:text-[#a1a1aa] hover:text-rose-500 hover:bg-[#e8e2d8] dark:hover:bg-[#27272a] transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
