// Web Haptics API helper
export function triggerHaptic(type: 'light' | 'switch' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'switch':
        navigator.vibrate([20, 40, 20]);
        break;
      case 'success':
        navigator.vibrate([30, 60, 40]);
        break;
      case 'warning':
        navigator.vibrate([50, 100, 50]);
        break;
    }
  } catch {
    // Ignore devices that block vibrate without user interaction
  }
}
