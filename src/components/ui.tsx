import * as React from "react";
import { cn } from "@/lib/cn";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "live";
  size?: "sm" | "md" | "lg" | "icon";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-medium transition-[opacity,transform,background-color,border-color] duration-150 ease-out active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-[15px]",
        size === "icon" && "h-10 w-10",
        variant === "primary" &&
          "bg-primary text-primary-fg hover:opacity-90",
        variant === "secondary" &&
          "bg-elevated text-fg border border-border hover:border-border-strong hover:bg-raised",
        variant === "ghost" &&
          "bg-transparent text-muted hover:text-fg hover:bg-elevated",
        variant === "danger" &&
          "bg-danger-dim text-danger border border-danger/30 hover:bg-danger/20",
        variant === "live" &&
          "bg-live text-primary-fg hover:opacity-90 font-semibold",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "live" | "warn" | "danger" | "info";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        tone === "neutral" && "bg-raised text-muted border border-border",
        tone === "live" && "bg-live-dim text-live border border-live/25",
        tone === "warn" && "bg-warn-dim text-warn border border-warn/25",
        tone === "danger" && "bg-danger-dim text-danger border border-danger/25",
        tone === "info" && "bg-info-dim text-info border border-info/25",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-raised",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-live transition-[width] duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  label?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-150",
        checked
          ? "bg-live border-live/40"
          : "bg-raised border-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-fg shadow transition-transform duration-150",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[var(--radius-sm)] border border-border bg-elevated px-3 text-sm text-fg placeholder:text-subtle outline-none transition-colors focus:border-border-strong focus:ring-1 focus:ring-border-strong",
        className,
      )}
      {...props}
    />
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-[var(--radius-md)] border border-border bg-elevated p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors duration-150",
            value === opt.value
              ? "bg-raised text-fg shadow-sm"
              : "text-muted hover:text-fg",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
