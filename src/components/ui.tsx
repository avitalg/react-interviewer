import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import type { Difficulty } from "@/exercises/types";
import type { ExerciseStatus } from "@/lib/progress";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center rounded border px-1.5 font-mono text-[11px] font-medium",
        difficultyStyles[difficulty],
      )}
    >
      {difficulty}
    </span>
  );
}

const statusStyles: Record<ExerciseStatus, { label: string; className: string; dot: string }> = {
  "not-started": { label: "Not started", className: "text-muted", dot: "bg-zinc-400 dark:bg-zinc-600" },
  "in-progress": { label: "In progress", className: "text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
  solved: { label: "Solved", className: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
};

export function StatusPill({ status }: { status: ExerciseStatus }) {
  const style = statusStyles[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs whitespace-nowrap", style.className)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {style.label}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90 border-transparent font-medium",
  secondary: "bg-surface text-fg border-border hover:bg-surface-2",
  ghost: "bg-transparent text-muted border-transparent hover:text-fg hover:bg-surface-2",
  danger: "bg-rose-600 text-white border-transparent hover:bg-rose-500 font-medium",
};

const buttonBase =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  variant = "secondary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <button type="button" className={cx(buttonBase, buttonStyles[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <Link href={href} className={cx(buttonBase, buttonStyles[variant], className)} {...props}>
      {children}
    </Link>
  );
}

/** Renders the small markdown subset used in exercise text: `code`, **bold** and blank-line paragraphs. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.trim().split(/\n\s*\n/);
  return (
    <div className={cx("space-y-2", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          <Inline text={paragraph} />
        </p>
      ))}
    </div>
  );
}

export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
          return (
            <code key={index} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-fg">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-fg">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
