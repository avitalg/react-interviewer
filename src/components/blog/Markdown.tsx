import Link from "next/link";
import { getHeadings, parseMarkdown } from "@/blog/markdown";
import { cx } from "@/components/ui";

const inlinePattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function Inline({ text }: { text: string }) {
  const parts = text.split(inlinePattern);
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
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          const className = "font-medium text-accent underline-offset-2 hover:underline";
          if (href.startsWith("/")) {
            return (
              <Link key={index} href={href} className={className}>
                {label}
              </Link>
            );
          }
          return (
            <a key={index} href={href} className={className} rel="noreferrer">
              {label}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export function ArticleToc({ source }: { source: string }) {
  const headings = getHeadings(source);
  if (headings.length < 3) return null;
  return (
    <nav aria-label="On this page" className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="mb-2 font-mono text-[11px] tracking-wide text-muted uppercase">On this page</p>
      <ol className="space-y-1.5">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`} className="text-sm text-muted transition hover:text-fg">
              {heading.text.replace(/`/g, "")}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseMarkdown(source);
  return (
    <div className={cx("space-y-4", className)}>
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2 key={block.id} id={block.id} className="scroll-mt-20 pt-4 text-xl font-semibold tracking-tight">
              <Inline text={block.text} />
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={block.id} id={block.id} className="scroll-mt-20 pt-2 text-lg font-semibold tracking-tight">
              <Inline text={block.text} />
            </h3>
          );
        }
        if (block.type === "p") {
          return (
            <p key={index} className="leading-7 text-fg/90">
              <Inline text={block.text} />
            </p>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const List = block.type === "ul" ? "ul" : "ol";
          return (
            <List
              key={index}
              className={cx("space-y-1.5 pl-5 leading-7 text-fg/90", block.type === "ul" ? "list-disc" : "list-decimal")}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline text={item} />
                </li>
              ))}
            </List>
          );
        }
        if (block.type === "code") {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-4 font-mono text-[13px] leading-6"
            >
              <code>{block.code}</code>
            </pre>
          );
        }
        return null;
      })}
    </div>
  );
}
