import { useState } from "react";
import { Wifi, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NetworkTokenInputProps {
  onVerificationComplete: (verified: boolean, token?: string) => void;
  disabled?: boolean;
}

// Demo network token - in production, this would be validated against a backend
const VALID_NETWORK_TOKEN = "WIFI2024";

export function NetworkTokenInput({ onVerificationComplete, disabled }: NetworkTokenInputProps) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);

  const verifyToken = () => {
    if (!token.trim()) {
      setError("Please enter the network token");
      return;
    }

    setStatus("verifying");
    setError(null);

    // Simulate network verification
    setTimeout(() => {
      if (token.toUpperCase() === VALID_NETWORK_TOKEN) {
        setStatus("verified");
        onVerificationComplete(true, token);
      } else {
        setStatus("failed");
        setError("Invalid network token. Get it from the admin display.");
        onVerificationComplete(false);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && status !== "verifying") {
      verifyToken();
    }
  };

  if (disabled || status === "verified") {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-success/10 border border-success/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-success/20">
            <Wifi className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="font-medium text-foreground">Network Verified</p>
            <p className="text-sm text-muted-foreground">Connected to authorized network</p>
          </div>
        </div>
        <CheckCircle2 className="w-6 h-6 text-success" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            status === "failed" ? "bg-destructive/10" : "bg-primary/10"
          }`}>
            <Wifi className={`w-5 h-5 ${
              status === "failed" ? "text-destructive" : "text-primary"
            }`} />
          </div>
          <div>
            <p className="font-medium text-foreground">Network Token</p>
            <p className="text-sm text-muted-foreground">Enter the token shown on admin display</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={token}
          onChange={(e) => {
            setToken(e.target.value.toUpperCase());
            if (status === "failed") setStatus("idle");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter network token"
          className="font-mono uppercase tracking-wider"
          disabled={status === "verifying"}
        />
        <Button 
          onClick={verifyToken} 
          disabled={status === "verifying" || !token.trim()}
          variant="outline"
        >
          {status === "verifying" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Verify"
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Token is displayed on the room's admin screen
      </p>
    </div>
  );
}
