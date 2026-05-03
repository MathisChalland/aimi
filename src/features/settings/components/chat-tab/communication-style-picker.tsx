"use client";

import { cn } from "@/lib/utils";
import { COMMUNICATION_STYLES } from "@/features/companion/schemas";

const STYLE_LABELS: Record<string, string> = {
  formal: "Formal",
  casual: "Casual",
  balanced: "Balanced",
  concise: "Concise",
  expressive: "Expressive",
};

interface CommunicationStylePickerProps {
  value: string;
  onChange: (style: string) => void;
}

export function CommunicationStylePicker({
  value,
  onChange,
}: CommunicationStylePickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COMMUNICATION_STYLES.map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => onChange(style)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            value === style
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          {STYLE_LABELS[style]}
        </button>
      ))}
    </div>
  );
}
