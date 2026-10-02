"use client";

import DashboardError from "./(dashboard)/error";

/**
 * Catches what (dashboard)/error.tsx can't: failures in the dashboard layout
 * itself, e.g. loading the signed-in admin while theround-service is down.
 */
export default function AppError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="min-h-screen px-4 py-6">
      <DashboardError {...props} />
    </main>
  );
}
