import Link from "next/link";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-vl-secondary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-vl-heading text-2xl font-bold tracking-[-0.03em] text-vl-ink sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-vl-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 rounded-vl-control px-3 py-2 text-sm font-semibold text-vl-ink transition-colors duration-200 hover:bg-vl-surface hover:text-vl-primary"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
