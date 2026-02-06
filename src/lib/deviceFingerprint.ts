// Device fingerprinting utility to generate unique device identifiers
// This helps prevent students from sharing session codes with others

interface FingerprintData {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookiesEnabled: boolean;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  touchSupport: boolean;
  webglVendor?: string;
  webglRenderer?: string;
  canvasHash?: string;
}

async function generateCanvasHash(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    canvas.width = 200;
    canvas.height = 50;
    
    // Draw some text and shapes to create a unique pattern
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('TPO Attendance', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('TPO Attendance', 4, 17);
    
    return canvas.toDataURL().slice(-50);
  } catch {
    return 'canvas-error';
  }
}

function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor: 'no-webgl', renderer: 'no-webgl' };
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'unknown', renderer: 'unknown' };
    
    return {
      vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
      renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown'
    };
  } catch {
    return { vendor: 'error', renderer: 'error' };
  }
}

async function collectFingerprintData(): Promise<FingerprintData> {
  const webglInfo = getWebGLInfo();
  const canvasHash = await generateCanvasHash();
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}x${screen.availWidth}x${screen.availHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookiesEnabled: navigator.cookieEnabled,
    colorDepth: screen.colorDepth,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    webglVendor: webglInfo.vendor,
    webglRenderer: webglInfo.renderer,
    canvasHash
  };
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateDeviceFingerprint(): Promise<string> {
  const data = await collectFingerprintData();
  const fingerprintString = JSON.stringify(data);
  return hashString(fingerprintString);
}

export async function getStoredFingerprint(): Promise<string | null> {
  return localStorage.getItem('device_fingerprint');
}

export async function storeFingerprint(fingerprint: string): Promise<void> {
  localStorage.setItem('device_fingerprint', fingerprint);
}

export async function verifyDeviceConsistency(): Promise<{
  isConsistent: boolean;
  currentFingerprint: string;
  storedFingerprint: string | null;
}> {
  const currentFingerprint = await generateDeviceFingerprint();
  const storedFingerprint = await getStoredFingerprint();
  
  if (!storedFingerprint) {
    await storeFingerprint(currentFingerprint);
    return { isConsistent: true, currentFingerprint, storedFingerprint: null };
  }
  
  // Allow some tolerance - fingerprints might differ slightly
  const isConsistent = currentFingerprint === storedFingerprint;
  
  return { isConsistent, currentFingerprint, storedFingerprint };
}

export function getShortFingerprint(fingerprint: string): string {
  return fingerprint.slice(0, 8).toUpperCase();
}
