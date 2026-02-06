import { useEffect, useState, useCallback } from "react";
import { MapPin, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationVerifierProps {
  onVerificationComplete: (verified: boolean, coords?: GeolocationCoordinates) => void;
  targetLocation?: { lat: number; lng: number; radiusMeters: number };
}

export function LocationVerifier({ onVerificationComplete, targetLocation }: LocationVerifierProps) {
  const [status, setStatus] = useState<"idle" | "requesting" | "verifying" | "verified" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
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

  const verifyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("failed");
      setError("Geolocation is not supported by your browser");
      onVerificationComplete(false);
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords);
        setStatus("verifying");

        // If no target location is set, we just verify that we can get location
        if (!targetLocation) {
          setTimeout(() => {
            setStatus("verified");
            onVerificationComplete(true, position.coords);
          }, 1000);
          return;
        }

        // Calculate distance from target
        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          targetLocation.lat,
          targetLocation.lng
        );

        setTimeout(() => {
          if (distance <= targetLocation.radiusMeters) {
            setStatus("verified");
            onVerificationComplete(true, position.coords);
          } else {
            setStatus("failed");
            setError(`You are ${Math.round(distance)}m away from the session location. Maximum allowed: ${targetLocation.radiusMeters}m`);
            onVerificationComplete(false);
          }
        }, 1000);
      },
      (err) => {
        setStatus("failed");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. You must enable location to mark attendance.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please try again.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("Unable to verify your location.");
        }
        onVerificationComplete(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onVerificationComplete, targetLocation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            status === "verified" ? "bg-success/10" : 
            status === "failed" ? "bg-destructive/10" : 
            "bg-primary/10"
          }`}>
            <MapPin className={`w-5 h-5 ${
              status === "verified" ? "text-success" : 
              status === "failed" ? "text-destructive" : 
              "text-primary"
            }`} />
          </div>
          <div>
            <p className="font-medium text-foreground">Location Verification</p>
            <p className="text-sm text-muted-foreground">
              {status === "idle" && "Click to verify your location"}
              {status === "requesting" && "Requesting location access..."}
              {status === "verifying" && "Verifying location..."}
              {status === "verified" && "Location verified successfully"}
              {status === "failed" && "Location verification failed"}
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

        {status === "failed" && (
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

      {coords && status === "verified" && (
        <p className="text-xs text-muted-foreground text-center font-mono">
          Coordinates: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
