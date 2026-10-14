import React, { useEffect, useState } from 'react';
import { useApp } from '../context/useApp';
import { formatTimeAgo, formatDurationText } from '../utils/time';
import { Clock, Sparkles } from 'lucide-react';

export const LastFedBanner: React.FC = () => {
  const { lastNursingSession, nextRecommendedSide } = useApp();
  const [, setRefreshKey] = useState(0);

  // Re-render relative time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!lastNursingSession) {
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
              Tap Left or Right to begin
            </p>
          </div>
        </div>
      </div>
    );
  }

  const timeAgo = formatTimeAgo(lastNursingSession.start_time);
  const totalDuration =
    lastNursingSession.left_duration_seconds + lastNursingSession.right_duration_seconds;

  return (
    <div className="w-full bg-[#f3efe9] dark:bg-[#18181b] rounded-2xl p-4 border border-[#e6e2da] dark:border-[#27272a] shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-[#746f68] dark:text-[#a1a1aa] uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Nursing Feed</span>
          <span>•</span>
          <span className="font-semibold text-[#1f1d1a] dark:text-[#f4f4f5] lowercase">
            {timeAgo}
          </span>
        </div>

        {nextRecommendedSide && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8e2d8] dark:bg-[#27272a] text-[#1f1d1a] dark:text-[#f4f4f5]">
            <span>Next:</span>
            <span className="capitalize text-emerald-700 dark:text-emerald-400 font-bold">
              {nextRecommendedSide}
            </span>
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold capitalize text-[#1f1d1a] dark:text-[#f4f4f5]">
            {lastNursingSession.last_side} breast
          </span>
          <span className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
            ({formatDurationText(totalDuration)})
          </span>
        </div>

        <div className="text-xs text-[#746f68] dark:text-[#a1a1aa]">
          L: {Math.round(lastNursingSession.left_duration_seconds / 60)}m • R:{' '}
          {Math.round(lastNursingSession.right_duration_seconds / 60)}m
        </div>
      </div>
    </div>
  );
};
