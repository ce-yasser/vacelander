"use client";

import { CheckIcon } from "lucide-react";
import { MEMBER_COLOR_PALETTE } from "@vaclendar/shared";
import { cn } from "@vaclendar/ui";

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  /** Show an "Auto" option that leaves the color unset. */
  allowAuto?: boolean;
  idPrefix: string;
}

/** Palette swatches plus a free-form color input. */
export function ColorPicker({ value, onChange, allowAuto, idPrefix }: ColorPickerProps) {
  const custom =
    value && !MEMBER_COLOR_PALETTE.includes(value as (typeof MEMBER_COLOR_PALETTE)[number]);

  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap items-center gap-1.5">
      {allowAuto ? (
        <button
          type="button"
          role="radio"
          aria-checked={!value}
          onClick={() => onChange(undefined)}
          className={cn(
            "h-7 rounded-full border px-2.5 text-xs font-medium transition-colors",
            !value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          Auto
        </button>
      ) : null}
      {MEMBER_COLOR_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          title={color}
          onClick={() => onChange(color)}
          className="grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-background transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: color }}
        >
          {value === color ? <CheckIcon className="size-4 text-white" /> : null}
        </button>
      ))}
      <label
        htmlFor={`${idPrefix}-custom-color`}
        title="Custom color"
        className={cn(
          "relative grid size-7 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed",
          custom ? "border-transparent" : "border-muted-foreground/40",
        )}
        style={custom ? { backgroundColor: value } : undefined}
      >
        {custom ? <CheckIcon className="size-4 text-white" /> : <span className="text-xs">+</span>}
        <span className="sr-only">Custom color</span>
        <input
          id={`${idPrefix}-custom-color`}
          type="color"
          value={value ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
