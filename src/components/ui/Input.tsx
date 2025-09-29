import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <label className="mb-4 flex w-full flex-col gap-1" htmlFor={inputId}>
      {label ? <span className="text-sm font-medium text-slate-200">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-11 w-full rounded-lg border border-transparent bg-coal-800/70 px-4 text-base text-slate-100 placeholder:text-ore-300 focus:border-btc-orange focus:outline-none focus:ring-2 focus:ring-btc-orange/60",
          error && "border-red-500 focus:ring-red-500/70",
          className,
        )}
        {...props}
      />
      {helperText && !error ? <span className="text-xs text-ore-300">{helperText}</span> : null}
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}
