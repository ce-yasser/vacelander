import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { inputClassName } from "./input";

/** A styled native <select>: accessible and touch-friendly on mobile. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(inputClassName, "appearance-none pr-8", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 opacity-50" />
    </div>
  );
}
