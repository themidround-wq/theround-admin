import { adminFetch } from "@/lib/api";

/** Streams the API's CSV through, so the admin token never reaches the browser. */
export async function GET() {
  const res = await adminFetch<Response>("/waitlist/export", { raw: true });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(res.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="theround-waitlist-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
