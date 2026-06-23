import { cn } from "../../lib/utils";

export function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({ className, children, ...props }) {
  return (
    <span
      className={cn("text-xs font-semibold uppercase tracking-wide", className)}
      {...props}
    >
      {children}
    </span>
  );
}
