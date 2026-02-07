import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SecureCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  label?: string;
}

export function SecureCodeInput({ 
  length = 8, 
  onComplete, 
  disabled,
  label 
}: SecureCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const [isFocused, setIsFocused] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Anti-screenshot: blur when window loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsFocused(false);
      }
    };

    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete (last character entered)
    if (newCode.every((c) => c !== "")) {
      // Slight delay to show the last character
      setTimeout(() => {
        onComplete(newCode.join(""));
      }, 100);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length);
    if (pastedData.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length && i < length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      
      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(pastedData.length - 1, length - 1);
      if (pastedData.length < length) {
        inputRefs.current[pastedData.length]?.focus();
      }
      
      // Auto-submit if complete
      if (newCode.every((c) => c !== "")) {
        setTimeout(() => {
          onComplete(newCode.join(""));
        }, 100);
      }
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm text-muted-foreground text-center">{label}</p>
      )}
      <div className="flex gap-1.5 justify-center">
        {code.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            disabled={disabled}
            className={`
              w-10 h-12 text-center text-lg font-mono font-bold uppercase
              border-2 transition-all duration-200
              ${disabled ? 'opacity-50 blur-md' : ''}
              ${!isFocused && !disabled ? 'blur-sm' : ''}
              input-secure
            `}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        ))}
      </div>
      {!isFocused && !disabled && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          Tap to reveal • Auto-blurs for security
        </p>
      )}
    </div>
  );
}
