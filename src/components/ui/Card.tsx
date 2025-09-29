import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({
  title,
  subtitle,
  actions,
  className,
  children,
}: PropsWithChildren<CardProps>) {
  return (
    <section className={cn("card-surface flex flex-col gap-4 p-6", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3">
          <div>
            {typeof title === "string" ? (
              <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            ) : (
              title
            )}
            {subtitle ? <p className="text-sm text-ore-300">{subtitle}</p> : null}
          </div>
          {actions}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
