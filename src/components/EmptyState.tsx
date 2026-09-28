import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export default function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-white px-6 py-12 text-center shadow-md dark:bg-gray-800">
      <h2 className="mb-2 text-xl font-semibold text-balance">{title}</h2>
      <p className="mx-auto mb-6 max-w-md break-words text-gray-600 dark:text-gray-300">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
