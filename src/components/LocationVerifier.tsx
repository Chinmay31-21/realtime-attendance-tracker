import { useEffect, useState, useCallback } from "react";
import { MapPin, Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateGPSReading, collectLocationSamples, analyzeLocationSamples, checkLocationSpoofing } from "@/lib/devToolsDetector";

interface LocationVerifierProps {
  onVerificationComplete: (verified: boolean, coords?: GeolocationCoordinates) => void;
  targetLocation?: { lat: number; lng: number; radiusMeters: number };
}

export function LocationVerifier({ onVerificationComplete, targetLocation }: LocationVerifierProps) {
  const [status, setStatus] = useState<"idle" | "requesting" | "verifying" | "verified" | "failed" | "spoofed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [spoofWarnings, setSpoofWarnings] = useState<string[]>([]);
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const verifyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setStatus("failed");
      setError("Geolocation is not supported by your browser");
      onVerificationComplete(false);
      return;
    }

    setStatus("requesting");
    setError(null);
    setSpoofWarnings([]);

    // Step 1: Check for API-level tampering
    const spoofCheck = checkLocationSpoofing();
    if (spoofCheck.isSuspicious) {
      setStatus("spoofed");
      setSpoofWarnings(spoofCheck.reasons);
      setError("Location spoofing detected. Disable mock location apps and developer mode.");
      onVerificationComplete(false);
      return;
    }

    try {
      // Step 2: Collect multiple GPS samples to detect spoofing
      setStatus("verifying");
      const samples = await collectLocationSamples(3, 800);
      
      // Step 3: Analyze samples for spoofing patterns
      const analysis = analyzeLocationSamples(samples);
      if (analysis.isSuspicious) {
        setStatus("spoofed");
        setSpoofWarnings([analysis.reason]);
        setError("GPS spoofing detected. Your location readings are artificially static. Disable any mock location apps.");
        onVerificationComplete(false);
        return;
      }

      const position = samples[samples.length - 1];
      
      // Step 4: Validate GPS reading quality
      const gpsValidation = validateGPSReading(position.coords);
      if (!gpsValidation.isValid) {
        setSpoofWarnings(gpsValidation.warnings);
      }

      setCoords(position.coords);

      // If no target location, just verify we can get location
      if (!targetLocation) {
        setStatus("verified");
        onVerificationComplete(true, position.coords);
        return;
      }

      // Step 5: Calculate distance from target
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        targetLocation.lat,
        targetLocation.lng
      );

      if (distance <= targetLocation.radiusMeters) {
        if (gpsValidation.warnings.length > 0) {
          // Allow but flag warnings
          setSpoofWarnings(gpsValidation.warnings);
        }
        setStatus("verified");
        onVerificationComplete(true, position.coords);
      } else {
        setStatus("failed");
        setError(`You are ${Math.round(distance)}m away from SPIT Campus. You must be within ${targetLocation.radiusMeters}m to mark attendance.`);
        onVerificationComplete(false);
      }
    } catch (err: any) {
      if (err.code === 1) {
        setStatus("failed");
        setError("Location access denied. You must enable location to mark attendance.");
      } else if (err.code === 2) {
        setStatus("failed");
        setError("Location information unavailable. Please try again.");
      } else if (err.code === 3) {
        setStatus("failed");
        setError("Location request timed out. Please try again.");
      } else {
        setStatus("failed");
        setError("Unable to verify your location.");
      }
      onVerificationComplete(false);
    }
  }, [onVerificationComplete, targetLocation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            status === "verified" ? "bg-success/10" : 
            status === "failed" || status === "spoofed" ? "bg-destructive/10" : 
            "bg-primary/10"
          }`}>
            {status === "spoofed" ? (
              <ShieldAlert className="w-5 h-5 text-destructive" />
            ) : (
              <MapPin className={`w-5 h-5 ${
                status === "verified" ? "text-success" : 
                status === "failed" ? "text-destructive" : 
                "text-primary"
              }`} />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">Location Verification</p>
            <p className="text-sm text-muted-foreground">
              {status === "idle" && (targetLocation 
                ? `Must be within ${targetLocation.radiusMeters}m of SPIT Campus` 
                : "Click to verify your location")}
              {status === "requesting" && "Requesting location access..."}
              {status === "verifying" && "Collecting GPS samples & anti-spoof check..."}
              {status === "verified" && "You are within SPIT Campus"}
              {status === "failed" && "Location verification failed"}
              {status === "spoofed" && "⚠️ GPS Spoofing Detected"}
            </p>
          </div>
        </div>

        {status === "idle" && (
          <Button onClick={verifyLocation} variant="outline" size="sm">
            Verify
          </Button>
        )}

        {(status === "requesting" || status === "verifying") && (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        )}

        {status === "verified" && (
          <CheckCircle2 className="w-6 h-6 text-success" />
        )}

        {(status === "failed" || status === "spoofed") && (
          <Button onClick={verifyLocation} variant="outline" size="sm">
            Retry
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-shake">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {spoofWarnings.length > 0 && status === "verified" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">GPS quality warnings:</p>
            <ul className="list-disc list-inside text-xs mt-1">
              {spoofWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      {coords && status === "verified" && (
        <p className="text-xs text-muted-foreground text-center font-mono">
          Coordinates: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
