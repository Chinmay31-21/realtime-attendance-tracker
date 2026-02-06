import { useState, useCallback } from "react";
import { Shield, Lock, MapPin, Clock, AlertTriangle, GraduationCap } from "lucide-react";
import { SessionCodeInput } from "@/components/SessionCodeInput";
import { LocationVerifier } from "@/components/LocationVerifier";
import { TimeWindowCheck } from "@/components/TimeWindowCheck";
import { AttendanceForm } from "@/components/AttendanceForm";
import { VerificationStatus } from "@/components/VerificationStatus";

type VerificationState = "pending" | "verifying" | "verified" | "failed";

interface VerificationStep {
  status: VerificationState;
  message?: string;
}

// Demo session code - in production, this would come from the server
const VALID_SESSION_CODE = "TPO123";

const Index = () => {
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [codeVerification, setCodeVerification] = useState<VerificationStep>({ status: "pending" });
  const [locationVerification, setLocationVerification] = useState<VerificationStep>({ status: "pending" });
  const [timeVerification, setTimeVerification] = useState<VerificationStep>({ status: "verified" });
  const [showForm, setShowForm] = useState(false);

  const handleCodeComplete = useCallback((code: string) => {
    setCodeVerification({ status: "verifying" });
    
    // Simulate verification delay
    setTimeout(() => {
      if (code === VALID_SESSION_CODE) {
        setSessionCode(code);
        setCodeVerification({ status: "verified", message: "Valid session code" });
      } else {
        setCodeVerification({ 
          status: "failed", 
          message: "Invalid session code. Please check with your coordinator." 
        });
      }
    }, 1500);
  }, []);

  const handleLocationVerification = useCallback((verified: boolean) => {
    if (verified) {
      setLocationVerification({ status: "verified", message: "Location confirmed" });
      // Check if all verifications are complete
      if (codeVerification.status === "verified" && timeVerification.status === "verified") {
        setTimeout(() => setShowForm(true), 500);
      }
    } else {
      setLocationVerification({ 
        status: "failed", 
        message: "You must be present in the session room" 
      });
    }
  }, [codeVerification.status, timeVerification.status]);

  const handleTimeValid = useCallback((valid: boolean) => {
    setTimeVerification({ 
      status: valid ? "verified" : "failed",
      message: valid ? "Within session time" : "Session time expired"
    });
  }, []);

  const handleAttendanceSubmit = (data: any) => {
    console.log("Attendance submitted:", { ...data, sessionCode });
  };

  const allVerified = 
    codeVerification.status === "verified" && 
    locationVerification.status === "verified" && 
    timeVerification.status === "verified";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="secure-header py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-primary-foreground/10 rounded-xl">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">
                Training & Placement Office
              </h1>
              <p className="text-primary-foreground/80 text-sm">
                Secure Attendance System
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Security Banner */}
      <div className="bg-warning/10 border-b border-warning/20 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 text-warning">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">
            Multi-factor verification required • Location tracking enabled
          </span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Time Check */}
        <div className="mb-6 animate-fade-in">
          <TimeWindowCheck onTimeValid={handleTimeValid} />
        </div>

        {/* Main Card */}
        <div className="secure-card overflow-hidden animate-slide-up">
          {/* Card Header */}
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Session Attendance
                </h2>
                <p className="text-muted-foreground text-sm">
                  Complete all verification steps to mark your attendance
                </p>
              </div>
            </div>

            {/* Verification Status Grid */}
            <div className="grid gap-3">
              <VerificationStatus 
                label="Session Code" 
                status={codeVerification.status}
                message={codeVerification.message}
              />
              <VerificationStatus 
                label="Location" 
                status={locationVerification.status}
                message={locationVerification.message}
              />
              <VerificationStatus 
                label="Time Window" 
                status={timeVerification.status}
                message={timeVerification.message}
              />
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {!showForm ? (
              <div className="space-y-8">
                {/* Step 1: Session Code */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h3 className="font-semibold">Enter Session Code</h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">
                    Enter the 6-character code displayed/announced by the coordinator
                  </p>
                  <div className="ml-8">
                    <SessionCodeInput 
                      onComplete={handleCodeComplete}
                      disabled={codeVerification.status === "verified"}
                    />
                    {codeVerification.status === "failed" && (
                      <p className="text-sm text-destructive text-center mt-3 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {codeVerification.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 2: Location Verification */}
                {codeVerification.status === "verified" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 text-foreground">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <h3 className="font-semibold">Verify Your Location</h3>
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                      You must be physically present in the allocated room
                    </p>
                    <div className="ml-8">
                      <LocationVerifier onVerificationComplete={handleLocationVerification} />
                    </div>
                  </div>
                )}

                {/* Access Denied Message */}
                {(codeVerification.status === "failed" || 
                  locationVerification.status === "failed" || 
                  timeVerification.status === "failed") && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 animate-shake">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-destructive">Access Denied</h4>
                        <p className="text-sm text-destructive/80 mt-1">
                          You cannot mark attendance without completing all verification steps. 
                          If you believe this is an error, contact the coordinator immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-6 text-success">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">All verifications complete</span>
                </div>
                <AttendanceForm 
                  sessionCode={sessionCode!}
                  onSubmit={handleAttendanceSubmit}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Demo Session Code: <code className="font-mono bg-muted px-2 py-0.5 rounded">TPO123</code>
          </p>
          <p className="mt-2">
            This form uses location verification and time-based access control
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
