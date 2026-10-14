import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatArticleDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`;
}

export function ArticleCard({
  href,
  title,
  description,
  date,
  tags,
  heading: Heading = "p",
}: {
  href: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  heading?: "h2" | "p";
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition hover:border-accent"
    >
      <div className="flex items-center justify-between gap-3">
        <time dateTime={date} className="font-mono text-[11px] text-muted">
          {formatArticleDate(date)}
        </time>
        <span className="font-mono text-[11px] text-muted">{tags[0]}</span>
      </div>
      <Heading className="font-semibold tracking-tight group-hover:text-accent">{title}</Heading>
      <p className="text-sm leading-6 text-muted">{description}</p>
    </Link>
  );
}
