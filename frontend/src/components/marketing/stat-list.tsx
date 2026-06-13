type StatItem = {
  label: string;
  value: string;
};

type StatListProps = {
  items: StatItem[];
};

export function StatList({ items }: StatListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div className="rounded-md border border-border bg-surface p-4" key={item.label}>
          <p className="text-2xl font-bold text-foreground">{item.value}</p>
          <p className="mt-2 text-sm leading-5 text-muted">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
