import React, { useEffect, useState } from 'react';
import { useApp } from '../context/useApp';
import { formatTimeAgo, formatDurationText } from '../utils/time';
import { Clock, Sparkles, Heart, Milk } from 'lucide-react';

export const LastFedBanner: React.FC = () => {
  const { lastFeedingOverall, nextRecommendedSide } = useApp();
  const [, setRefreshKey] = useState(0);

  // Re-render relative time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!lastFeedingOverall) {
    return (
      <div className="w-full bg-[#f3efe9] dark:bg-[#18181b] rounded-2xl p-4 border border-[#e6e2da] dark:border-[#27272a] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#e8e2d8] dark:bg-[#27272a] flex items-center justify-center text-[#746f68] dark:text-[#a1a1aa]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#746f68] dark:text-[#a1a1aa] uppercase tracking-wider">
              Ready for First Feeding
            </p>
            <p className="text-sm font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
              Tap Nursing or Bottle to begin
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isNursing = lastFeedingOverall.type === 'nursing';
  const nursing = isNursing ? lastFeedingOverall.session : null;
  const bottle = !isNursing ? lastFeedingOverall.feeding : null;

  const timeAgo = formatTimeAgo(
    isNursing ? nursing!.start_time : bottle!.start_time
  );

  const milkTypeLabel =
    bottle?.milk_type === 'breast_milk'
      ? 'Breast Milk'
      : bottle?.milk_type === 'formula'
      ? 'Formula'
      : 'Mixed';

  return (
    <div className="w-full bg-[#f3efe9] dark:bg-[#18181b] rounded-2xl p-4 border border-[#e6e2da] dark:border-[#27272a] shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-[#746f68] dark:text-[#a1a1aa] uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Feeding</span>
          <span>•</span>
          <span className="font-semibold text-[#1f1d1a] dark:text-[#f4f4f5] lowercase">
            {timeAgo}
          </span>
        </div>

        {nextRecommendedSide && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5]">
            <span>Next Nurse:</span>
            <span className="capitalize text-emerald-700 dark:text-emerald-400 font-bold">
              {nextRecommendedSide}
            </span>
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          {isNursing ? (
            <>
              <Heart className="w-4 h-4 fill-current text-rose-500/80 shrink-0" />
              <span className="text-lg font-semibold capitalize text-[#1f1d1a] dark:text-[#f4f4f5]">
                {nursing!.last_side} breast
              </span>
              <span className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
                ({formatDurationText(
                  nursing!.left_duration_seconds + nursing!.right_duration_seconds
                )})
              </span>
            </>
          ) : (
            <>
              <Milk className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="text-lg font-semibold text-[#1f1d1a] dark:text-[#f4f4f5]">
                {bottle!.amount} {bottle!.unit}
              </span>
              <span className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
                ({milkTypeLabel})
              </span>
            </>
          )}
        </div>

        <div className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
          {isNursing ? (
            `L: ${Math.round(nursing!.left_duration_seconds / 60)}m • R: ${Math.round(
              nursing!.right_duration_seconds / 60
            )}m`
          ) : bottle!.duration_seconds > 0 ? (
            `${Math.round(bottle!.duration_seconds / 60)}m bottle feed`
          ) : (
            'Bottle feed'
          )}
        </div>
      </div>
    </div>
  );
};
