// Developer Tools & Mock Location Detection Utility
// Detects open DevTools, GPS spoofing indicators, and developer mode

type DevToolsCallback = (isOpen: boolean) => void;

let isDevToolsOpen = false;
let listeners: DevToolsCallback[] = [];

// Method 1: Window size difference detection
function checkWindowSizeDiff(): boolean {
  const widthThreshold = window.outerWidth - window.innerWidth > 160;
  const heightThreshold = window.outerHeight - window.innerHeight > 160;
  return widthThreshold || heightThreshold;
}

// Method 2: Performance-based detection using debugger timing
function checkDebuggerTiming(): Promise<boolean> {
  return new Promise((resolve) => {
    const start = performance.now();
    // Using Function constructor to avoid bundler issues
    try {
      const check = new Function('debugger');
      check();
    } catch {
      // ignore
    }
    const end = performance.now();
    // If debugger statement takes more than 100ms, devtools likely open
    resolve(end - start > 100);
  });
}

// Method 3: Console.log override detection
function checkConsoleOverride(): boolean {
  const element = new Image();
  let devtoolsDetected = false;

  Object.defineProperty(element, 'id', {
    get: function () {
      devtoolsDetected = true;
      return '';
    },
  });

  // This triggers the getter if devtools console is open and inspecting
  console.debug(element);
  return devtoolsDetected;
}

// Method 4: Detect if Geolocation API has been tampered with
export function checkLocationSpoofing(): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check if geolocation has been overridden
  try {
    const geoProto = Object.getOwnPropertyDescriptor(Navigator.prototype, 'geolocation');
    if (!geoProto || geoProto.configurable === true) {
      // Could be overridden
    }
    
    // Check if getCurrentPosition has been monkey-patched
    const originalGetPos = Geolocation.prototype.getCurrentPosition;
    if (originalGetPos.toString().indexOf('native code') === -1) {
      reasons.push('Geolocation API appears to be modified');
    }
  } catch {
    reasons.push('Unable to verify Geolocation API integrity');
  }

  // Check for mock location indicators in user agent
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mock') || ua.includes('fake')) {
    reasons.push('Mock location indicator detected in user agent');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
}

// Validate GPS reading quality to detect spoofing
export function validateGPSReading(coords: GeolocationCoordinates): { 
  isValid: boolean; 
  warnings: string[] 
} {
  const warnings: string[] = [];

  // Spoofed locations often have exactly 0 accuracy or impossibly precise values
  if (coords.accuracy === 0) {
    warnings.push('GPS accuracy is exactly 0 — likely spoofed');
  }

  // Very high accuracy (< 1m) on mobile is suspicious
  if (coords.accuracy < 1) {
    warnings.push('GPS accuracy is suspiciously precise');
  }

  // Check for null altitude on devices that should report it
  // Spoofed locations typically don't include altitude
  if (coords.altitude === null && coords.accuracy < 10) {
    warnings.push('High accuracy but no altitude data — possible spoofing');
  }

  // Speed should be null or 0 for stationary; extremely high speed is suspicious
  if (coords.speed !== null && coords.speed > 100) {
    warnings.push('Unrealistic movement speed detected');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

// Multiple location samples to detect inconsistencies (spoofed locations are often static)
export function collectLocationSamples(
  count: number = 3,
  intervalMs: number = 1000
): Promise<GeolocationPosition[]> {
  return new Promise((resolve, reject) => {
    const samples: GeolocationPosition[] = [];
    let collected = 0;

    const collect = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          samples.push(pos);
          collected++;
          if (collected >= count) {
            resolve(samples);
          } else {
            setTimeout(collect, intervalMs);
          }
        },
        (err) => reject(err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    };

    collect();
  });
}

// Analyze location samples for spoofing patterns
export function analyzeLocationSamples(samples: GeolocationPosition[]): {
  isSuspicious: boolean;
  reason: string;
} {
  if (samples.length < 2) return { isSuspicious: false, reason: '' };

  // Check if all coordinates are EXACTLY the same (real GPS always has micro-variations)
  const allExactlySame = samples.every(
    (s) =>
      s.coords.latitude === samples[0].coords.latitude &&
      s.coords.longitude === samples[0].coords.longitude
  );

  if (allExactlySame) {
    // Check accuracy values too
    const allSameAccuracy = samples.every(
      (s) => s.coords.accuracy === samples[0].coords.accuracy
    );
    if (allSameAccuracy) {
      return {
        isSuspicious: true,
        reason: 'GPS readings are perfectly identical across samples — likely spoofed',
      };
    }
  }

  return { isSuspicious: false, reason: '' };
}

// Main detection loop
export function startDevToolsDetection(callback: DevToolsCallback): () => void {
  listeners.push(callback);

  const intervalId = setInterval(() => {
    const sizeCheck = checkWindowSizeDiff();
    const consoleCheck = checkConsoleOverride();
    
    const newState = sizeCheck || consoleCheck;
    
    if (newState !== isDevToolsOpen) {
      isDevToolsOpen = newState;
      listeners.forEach((cb) => cb(isDevToolsOpen));
    }
  }, 1000);

  // Also listen for keyboard shortcuts commonly used to open devtools
  const keyHandler = (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      isDevToolsOpen = true;
      listeners.forEach((cb) => cb(true));
    }
    // Ctrl+Shift+I / Cmd+Option+I
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      isDevToolsOpen = true;
      listeners.forEach((cb) => cb(true));
    }
    // Ctrl+Shift+J / Cmd+Option+J
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      isDevToolsOpen = true;
      listeners.forEach((cb) => cb(true));
    }
    // Ctrl+U (view source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
    }
  };

  // Disable right-click context menu
  const contextHandler = (e: MouseEvent) => {
    e.preventDefault();
  };

  document.addEventListener('keydown', keyHandler);
  document.addEventListener('contextmenu', contextHandler);

  // Initial check
  const initialCheck = checkWindowSizeDiff() || checkConsoleOverride();
  if (initialCheck) {
    isDevToolsOpen = true;
    callback(true);
  }

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('keydown', keyHandler);
    document.removeEventListener('contextmenu', contextHandler);
    listeners = listeners.filter((cb) => cb !== callback);
  };
}
