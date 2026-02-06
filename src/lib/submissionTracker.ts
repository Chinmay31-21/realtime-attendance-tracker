// Track submissions to prevent duplicate entries
// Uses localStorage + device fingerprint to ensure one submission per device per session

const SUBMISSION_KEY = "tpo_submissions";

interface SubmissionRecord {
  sessionCode: string;
  deviceFingerprint: string;
  timestamp: number;
  studentId: string;
}

export function getSubmissions(): SubmissionRecord[] {
  try {
    const data = localStorage.getItem(SUBMISSION_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function hasSubmitted(sessionCode: string, deviceFingerprint: string): boolean {
  const submissions = getSubmissions();
  return submissions.some(
    (s) => s.sessionCode === sessionCode && s.deviceFingerprint === deviceFingerprint
  );
}

export function recordSubmission(
  sessionCode: string,
  deviceFingerprint: string,
  studentId: string
): void {
  const submissions = getSubmissions();
  submissions.push({
    sessionCode,
    deviceFingerprint,
    timestamp: Date.now(),
    studentId,
  });
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submissions));
}

export function getSubmissionForSession(
  sessionCode: string,
  deviceFingerprint: string
): SubmissionRecord | null {
  const submissions = getSubmissions();
  return (
    submissions.find(
      (s) => s.sessionCode === sessionCode && s.deviceFingerprint === deviceFingerprint
    ) || null
  );
}

export function clearSubmissions(): void {
  localStorage.removeItem(SUBMISSION_KEY);
}
