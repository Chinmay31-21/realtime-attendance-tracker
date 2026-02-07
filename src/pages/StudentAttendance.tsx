import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, MapPin, Clock, Smartphone, Cpu, Wifi, AlertCircle, CheckCircle2 } from "lucide-react";
import { SecureCodeInput } from "@/components/SecureCodeInput";
import { LocationVerifier } from "@/components/LocationVerifier";
import { DeviceVerifier } from "@/components/DeviceVerifier";
import { TimeWindowCheck } from "@/components/TimeWindowCheck";
import { StudentForm } from "@/components/StudentForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type StepStatus = "pending" | "verifying" | "verified" | "failed";

interface SessionData {
  id: string;
  session_name: string;
  network_token: string;
  expires_at: string;
}

const StudentAttendance = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [codeStatus, setCodeStatus] = useState<StepStatus>("pending");
  const [networkStatus, setNetworkStatus] = useState<StepStatus>("pending");
  const [locationStatus, setLocationStatus] = useState<StepStatus>("pending");
  const [deviceStatus, setDeviceStatus] = useState<StepStatus>("pending");
  const [timeValid, setTimeValid] = useState(true);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Verify session code against database
  const handleSessionCodeComplete = useCallback(async (code: string) => {
    setCodeStatus("verifying");
    
    try {
      const { data, error } = await supabase
        .from('tpo_sessions')
        .select('id, session_name, network_token, expires_at')
        .eq('session_code', code.toUpperCase())
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSessionData(data);
        setCodeStatus("verified");
      } else {
        setCodeStatus("failed");
        toast.error("Invalid or expired session code");
      }
    } catch (error: any) {
      setCodeStatus("failed");
      toast.error("Verification failed");
    }
  }, []);

  // Verify network token
  const handleNetworkTokenComplete = useCallback((token: string) => {
    if (!sessionData) return;
    
    setNetworkStatus("verifying");
    
    setTimeout(() => {
      if (token.toUpperCase() === sessionData.network_token) {
        setNetworkStatus("verified");
      } else {
        setNetworkStatus("failed");
        toast.error("Invalid network token");
      }
    }, 500);
  }, [sessionData]);

  const handleLocationVerification = useCallback((verified: boolean, coords?: GeolocationCoordinates) => {
    setLocationStatus(verified ? "verified" : "failed");
    if (verified && coords) {
      setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
    }
  }, []);

  const handleDeviceVerification = useCallback(async (verified: boolean, fingerprint?: string) => {
    setDeviceStatus(verified ? "verified" : "failed");
    if (fingerprint) {
      setDeviceFingerprint(fingerprint);
      
      // Check if already submitted for this session
      if (sessionData) {
        const { data } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('session_id', sessionData.id)
          .eq('device_fingerprint', fingerprint)
          .maybeSingle();
        
        if (data) {
          setAlreadySubmitted(true);
        }
      }
    }
  }, [sessionData]);

  const allVerified = 
    codeStatus === "verified" && 
    networkStatus === "verified" &&
    locationStatus === "verified" && 
    deviceStatus === "verified" && 
    timeValid;

  // Show form when all verified
  useEffect(() => {
    if (allVerified && !showForm && !alreadySubmitted) {
      const timer = setTimeout(() => setShowForm(true), 500);
      return () => clearTimeout(timer);
    }
  }, [allVerified, showForm, alreadySubmitted]);

  const handleAttendanceSubmit = () => {
    console.log("Attendance recorded");
  };

  const StatusBadge = ({ status, label }: { status: StepStatus; label: string }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
      status === "verified" 
        ? "bg-success/15 text-success" 
        : status === "failed" 
        ? "bg-destructive/15 text-destructive" 
        : status === "verifying"
        ? "bg-warning/15 text-warning"
        : "bg-muted text-muted-foreground"
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        status === "verified" 
          ? "bg-success" 
          : status === "failed" 
          ? "bg-destructive" 
          : status === "verifying"
          ? "bg-warning animate-pulse"
          : "bg-muted-foreground"
      }`} />
      {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-background no-select">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-primary to-accent py-4 sm:py-6 px-3 sm:px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-1 sm:mb-2">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            <span className="text-lg sm:text-xl font-bold text-primary-foreground">TPO Attendance</span>
          </div>
          <p className="text-primary-foreground/80 text-xs sm:text-sm">
            Secure • Verified • Real-time
          </p>
        </div>
      </header>

      {/* Status Bar */}
      <div className="bg-card border-b border-border py-2 sm:py-3 px-2 sm:px-4">
        <div className="max-w-xl mx-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <StatusBadge status={codeStatus} label="Session" />
          <StatusBadge status={networkStatus} label="Network" />
          <StatusBadge status={locationStatus} label="Location" />
          <StatusBadge status={deviceStatus} label="Device" />
          <StatusBadge status={timeValid ? "verified" : "failed"} label="Time" />
        </div>
      </div>

      <main className="max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Time Check */}
        <div className="mb-6">
          <TimeWindowCheck onTimeValid={setTimeValid} />
        </div>

        {/* Main Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-primary/10 rounded-lg">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Mark Attendance</h2>
                <p className="text-sm text-muted-foreground">Complete all verification steps</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      codeStatus === "verified" ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                    }`}>
                      {codeStatus === "verified" ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                    </div>
                    <span className="font-medium text-sm">Enter Session Code</span>
                  </div>
                  <SecureCodeInput 
                    length={8}
                    onComplete={handleSessionCodeComplete}
                    disabled={codeStatus === "verified" || codeStatus === "verifying"}
                    label="8-character code from coordinator"
                  />
                  {codeStatus === "failed" && (
                    <p className="text-xs text-destructive text-center">Invalid or expired code</p>
                  )}
                </div>

                {/* Step 2: Network Token */}
                {codeStatus === "verified" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        networkStatus === "verified" ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                      }`}>
                        {networkStatus === "verified" ? <CheckCircle2 className="w-4 h-4" /> : "2"}
                      </div>
                      <span className="font-medium text-sm">Enter Network Token</span>
                    </div>
                    <SecureCodeInput 
                      length={8}
                      onComplete={handleNetworkTokenComplete}
                      disabled={networkStatus === "verified" || networkStatus === "verifying"}
                      label="Token displayed in the room"
                    />
                    {networkStatus === "failed" && (
                      <p className="text-xs text-destructive text-center">Invalid network token</p>
                    )}
                  </div>
                )}

                {/* Step 3: Location */}
                {networkStatus === "verified" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        locationStatus === "verified" ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                      }`}>
                        {locationStatus === "verified" ? <CheckCircle2 className="w-4 h-4" /> : "3"}
                      </div>
                      <span className="font-medium text-sm">Verify Location</span>
                    </div>
                    <LocationVerifier 
                      onVerificationComplete={handleLocationVerification}
                    />
                  </div>
                )}

                {/* Step 4: Device */}
                {locationStatus === "verified" && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        deviceStatus === "verified" ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
                      }`}>
                        {deviceStatus === "verified" ? <CheckCircle2 className="w-4 h-4" /> : "4"}
                      </div>
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
                <StudentForm 
                  sessionId={sessionData!.id}
                  deviceFingerprint={deviceFingerprint!}
                  userLocation={userLocation}
                  onSubmit={handleAttendanceSubmit}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 text-center space-y-2 pb-4">
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Network</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> GPS</span>
            <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Device</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time</span>
          </div>
          <p className="text-xs text-muted-foreground px-4">
            Codes auto-blur for screenshot protection
          </p>
          <Link to="/admin" className="inline-block text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline py-2">
            Admin Login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default StudentAttendance;
