import { useState, useRef, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface SessionCodeInputProps {
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function SessionCodeInput({ onComplete, disabled }: SessionCodeInputProps) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c !== "")) {
      onComplete(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").toUpperCase().slice(0, 6);
    if (/^[A-Z0-9]+$/.test(pastedData)) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      if (newCode.every((c) => c !== "")) {
        onComplete(newCode.join(""));
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {code.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 text-center text-xl font-mono font-bold input-secure uppercase"
          autoComplete="off"
        />
      ))}
    </div>
  );
}
