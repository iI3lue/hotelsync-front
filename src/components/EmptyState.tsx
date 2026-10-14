import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: EmptyStateProps) {
  return (
    <div className="border-y border-brand-navy/10 px-6 py-20 text-center dark:border-white/10">
      <span aria-hidden="true" className="mx-auto mb-8 block h-10 w-px bg-brand-gold" />
      <h2 className="mx-auto max-w-xl font-display text-[2rem] leading-tight text-brand-navy dark:text-white">{title}</h2>
      <p className="mx-auto mt-4 max-w-md break-words text-brand-navy/60 dark:text-white/60">{description}</p>
      {children}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn-outline mt-10">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
