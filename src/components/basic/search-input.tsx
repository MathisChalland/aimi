import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  onKeyDown,
  isLoading,
  placeholder,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasValue = value.trim() !== "";

  return (
    <div className={cn("flex items-center", expanded ? "w-2xs" : "w-auto")}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(!expanded && hasValue && "bg-accent")}
      >
        {isLoading ? (
          <Loader2 className="text-muted-foreground animate-spin" />
        ) : (
          <Search className="text-muted-foreground" />
        )}
      </Button>
      {expanded && (
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          onBlur={() => !hasValue && setExpanded(false)}
          className="m-0 w-full truncate border-none p-0 outline-none"
        />
      )}
      {hasValue && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange("");
            setExpanded(false);
          }}
        >
          <X className="text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
