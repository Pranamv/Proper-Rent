const statusSkeletons = Array.from({ length: 5 }, (_, index) => index);
const rowSkeletons = Array.from({ length: 5 }, (_, index) => index);

export default function AdminLandlordsLoading() {
  return (
    <div className="space-y-6" aria-label="Loading landlords" aria-busy="true">
      <div className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <div className="h-4 w-24 rounded-full bg-surface-subtle" />
        <div className="mt-3 h-8 w-64 rounded-full bg-surface-subtle" />
        <div className="mt-3 h-4 max-w-2xl rounded-full bg-surface-subtle" />
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

      <section className="overflow-hidden rounded-md border border-border bg-surface">
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="h-5 w-28 rounded-full bg-surface-subtle" />
              <div className="mt-2 h-4 w-52 rounded-full bg-surface-subtle" />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusSkeletons.map((index) => (
                <div className="h-9 w-20 rounded-md bg-surface-subtle" key={index} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-3 lg:hidden">
          {rowSkeletons.map((index) => (
            <div className="rounded-md border border-border bg-background p-3" key={index}>
              <div className="space-y-2">
                <div className="h-4 w-2/3 rounded-full bg-surface-subtle" />
                <div className="h-3 rounded-full bg-surface-subtle" />
              </div>
              <div className="mt-3 h-20 rounded-md bg-surface-subtle" />
              <div className="mt-3 h-8 w-20 rounded-md bg-surface-subtle" />
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="divide-y divide-border">
            {rowSkeletons.map((index) => (
              <div
                className="grid grid-cols-[1.2fr_1.5fr_0.8fr_0.7fr_0.7fr_0.9fr] gap-4 px-4 py-4"
                key={index}
              >
                {Array.from({ length: 6 }, (_, cellIndex) => (
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
