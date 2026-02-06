import { useState, useCallback, useEffect } from "react";
import { Shield, MapPin, Clock, Smartphone, Cpu, Wifi, AlertCircle } from "lucide-react";
import { SessionCodeInput } from "@/components/SessionCodeInput";
import { LocationVerifier } from "@/components/LocationVerifier";
import { DeviceVerifier } from "@/components/DeviceVerifier";
import { NetworkTokenInput } from "@/components/NetworkTokenInput";
import { TimeWindowCheck } from "@/components/TimeWindowCheck";
import { AttendanceForm } from "@/components/AttendanceForm";
import { hasSubmitted, recordSubmission } from "@/lib/submissionTracker";

// Demo session code and network token
const VALID_SESSION_CODE = "TPO123";

type StepStatus = "pending" | "verifying" | "verified" | "failed";

const Index = () => {
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<StepStatus>("pending");
  const [networkStatus, setNetworkStatus] = useState<StepStatus>("pending");
  const [locationStatus, setLocationStatus] = useState<StepStatus>("pending");
  const [deviceStatus, setDeviceStatus] = useState<StepStatus>("pending");
  const [timeValid, setTimeValid] = useState(true);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [networkToken, setNetworkToken] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const handleCodeComplete = useCallback((code: string) => {
    setCodeStatus("verifying");
    setTimeout(() => {
      if (code === VALID_SESSION_CODE) {
        setSessionCode(code);
        setCodeStatus("verified");
      } else {
        setCodeStatus("failed");
      }
    }, 1500);
  }, []);

  const handleLocationVerification = useCallback((verified: boolean) => {
    setLocationStatus(verified ? "verified" : "failed");
  }, []);

  const handleNetworkVerification = useCallback((verified: boolean, token?: string) => {
    setNetworkStatus(verified ? "verified" : "failed");
    if (token) setNetworkToken(token);
  }, []);

  const handleDeviceVerification = useCallback((verified: boolean, fingerprint?: string) => {
    setDeviceStatus(verified ? "verified" : "failed");
    if (fingerprint) {
      setDeviceFingerprint(fingerprint);
      // Check if already submitted
      if (sessionCode && hasSubmitted(sessionCode, fingerprint)) {
        setAlreadySubmitted(true);
      }
    }
  }, [sessionCode]);

  const allVerified = 
    codeStatus === "verified" && 
    networkStatus === "verified" &&
    locationStatus === "verified" && 
    deviceStatus === "verified" && 
    timeValid;

  // Show form when all verified and not already submitted
  useEffect(() => {
    if (allVerified && !showForm && !alreadySubmitted) {
      const timer = setTimeout(() => setShowForm(true), 500);
      return () => clearTimeout(timer);
    }
  }, [allVerified, showForm, alreadySubmitted]);

  const handleAttendanceSubmit = (data: any) => {
    if (sessionCode && deviceFingerprint) {
      recordSubmission(sessionCode, deviceFingerprint, data.studentId || "unknown");
    }
    console.log("Attendance submitted:", { ...data, sessionCode, deviceFingerprint, networkToken });
  };

  const StatusBadge = ({ status, label }: { status: StepStatus; label: string }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
      status === "verified" 
        ? "bg-success/15 text-success" 
        : status === "failed" 
        ? "bg-destructive/15 text-destructive" 
        : "bg-muted text-muted-foreground"
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        status === "verified" 
          ? "bg-success" 
          : status === "failed" 
          ? "bg-destructive" 
          : "bg-muted-foreground"
      }`} />
      {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-primary to-accent py-6 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Cpu className="w-6 h-6 text-primary-foreground" />
            <span className="text-xl font-bold text-primary-foreground">TPO Attendance</span>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Secure • Verified • Real-time
          </p>
        </div>
      </header>

      {/* Status Bar */}
      <div className="bg-card border-b border-border py-3 px-4">
        <div className="max-w-xl mx-auto flex flex-wrap items-center justify-center gap-2">
          <StatusBadge status={codeStatus} label="Code" />
          <StatusBadge status={networkStatus} label="Network" />
          <StatusBadge status={locationStatus} label="Location" />
          <StatusBadge status={deviceStatus} label="Device" />
          <StatusBadge status={timeValid ? "verified" : "failed"} label="Time" />
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-6">
        {/* Time Check */}
        <div className="mb-6">
          <TimeWindowCheck onTimeValid={setTimeValid} />
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Mark Attendance</h2>
                <p className="text-sm text-muted-foreground">Complete all verification steps</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {alreadySubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10">
                  <AlertCircle className="w-8 h-8 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Already Submitted</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have already recorded your attendance for this session.
                  </p>
                </div>
              </div>
            ) : !showForm ? (
              <>
                {/* Step 1: Session Code */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                    <span className="font-medium text-sm">Enter Session Code</span>
                  </div>
                  <SessionCodeInput 
                    onComplete={handleCodeComplete}
                    disabled={codeStatus === "verified"}
                  />
                  {codeStatus === "failed" && (
                    <p className="text-xs text-destructive text-center">Invalid code. Check with coordinator.</p>
                  )}
                </div>

                {/* Step 2: Network Token */}
                {codeStatus === "verified" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                      <span className="font-medium text-sm">Verify Network</span>
                    </div>
                    <NetworkTokenInput 
                      onVerificationComplete={handleNetworkVerification}
                      disabled={networkStatus === "verified"}
                    />
                  </div>
                )}

                {/* Step 3: Location */}
                {networkStatus === "verified" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                      <span className="font-medium text-sm">Verify Location</span>
                    </div>
                    <LocationVerifier onVerificationComplete={handleLocationVerification} />
                  </div>
                )}

                {/* Step 4: Device */}
                {locationStatus === "verified" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                      <span className="font-medium text-sm">Verify Device</span>
                    </div>
                    <DeviceVerifier onVerificationComplete={handleDeviceVerification} />
                  </div>
                )}
              </>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-success/10 text-success">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">All verifications complete</span>
                </div>
                <AttendanceForm 
                  sessionCode={sessionCode!}
                  onSubmit={handleAttendanceSubmit}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-2">
              <Shield className="w-3 h-3" />
              Demo Code: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">TPO123</code>
            </p>
            <p className="flex items-center justify-center gap-2">
              <Wifi className="w-3 h-3" />
              Network Token: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">WIFI2024</code>
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Network</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS</span>
            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Device</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
