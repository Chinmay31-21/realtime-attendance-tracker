import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TimeWindowCheckProps {
  sessionStartTime?: Date;
  sessionEndTime?: Date;
  onTimeValid: (valid: boolean) => void;
}

export function TimeWindowCheck({ sessionStartTime, sessionEndTime, onTimeValid }: TimeWindowCheckProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isValid, setIsValid] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sessionStartTime || !sessionEndTime) {
      // Demo mode - always valid
      setIsValid(true);
      setMessage("Session is currently active");
      onTimeValid(true);
      return;
    }

    const now = currentTime.getTime();
    const start = sessionStartTime.getTime();
    const end = sessionEndTime.getTime();

    if (now < start) {
      setIsValid(false);
      setMessage(`Session starts at ${sessionStartTime.toLocaleTimeString()}`);
      onTimeValid(false);
    } else if (now > end) {
      setIsValid(false);
      setMessage("Session has ended. Attendance window closed.");
      onTimeValid(false);
    } else {
      setIsValid(true);
      const remaining = Math.ceil((end - now) / 60000);
      setMessage(`${remaining} minutes remaining to mark attendance`);
      onTimeValid(true);
    }
  }, [currentTime, sessionStartTime, sessionEndTime, onTimeValid]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`p-4 rounded-xl border ${
      isValid 
        ? "bg-success/5 border-success/20" 
        : "bg-destructive/5 border-destructive/20"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isValid ? "bg-success/10" : "bg-destructive/10"}`}>
            <Clock className={`w-5 h-5 ${isValid ? "text-success" : "text-destructive"}`} />
          </div>
          <div>
            <p className="font-mono text-lg font-bold text-foreground">
              {formatTime(currentTime)}
            </p>
            <p className={`text-sm ${isValid ? "text-success" : "text-destructive"}`}>
              {message}
            </p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 ${isValid ? "text-success" : "text-destructive"}`}>
          {isValid ? (
            <>
              <div className="status-indicator-live" />
              <span className="text-sm font-medium">LIVE</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">CLOSED</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
