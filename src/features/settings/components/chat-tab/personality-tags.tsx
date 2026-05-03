"use client";

import { cn } from "@/lib/utils";
import { PERSONALITY_TAGS } from "@/features/companion/schemas";

const CATEGORY_LABELS: Record<string, string> = {
  emotional: "Emotional",
  social: "Social",
  intellectual: "Intellectual",
  energy: "Energy",
};

interface PersonalityTagsProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function PersonalityTags({ selected, onChange }: PersonalityTagsProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else if (selected.length < 5) {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(PERSONALITY_TAGS).map(([category, tags]) => (
        <div
          key={category}
          className="flex items-baseline justify-between gap-4"
        >
          <p className="text-muted-foreground shrink-0 text-xs font-medium">
            {CATEGORY_LABELS[category]}
          </p>
          <div className="flex flex-wrap justify-end gap-1.5">
            {tags.map((tag) => {
              const isSelected = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-muted-foreground text-right text-xs">
        {selected.length}/5 selected
      </p>
    </div>
  );
}
