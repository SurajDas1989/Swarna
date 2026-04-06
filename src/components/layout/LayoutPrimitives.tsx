"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  gap?: number | string;
  id?: string;
}

/**
 * Row: A flex row that stacks on mobile by default.
 * Enforces min-width: 0 on children via global CSS.
 */
export function Row({ children, className, gap = 4, id }: LayoutProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col md:flex-row w-full",
        typeof gap === "number" ? `gap-${gap}` : gap,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Stack: A simple flex-column.
 */
export function Stack({ children, className, gap = 4, id }: LayoutProps) {
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col w-full",
        typeof gap === "number" ? `gap-${gap}` : gap,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * AdaptiveContainer: A container that respects safe areas and avoids overflow.
 */
export function AdaptiveContainer({ children, className, id, wide }: LayoutProps & { wide?: boolean }) {
  return (
    <div
      id={id}
      className={cn(
        "safe-area w-full mx-auto px-4",
        wide ? "max-w-[1400px]" : "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * InputButtonGroup: Standardized pattern for input + button.
 */
export function InputButtonGroup({ children, className, id }: LayoutProps) {
  return (
    <div
      id={id}
      className={cn("input-button-group", className)}
    >
      {children}
    </div>
  );
}
