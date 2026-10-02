export default function Loading() {
  return (
    <div aria-busy className="animate-pulse space-y-4">
      <div className="h-3 w-24 rounded bg-line" />
      <div className="h-8 w-64 rounded bg-line" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-line-soft" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-line-soft" />
    </div>
  );
}
