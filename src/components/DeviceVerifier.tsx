import { useEffect, useState } from "react";
import { Smartphone, Loader2, CheckCircle2, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  generateDeviceFingerprint, 
  getStoredFingerprint, 
  storeFingerprint,
  getShortFingerprint 
} from "@/lib/deviceFingerprint";

interface DeviceVerifierProps {
  onVerificationComplete: (verified: boolean, fingerprint?: string) => void;
}

export function DeviceVerifier({ onVerificationComplete }: DeviceVerifierProps) {
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "failed">("idle");
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyDevice = async () => {
    setStatus("verifying");
    setError(null);

    try {
      const currentFingerprint = await generateDeviceFingerprint();
      const storedFingerprint = await getStoredFingerprint();

      // Simulate verification delay for UX
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (!storedFingerprint) {
        // First time - store the fingerprint
        await storeFingerprint(currentFingerprint);
        setFingerprint(currentFingerprint);
        setStatus("verified");
        onVerificationComplete(true, currentFingerprint);
      } else if (currentFingerprint === storedFingerprint) {
        // Same device - verified
        setFingerprint(currentFingerprint);
        setStatus("verified");
        onVerificationComplete(true, currentFingerprint);
      } else {
        // Different device detected - could be suspicious
        setStatus("failed");
        setError("Device mismatch detected. This may indicate session sharing.");
        onVerificationComplete(false);
      }
    } catch (err) {
      setStatus("failed");
      setError("Unable to verify device. Please try again.");
      onVerificationComplete(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            status === "verified" ? "bg-success/10" : 
            status === "failed" ? "bg-destructive/10" : 
            "bg-primary/10"
          }`}>
            <Smartphone className={`w-5 h-5 ${
              status === "verified" ? "text-success" : 
              status === "failed" ? "text-destructive" : 
              "text-primary"
            }`} />
          </div>
          <div>
            <p className="font-medium text-foreground">Device Verification</p>
            <p className="text-sm text-muted-foreground">
              {status === "idle" && "Click to verify your device"}
              {status === "verifying" && "Generating device fingerprint..."}
              {status === "verified" && "Device verified successfully"}
              {status === "failed" && "Device verification failed"}
            </p>
          </div>
        </div>

        {status === "idle" && (
          <Button onClick={verifyDevice} variant="outline" size="sm">
            Verify
          </Button>
        )}

        {status === "verifying" && (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        )}

        {status === "verified" && (
          <CheckCircle2 className="w-6 h-6 text-success" />
        )}

        {status === "failed" && (
          <Button onClick={verifyDevice} variant="outline" size="sm">
            Retry
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {fingerprint && status === "verified" && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span className="font-mono">Device ID: {getShortFingerprint(fingerprint)}</span>
        </div>
      )}
    </div>
  );
}
