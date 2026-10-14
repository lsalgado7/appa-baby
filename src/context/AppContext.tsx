import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import type {
  NursingSession,
  PumpingSession,
  ActiveTimerState,
  FeedSide,
  ActiveSide,
  SessionType,
  VolumeUnit,
} from '../types';
import {
  getLocalNursingSessions,
  saveLocalNursingSessions,
  getLocalPumpingSessions,
  saveLocalPumpingSessions,
  getLocalActiveTimer,
  saveLocalActiveTimer,
  getStoredFamilyId,
  setStoredFamilyId,
  getStoredLoggedBy,
  setStoredLoggedBy,
} from '../services/storage';
import {
  getSupabase,
  getSupabaseConfig,
  fetchRemoteNursingSessions,
  upsertRemoteNursingSession,
  deleteRemoteNursingSession,
  fetchRemotePumpingSessions,
  upsertRemotePumpingSession,
  deleteRemotePumpingSession,
  fetchRemoteActiveTimer,
  upsertRemoteActiveTimer,
  subscribeToFamilySync,
} from '../services/supabase';
import { triggerHaptic } from '../utils/haptics';

export interface AppContextType {
  familyId: string;
  setFamilyId: (id: string) => void;
  loggedBy: string;
  setLoggedBy: (name: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeTab: SessionType;
  setActiveTab: (tab: SessionType) => void;

  // Sessions
  nursingSessions: NursingSession[];
  pumpingSessions: PumpingSession[];
  addNursingSession: (session: Omit<NursingSession, 'id' | 'family_id' | 'created_at'>) => Promise<void>;
  updateNursingSession: (session: NursingSession) => Promise<void>;
  deleteNursingSession: (id: string) => Promise<void>;
  addPumpingSession: (session: Omit<PumpingSession, 'id' | 'family_id' | 'created_at'>) => Promise<void>;
  updatePumpingSession: (session: PumpingSession) => Promise<void>;
  deletePumpingSession: (id: string) => Promise<void>;

  // Active Timer State & Elapsed
  activeTimer: ActiveTimerState | null;
  leftSeconds: number;
  rightSeconds: number;
  totalSeconds: number;
  isTimerRunning: boolean;

  // Timer Actions
  startSide: (side: ActiveSide, sessionType?: SessionType) => void;
  pauseTimer: () => void;
  switchSide: (side: 'left' | 'right') => void;
  resetTimer: () => void;
  saveActiveSession: (notes?: string, pumpingAmounts?: { left: number; right: number; unit: VolumeUnit }) => Promise<void>;

  // Derived Info
  lastNursingSession: NursingSession | null;
  nextRecommendedSide: FeedSide | null;
  isSupabaseConfigured: boolean;
  isSyncing: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [familyId, setFamilyIdState] = useState<string>(getStoredFamilyId);
  const [loggedBy, setLoggedByState] = useState<string>(getStoredLoggedBy);
  const [activeTab, setActiveTab] = useState<SessionType>('nursing');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('appa_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [nursingSessions, setNursingSessions] = useState<NursingSession[]>(getLocalNursingSessions);
  const [pumpingSessions, setPumpingSessions] = useState<PumpingSession[]>(getLocalPumpingSessions);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(getLocalActiveTimer);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Live timer tick to recalculate dynamic duration every second
  const [tick, setTick] = useState<number>(0);

  // Dark mode class application
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('appa_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('appa_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const setFamilyId = (id: string) => {
    setFamilyIdState(id);
    setStoredFamilyId(id);
  };

  const setLoggedBy = (name: string) => {
    setLoggedByState(name);
    setStoredLoggedBy(name);
  };

  // Keep local storage updated
  useEffect(() => {
    saveLocalNursingSessions(nursingSessions);
  }, [nursingSessions]);

  useEffect(() => {
    saveLocalPumpingSessions(pumpingSessions);
  }, [pumpingSessions]);

  useEffect(() => {
    saveLocalActiveTimer(activeTimer);
  }, [activeTimer]);

  const isTimerActive = activeTimer?.status === 'running';

  // Live 1-second interval to force re-render elapsed times while active
  useEffect(() => {
    if (isTimerActive) {
      const interval = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerActive]);

  // Dynamically compute exact duration from timestamps
  const { leftSeconds, rightSeconds, totalSeconds, isTimerRunning } = useMemo(() => {
    // Reference tick so memo recalculates every second
    void tick;

    if (!activeTimer) {
      return { leftSeconds: 0, rightSeconds: 0, totalSeconds: 0, isTimerRunning: false };
    }

    let left = activeTimer.left_duration_seconds;
    let right = activeTimer.right_duration_seconds;
    const isRunning = activeTimer.status === 'running';

    if (isRunning && activeTimer.side_start_time) {
      const nowMs = Date.now();
      const startMs = new Date(activeTimer.side_start_time).getTime();
      const liveElapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));

      if (activeTimer.active_side === 'left') {
        left += liveElapsed;
      } else if (activeTimer.active_side === 'right') {
        right += liveElapsed;
      } else if (activeTimer.active_side === 'both') {
        left += liveElapsed;
        right += liveElapsed;
      }
    }

    return {
      leftSeconds: left,
      rightSeconds: right,
      totalSeconds: left + right,
      isTimerRunning: isRunning,
    };
  }, [activeTimer, tick]);

  // Sync with Supabase (if configured)
  const isSupabaseConfigured = useMemo(() => getSupabaseConfig().isConfigured, []);

  // Fetch initial remote data and subscribe to real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;

    const initRemote = async () => {
      setIsSyncing(true);
      try {
        const [remoteNursing, remotePumping, remoteTimer] = await Promise.all([
          fetchRemoteNursingSessions(familyId),
          fetchRemotePumpingSessions(familyId),
          fetchRemoteActiveTimer(familyId),
        ]);

        if (!isMounted) return;

        if (remoteNursing.length > 0) {
          setNursingSessions(remoteNursing);
        }
        if (remotePumping.length > 0) {
          setPumpingSessions(remotePumping);
        }
        if (remoteTimer) {
          setActiveTimer(remoteTimer);
        }
      } catch (err) {
        console.error('Failed initial Supabase sync:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    initRemote();

    // Subscribe to realtime changes from other parent
    const unsubscribe = subscribeToFamilySync(familyId, {
      onNursingChange: (session, eventType) => {
        setNursingSessions((prev) => {
          if (eventType === 'INSERT') return [session, ...prev.filter((s) => s.id !== session.id)];
          if (eventType === 'UPDATE') return prev.map((s) => (s.id === session.id ? session : s));
          if (eventType === 'DELETE') return prev.filter((s) => s.id !== session.id);
          return prev;
        });
      },
      onPumpingChange: (session, eventType) => {
        setPumpingSessions((prev) => {
          if (eventType === 'INSERT') return [session, ...prev.filter((s) => s.id !== session.id)];
          if (eventType === 'UPDATE') return prev.map((s) => (s.id === session.id ? session : s));
          if (eventType === 'DELETE') return prev.filter((s) => s.id !== session.id);
          return prev;
        });
      },
      onTimerChange: (timer) => {
        setActiveTimer(timer);
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [familyId, isSupabaseConfigured]);

  // Sync active timer changes upstream
  const syncTimerUpstream = useCallback((timer: ActiveTimerState) => {
    setActiveTimer(timer);
    if (getSupabase()) {
      upsertRemoteActiveTimer(timer);
    }
  }, []);

  // ---------------- Timer Actions ----------------

  const startSide = useCallback(
    (side: ActiveSide, sessionType: SessionType = activeTab) => {
      triggerHaptic('light');
      const now = new Date().toISOString();

      if (!activeTimer || activeTimer.status === 'idle') {
        const newTimer: ActiveTimerState = {
          family_id: familyId,
          session_type: sessionType,
          status: 'running',
          active_side: side,
          left_duration_seconds: 0,
          right_duration_seconds: 0,
          side_start_time: now,
          session_start_time: now,
          logged_by: loggedBy,
          updated_at: now,
        };
        syncTimerUpstream(newTimer);
        return;
      }

      // If already running on another side, commit previous elapsed
      let left = activeTimer.left_duration_seconds;
      let right = activeTimer.right_duration_seconds;

      if (activeTimer.status === 'running' && activeTimer.side_start_time) {
        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - new Date(activeTimer.side_start_time).getTime()) / 1000)
        );
        if (activeTimer.active_side === 'left') left += elapsed;
        else if (activeTimer.active_side === 'right') right += elapsed;
        else if (activeTimer.active_side === 'both') {
          left += elapsed;
          right += elapsed;
        }
      }

      const updated: ActiveTimerState = {
        ...activeTimer,
        session_type: sessionType,
        status: 'running',
        active_side: side,
        left_duration_seconds: left,
        right_duration_seconds: right,
        side_start_time: now,
        session_start_time: activeTimer.session_start_time || now,
        logged_by: loggedBy,
        updated_at: now,
      };
      syncTimerUpstream(updated);
    },
    [activeTab, activeTimer, familyId, loggedBy, syncTimerUpstream]
  );

  const pauseTimer = useCallback(() => {
    if (!activeTimer || activeTimer.status !== 'running') return;
    triggerHaptic('light');

    let left = activeTimer.left_duration_seconds;
    let right = activeTimer.right_duration_seconds;

    if (activeTimer.side_start_time) {
      const elapsed = Math.max(
        0,
        Math.floor((Date.now() - new Date(activeTimer.side_start_time).getTime()) / 1000)
      );
      if (activeTimer.active_side === 'left') left += elapsed;
      else if (activeTimer.active_side === 'right') right += elapsed;
      else if (activeTimer.active_side === 'both') {
        left += elapsed;
        right += elapsed;
      }
    }

    const updated: ActiveTimerState = {
      ...activeTimer,
      status: 'paused',
      active_side: 'none',
      left_duration_seconds: left,
      right_duration_seconds: right,
      side_start_time: null,
      updated_at: new Date().toISOString(),
    };
    syncTimerUpstream(updated);
  }, [activeTimer, syncTimerUpstream]);

  const switchSide = useCallback(
    (side: 'left' | 'right') => {
      triggerHaptic('switch');
      startSide(side, activeTimer?.session_type || activeTab);
    },
    [activeTab, activeTimer?.session_type, startSide]
  );

  const resetTimer = useCallback(() => {
    triggerHaptic('warning');
    const idleTimer: ActiveTimerState = {
      family_id: familyId,
      session_type: activeTab,
      status: 'idle',
      active_side: 'none',
      left_duration_seconds: 0,
      right_duration_seconds: 0,
      side_start_time: null,
      session_start_time: null,
      logged_by: loggedBy,
      updated_at: new Date().toISOString(),
    };
    syncTimerUpstream(idleTimer);
  }, [activeTab, familyId, loggedBy, syncTimerUpstream]);

  const saveActiveSession = useCallback(
    async (notes?: string, pumpingAmounts?: { left: number; right: number; unit: VolumeUnit }) => {
      if (!activeTimer) return;
      triggerHaptic('success');

      // Finalize accumulated seconds
      let left = activeTimer.left_duration_seconds;
      let right = activeTimer.right_duration_seconds;

      if (activeTimer.status === 'running' && activeTimer.side_start_time) {
        const elapsed = Math.max(
          0,
          Math.floor((Date.now() - new Date(activeTimer.side_start_time).getTime()) / 1000)
        );
        if (activeTimer.active_side === 'left') left += elapsed;
        else if (activeTimer.active_side === 'right') right += elapsed;
        else if (activeTimer.active_side === 'both') {
          left += elapsed;
          right += elapsed;
        }
      }

      const now = new Date().toISOString();
      const startTime = activeTimer.session_start_time || now;
      const lastSide: FeedSide =
        activeTimer.active_side === 'right' ? 'right' : left >= right ? 'left' : 'right';

      if (activeTimer.session_type === 'nursing') {
        const session: NursingSession = {
          id: crypto.randomUUID(),
          family_id: familyId,
          start_time: startTime,
          end_time: now,
          left_duration_seconds: left,
          right_duration_seconds: right,
          last_side: lastSide,
          logged_by: loggedBy,
          notes: notes || '',
          created_at: now,
        };

        setNursingSessions((prev) => [session, ...prev]);
        if (getSupabase()) {
          upsertRemoteNursingSession(session);
        }
      } else {
        const session: PumpingSession = {
          id: crypto.randomUUID(),
          family_id: familyId,
          start_time: startTime,
          end_time: now,
          left_duration_seconds: left,
          right_duration_seconds: right,
          left_amount: pumpingAmounts?.left || 0,
          right_amount: pumpingAmounts?.right || 0,
          unit: pumpingAmounts?.unit || 'oz',
          logged_by: loggedBy,
          notes: notes || '',
          created_at: now,
        };

        setPumpingSessions((prev) => [session, ...prev]);
        if (getSupabase()) {
          upsertRemotePumpingSession(session);
        }
      }

      // Reset timer to idle
      const idleTimer: ActiveTimerState = {
        family_id: familyId,
        session_type: activeTab,
        status: 'idle',
        active_side: 'none',
        left_duration_seconds: 0,
        right_duration_seconds: 0,
        side_start_time: null,
        session_start_time: null,
        logged_by: loggedBy,
        updated_at: now,
      };
      syncTimerUpstream(idleTimer);
    },
    [activeTab, activeTimer, familyId, loggedBy, syncTimerUpstream]
  );

  // ---------------- CRUD operations ----------------

  const addNursingSession = async (data: Omit<NursingSession, 'id' | 'family_id' | 'created_at'>) => {
    const session: NursingSession = {
      ...data,
      id: crypto.randomUUID(),
      family_id: familyId,
      created_at: new Date().toISOString(),
    };
    setNursingSessions((prev) => [session, ...prev]);
    if (getSupabase()) {
      await upsertRemoteNursingSession(session);
    }
  };

  const updateNursingSession = async (session: NursingSession) => {
    setNursingSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
    if (getSupabase()) {
      await upsertRemoteNursingSession(session);
    }
  };

  const deleteNursingSession = async (id: string) => {
    setNursingSessions((prev) => prev.filter((s) => s.id !== id));
    if (getSupabase()) {
      await deleteRemoteNursingSession(id);
    }
  };

  const addPumpingSession = async (data: Omit<PumpingSession, 'id' | 'family_id' | 'created_at'>) => {
    const session: PumpingSession = {
      ...data,
      id: crypto.randomUUID(),
      family_id: familyId,
      created_at: new Date().toISOString(),
    };
    setPumpingSessions((prev) => [session, ...prev]);
    if (getSupabase()) {
      await upsertRemotePumpingSession(session);
    }
  };

  const updatePumpingSession = async (session: PumpingSession) => {
    setPumpingSessions((prev) => prev.map((s) => (s.id === session.id ? session : s)));
    if (getSupabase()) {
      await upsertRemotePumpingSession(session);
    }
  };

  const deletePumpingSession = async (id: string) => {
    setPumpingSessions((prev) => prev.filter((s) => s.id !== id));
    if (getSupabase()) {
      await deleteRemotePumpingSession(id);
    }
  };

  // ---------------- Derived Helpers ----------------

  const lastNursingSession = useMemo(() => {
    if (nursingSessions.length === 0) return null;
    return [...nursingSessions].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )[0];
  }, [nursingSessions]);

  const nextRecommendedSide: FeedSide | null = useMemo(() => {
    if (!lastNursingSession) return 'left';
    return lastNursingSession.last_side === 'left' ? 'right' : 'left';
  }, [lastNursingSession]);

  return (
    <AppContext.Provider
      value={{
        familyId,
        setFamilyId,
        loggedBy,
        setLoggedBy,
        isDarkMode,
        toggleDarkMode,
        activeTab,
        setActiveTab,

        nursingSessions,
        pumpingSessions,
        addNursingSession,
        updateNursingSession,
        deleteNursingSession,
        addPumpingSession,
        updatePumpingSession,
        deletePumpingSession,

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

        lastNursingSession,
        nextRecommendedSide,
        isSupabaseConfigured,
        isSyncing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
