export default function AdminOverviewLoading() {
  return (
    <div className="space-y-6" aria-label="Loading admin overview" aria-busy="true">
      <section className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <div className="h-4 w-36 rounded-full bg-surface-subtle" />
        <div className="mt-4 h-8 max-w-xl rounded-full bg-surface-subtle" />
        <div className="mt-3 h-4 max-w-2xl rounded-full bg-surface-subtle" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="rounded-md border border-border bg-surface p-5" key={index}>
            <div className="h-5 w-32 rounded-full bg-surface-subtle" />
            <div className="mt-3 h-4 rounded-full bg-surface-subtle" />
            <div className="mt-2 h-4 w-4/5 rounded-full bg-surface-subtle" />
            <div className="mt-5 h-9 w-28 rounded-md bg-surface-subtle" />
          </div>
        ))}
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <div className="h-5 w-36 rounded-full bg-surface-subtle" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-20 rounded-md border border-border bg-background p-3" key={index}>
              <div className="h-4 rounded-full bg-surface-subtle" />
              <div className="mt-2 h-4 w-4/5 rounded-full bg-surface-subtle" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
