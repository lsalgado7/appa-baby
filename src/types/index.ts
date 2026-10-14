export type FeedSide = 'left' | 'right';
export type ActiveSide = 'left' | 'right' | 'both' | 'none';
export type TimerStatus = 'idle' | 'running' | 'paused';
export type VolumeUnit = 'oz' | 'ml';
export type SessionType = 'nursing' | 'pumping' | 'bottle';
export type MilkType = 'breast_milk' | 'formula' | 'mixed';

export interface NursingSession {
  id: string;
  family_id: string;
  start_time: string; // ISO
  end_time: string;   // ISO
  left_duration_seconds: number;
  right_duration_seconds: number;
  last_side: FeedSide;
  logged_by: string;
  notes?: string;
  created_at: string;
}

export interface PumpingSession {
  id: string;
  family_id: string;
  start_time: string; // ISO
  end_time: string;   // ISO
  left_duration_seconds: number;
  right_duration_seconds: number;
  left_amount: number;
  right_amount: number;
  unit: VolumeUnit;
  logged_by: string;
  notes?: string;
  created_at: string;
}

export interface BottleFeeding {
  id: string;
  family_id: string;
  start_time: string; // ISO
  end_time?: string;  // ISO
  duration_seconds: number;
  amount: number;
  unit: VolumeUnit;
  milk_type: MilkType;
  logged_by: string;
  notes?: string;
  created_at: string;
}

export interface ActiveTimerState {
  family_id: string;
  session_type: SessionType;
  status: TimerStatus;
  active_side: ActiveSide;
  left_duration_seconds: number;
  right_duration_seconds: number;
  side_start_time: string | null;     // ISO timestamp when current side started running
  session_start_time: string | null;  // ISO timestamp when session began
  logged_by: string;
  updated_at: string;
}

export type TimelineItem = 
  | ({ type: 'nursing' } & NursingSession)
  | ({ type: 'pumping' } & PumpingSession)
  | ({ type: 'bottle' } & BottleFeeding);
