"use client";

import { Button, Card } from "@/components/ui";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="text-lg font-bold">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-muted">
        {error.message && !error.digest ? error.message : "The round API didn't respond as expected. Check that theround-service is running and reachable."}
      </p>
      <Button variant="primary" className="mt-5" onClick={reset}>
        Try again
      </Button>
    </Card>
  );
}
