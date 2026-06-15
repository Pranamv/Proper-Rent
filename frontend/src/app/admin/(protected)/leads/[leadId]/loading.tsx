export default function AdminLeadDetailLoading() {
  return (
    <div className="space-y-6" aria-label="Loading lead detail" aria-busy="true">
      <div className="h-9 w-32 rounded-md bg-surface-subtle" />

      <div className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <div className="h-4 w-20 rounded-full bg-surface-subtle" />
        <div className="mt-4 h-8 w-64 rounded-full bg-surface-subtle" />
        <div className="mt-3 h-4 max-w-lg rounded-full bg-surface-subtle" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {Array.from({ length: 2 }, (_, index) => (
            <section className="rounded-md border border-border bg-surface p-5" key={index}>
              <div className="h-5 w-40 rounded-full bg-surface-subtle" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, itemIndex) => (
                  <div className="space-y-2" key={itemIndex}>
                    <div className="h-3 w-20 rounded-full bg-surface-subtle" />
                    <div className="h-4 rounded-full bg-surface-subtle" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="rounded-md border border-border bg-surface p-5">
          <div className="h-5 w-36 rounded-full bg-surface-subtle" />
          <div className="mt-5 space-y-4">
            <div className="h-11 rounded-md bg-surface-subtle" />
            <div className="h-11 rounded-md bg-surface-subtle" />
            <div className="h-28 rounded-md bg-surface-subtle" />
            <div className="h-11 rounded-md bg-surface-subtle" />
          </div>
        </aside>
      </div>
    </div>
  );
}
