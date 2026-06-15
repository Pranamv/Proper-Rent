const statusSkeletons = Array.from({ length: 9 }, (_, index) => index);
const rowSkeletons = Array.from({ length: 5 }, (_, index) => index);

export default function AdminLeadsLoading() {
  return (
    <div className="space-y-5" aria-label="Loading leads" aria-busy="true">
      <div className="rounded-md border border-border bg-surface p-4 shadow-soft">
        <div className="h-4 w-16 rounded-full bg-surface-subtle" />
        <div className="mt-3 h-7 w-56 rounded-full bg-surface-subtle" />
        <div className="mt-3 h-4 max-w-xl rounded-full bg-surface-subtle" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="rounded-md border border-border bg-surface p-4" key={index}>
            <div className="h-4 w-24 rounded-full bg-surface-subtle" />
            <div className="mt-4 h-8 w-14 rounded-full bg-surface-subtle" />
            <div className="mt-3 h-4 w-36 rounded-full bg-surface-subtle" />
          </div>
        ))}
      </div>

      <section className="rounded-md border border-border bg-surface">
        <div className="border-b border-border p-3">
          <div className="grid gap-3 2xl:grid-cols-[minmax(160px,260px)_1fr]">
            <div>
              <div className="h-5 w-20 rounded-full bg-surface-subtle" />
              <div className="mt-2 h-3 w-32 rounded-full bg-surface-subtle" />
            </div>
            <div className="flex gap-1.5 overflow-hidden">
              {statusSkeletons.map((index) => (
                <div
                  className="h-8 w-20 shrink-0 rounded-md bg-surface-subtle"
                  key={index}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[900px] divide-y divide-border">
            {rowSkeletons.map((index) => (
              <div
                className="grid grid-cols-[1.4fr_0.5fr_0.9fr_1.1fr_1fr_0.8fr_0.9fr] gap-4 px-3 py-3"
                key={index}
              >
                {Array.from({ length: 7 }, (_, cellIndex) => (
                  <div className="space-y-2" key={cellIndex}>
                    <div className="h-4 rounded-full bg-surface-subtle" />
                    <div className="h-3 w-2/3 rounded-full bg-surface-subtle" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
