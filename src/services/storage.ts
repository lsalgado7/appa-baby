import type { NursingSession, PumpingSession, ActiveTimerState } from '../types';

const NURSING_KEY = 'appa_nursing_sessions';
const PUMPING_KEY = 'appa_pumping_sessions';
const FAMILY_KEY = 'appa_family_id';
const LOGGED_BY_KEY = 'appa_logged_by';
const ACTIVE_TIMER_KEY = 'appa_active_timer';

export function getStoredFamilyId(): string {
  // Check URL query param first: ?family=appa-123
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlFamily = params.get('family');
    if (urlFamily) {
      localStorage.setItem(FAMILY_KEY, urlFamily);
      return urlFamily;
    }
  }

  let familyId = localStorage.getItem(FAMILY_KEY);
  if (!familyId) {
    const randomDigits = Math.floor(100 + Math.random() * 900);
    familyId = `appa-${randomDigits}`;
    localStorage.setItem(FAMILY_KEY, familyId);
  }
  return familyId;
}

export function setStoredFamilyId(familyId: string): void {
  localStorage.setItem(FAMILY_KEY, familyId);
}

export function getStoredLoggedBy(): string {
  return localStorage.getItem(LOGGED_BY_KEY) || 'Mom';
}

export function setStoredLoggedBy(name: string): void {
  localStorage.setItem(LOGGED_BY_KEY, name);
}

// Local Nursing Sessions
export function getLocalNursingSessions(): NursingSession[] {
  try {
    const data = localStorage.getItem(NURSING_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalNursingSessions(sessions: NursingSession[]): void {
  localStorage.setItem(NURSING_KEY, JSON.stringify(sessions));
}

// Local Pumping Sessions
export function getLocalPumpingSessions(): PumpingSession[] {
  try {
    const data = localStorage.getItem(PUMPING_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLocalPumpingSessions(sessions: PumpingSession[]): void {
  localStorage.setItem(PUMPING_KEY, JSON.stringify(sessions));
}

// Local Active Timer Backup
export function getLocalActiveTimer(): ActiveTimerState | null {
  try {
    const data = localStorage.getItem(ACTIVE_TIMER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveLocalActiveTimer(timer: ActiveTimerState | null): void {
  if (timer) {
    localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timer));
  } else {
    localStorage.removeItem(ACTIVE_TIMER_KEY);
  }
}
