export default function AdminLandlordDetailLoading() {
  return (
    <div className="space-y-6" aria-label="Loading landlord detail" aria-busy="true">
      <div className="h-9 w-36 rounded-md bg-surface-subtle" />

      <div className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <div className="h-4 w-28 rounded-full bg-surface-subtle" />
        <div className="mt-4 h-8 w-72 max-w-full rounded-full bg-surface-subtle" />
        <div className="mt-3 h-4 max-w-lg rounded-full bg-surface-subtle" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <section className="rounded-md border border-border bg-surface p-5" key={index}>
              <div className="h-5 w-40 rounded-full bg-surface-subtle" />
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }, (_, itemIndex) => (
                  <div className="space-y-2" key={itemIndex}>
                    <div className="h-3 w-20 rounded-full bg-surface-subtle" />
                    <div className="h-4 rounded-full bg-surface-subtle" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-6">
          <section className="rounded-md border border-border bg-surface p-5">
            <div className="h-5 w-36 rounded-full bg-surface-subtle" />
            <div className="mt-5 space-y-4">
              <div className="h-11 rounded-md bg-surface-subtle" />
              <div className="h-28 rounded-md bg-surface-subtle" />
              <div className="h-11 rounded-md bg-surface-subtle" />
            </div>
          </section>
          <section className="rounded-md border border-border bg-surface p-5">
            <div className="h-5 w-36 rounded-full bg-surface-subtle" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div className="h-4 rounded-full bg-surface-subtle" key={index} />
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
