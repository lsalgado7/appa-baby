import React, { useMemo } from 'react';
import { useApp } from '../context/useApp';
import { formatDurationText, isSameDay } from '../utils/time';
import { Clock, Activity, Droplets, Calendar } from 'lucide-react';

export const DailyStats: React.FC = () => {
  const { nursingSessions, pumpingSessions } = useApp();

  const stats = useMemo(() => {
    const today = new Date();

    const todayNursing = nursingSessions.filter((s) => isSameDay(new Date(s.start_time), today));
    const todayPumping = pumpingSessions.filter((s) => isSameDay(new Date(s.start_time), today));

    const totalNursingSeconds = todayNursing.reduce(
      (acc, s) => acc + s.left_duration_seconds + s.right_duration_seconds,
      0
    );

    const feedCount = todayNursing.length;

    let totalPumpedOz = 0;
    todayPumping.forEach((p) => {
      const vol = (p.left_amount || 0) + (p.right_amount || 0);
      if (p.unit === 'ml') {
        totalPumpedOz += vol / 29.5735; // Convert ml to oz
      } else {
        totalPumpedOz += vol;
      }
    });

    // Average interval between feeds today (if 2+ feeds)
    let avgIntervalMinutes: number | null = null;
    if (todayNursing.length >= 2) {
      const sorted = [...todayNursing].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      let totalIntervalMs = 0;
      for (let i = 1; i < sorted.length; i++) {
        totalIntervalMs +=
          new Date(sorted[i].start_time).getTime() - new Date(sorted[i - 1].start_time).getTime();
      }
      avgIntervalMinutes = Math.round(totalIntervalMs / (sorted.length - 1) / 60000);
    }

    return {
      totalNursingSeconds,
      feedCount,
      totalPumpedOz,
      avgIntervalMinutes,
    };
  }, [nursingSessions, pumpingSessions]);

  return (
    <div className="w-full bg-[#f3efe9] dark:bg-[#18181b] rounded-3xl p-4 border border-[#e6e2da] dark:border-[#27272a] shadow-xs">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#746f68] dark:text-[#a1a1aa]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Today's Summary</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Total Nursing Time */}
        <div className="bg-[#e8e2d8] dark:bg-[#27272a] rounded-2xl p-2.5 flex flex-col items-center justify-center">
          <Clock className="w-4 h-4 text-[#746f68] dark:text-[#a1a1aa] mb-1" />
          <span className="text-sm font-bold text-[#1f1d1a] dark:text-[#f4f4f5] tabular-nums">
            {stats.totalNursingSeconds > 0
              ? formatDurationText(stats.totalNursingSeconds)
              : '0m'}
          </span>
          <span className="text-[10px] text-[#746f68] dark:text-[#a1a1aa] font-medium">
            Nursing Time
          </span>
        </div>

        {/* Feeds Count & Avg Interval */}
        <div className="bg-[#e8e2d8] dark:bg-[#27272a] rounded-2xl p-2.5 flex flex-col items-center justify-center">
          <Activity className="w-4 h-4 text-[#746f68] dark:text-[#a1a1aa] mb-1" />
          <span className="text-sm font-bold text-[#1f1d1a] dark:text-[#f4f4f5] tabular-nums">
            {stats.feedCount} {stats.feedCount === 1 ? 'feed' : 'feeds'}
          </span>
          <span className="text-[10px] text-[#746f68] dark:text-[#a1a1aa] font-medium">
            {stats.avgIntervalMinutes
              ? `Avg ${Math.floor(stats.avgIntervalMinutes / 60)}h ${
                  stats.avgIntervalMinutes % 60
                }m`
              : 'Daily Sessions'}
          </span>
        </div>

        {/* Pumped Milk */}
        <div className="bg-[#e8e2d8] dark:bg-[#27272a] rounded-2xl p-2.5 flex flex-col items-center justify-center">
          <Droplets className="w-4 h-4 text-[#746f68] dark:text-[#a1a1aa] mb-1" />
          <span className="text-sm font-bold text-[#1f1d1a] dark:text-[#f4f4f5] tabular-nums">
            {stats.totalPumpedOz > 0 ? `${stats.totalPumpedOz.toFixed(1)} oz` : '0 oz'}
          </span>
          <span className="text-[10px] text-[#746f68] dark:text-[#a1a1aa] font-medium">
            Pumped Milk
          </span>
        </div>
      </div>
    </div>
  );
};
