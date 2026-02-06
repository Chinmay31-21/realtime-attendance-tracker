import { Check, X, Loader2, AlertCircle } from "lucide-react";

type VerificationState = "pending" | "verifying" | "verified" | "failed";

interface VerificationStatusProps {
  label: string;
  status: VerificationState;
  message?: string;
}

const statusConfig = {
  pending: {
    icon: AlertCircle,
    className: "verification-badge-neutral",
    text: "Pending",
  },
  verifying: {
    icon: Loader2,
    className: "verification-badge-pending",
    text: "Verifying...",
  },
  verified: {
    icon: Check,
    className: "verification-badge-success",
    text: "Verified",
  },
  failed: {
    icon: X,
    className: "verification-badge-error",
    text: "Failed",
  },
};

export function VerificationStatus({ label, status, message }: VerificationStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className={config.className}>
          <Icon className={`w-4 h-4 ${status === "verifying" ? "animate-spin" : ""}`} />
          <span>{config.text}</span>
        </div>
      </div>
      {message && (
        <p className={`text-xs ${status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
