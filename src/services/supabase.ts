import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { NursingSession, PumpingSession, BottleFeeding, ActiveTimerState } from '../types';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const customUrl = localStorage.getItem('appa_supabase_url') || '';
  const customKey = localStorage.getItem('appa_supabase_anon_key') || '';

  const url = customUrl || envUrl;
  const key = customKey || envKey;

  return { url, key, isConfigured: Boolean(url && key) };
}

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return cachedClient;
}

export function resetSupabaseClient() {
  cachedClient = null;
}

// ----------------- Data API -----------------

export async function fetchRemoteNursingSessions(familyId: string): Promise<NursingSession[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('nursing_sessions')
    .select('*')
    .eq('family_id', familyId)
    .order('start_time', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching nursing sessions:', error);
    return [];
  }
  return (data as NursingSession[]) || [];
}

export async function upsertRemoteNursingSession(session: NursingSession): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('nursing_sessions').upsert(session);
  if (error) {
    console.error('Error saving nursing session:', error);
    return false;
  }
  return true;
}

export async function deleteRemoteNursingSession(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('nursing_sessions').delete().eq('id', id);
  if (error) {
    console.error('Error deleting nursing session:', error);
    return false;
  }
  return true;
}

export async function fetchRemotePumpingSessions(familyId: string): Promise<PumpingSession[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('pumping_sessions')
    .select('*')
    .eq('family_id', familyId)
    .order('start_time', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching pumping sessions:', error);
    return [];
  }
  return (data as PumpingSession[]) || [];
}

export async function upsertRemotePumpingSession(session: PumpingSession): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('pumping_sessions').upsert(session);
  if (error) {
    console.error('Error saving pumping session:', error);
    return false;
  }
  return true;
}

export async function deleteRemotePumpingSession(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('pumping_sessions').delete().eq('id', id);
  if (error) {
    console.error('Error deleting pumping session:', error);
    return false;
  }
  return true;
}

// ----------------- Bottle Feedings API -----------------

export async function fetchRemoteBottleFeedings(familyId: string): Promise<BottleFeeding[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('bottle_feedings')
    .select('*')
    .eq('family_id', familyId)
    .order('start_time', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching bottle feedings:', error);
    return [];
  }
  return (data as BottleFeeding[]) || [];
}

export async function upsertRemoteBottleFeeding(feeding: BottleFeeding): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('bottle_feedings').upsert(feeding);
  if (error) {
    console.error('Error saving bottle feeding:', error);
    return false;
  }
  return true;
}

export async function deleteRemoteBottleFeeding(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('bottle_feedings').delete().eq('id', id);
  if (error) {
    console.error('Error deleting bottle feeding:', error);
    return false;
  }
  return true;
}

// ----------------- Active Timer API -----------------

export async function fetchRemoteActiveTimer(familyId: string): Promise<ActiveTimerState | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('active_timers')
    .select('*')
    .eq('family_id', familyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active timer:', error);
    return null;
  }
  return data as ActiveTimerState | null;
}

export async function upsertRemoteActiveTimer(timer: ActiveTimerState): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('active_timers').upsert(timer);
  if (error) {
    console.error('Error saving active timer:', error);
    return false;
  }
  return true;
}

// Realtime multi-device subscription
export function subscribeToFamilySync(
  familyId: string,
  callbacks: {
    onNursingChange: (session: NursingSession, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onPumpingChange: (session: PumpingSession, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onBottleChange: (feeding: BottleFeeding, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onTimerChange: (timer: ActiveTimerState) => void;
  }
) {
  const client = getSupabase();
  if (!client) return () => {};

  const channel = client
    .channel(`family_${familyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'nursing_sessions',
        filter: `family_id=eq.${familyId}`,
      },
      (payload) => {
        const item = (payload.new && Object.keys(payload.new).length > 0
          ? payload.new
          : payload.old) as NursingSession;
        callbacks.onNursingChange(item, payload.eventType as any);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pumping_sessions',
        filter: `family_id=eq.${familyId}`,
      },
      (payload) => {
        const item = (payload.new && Object.keys(payload.new).length > 0
          ? payload.new
          : payload.old) as PumpingSession;
        callbacks.onPumpingChange(item, payload.eventType as any);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bottle_feedings',
        filter: `family_id=eq.${familyId}`,
      },
      (payload) => {
        const item = (payload.new && Object.keys(payload.new).length > 0
          ? payload.new
          : payload.old) as BottleFeeding;
        callbacks.onBottleChange(item, payload.eventType as any);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'active_timers',
        filter: `family_id=eq.${familyId}`,
      },
      (payload) => {
        if (payload.new) {
          callbacks.onTimerChange(payload.new as ActiveTimerState);
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
