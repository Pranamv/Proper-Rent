type StepItem = {
  title: string;
  body: string;
};

type StepListProps = {
  items: StepItem[];
};

export function StepList({ items }: StepListProps) {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        <li
          className="rounded-md border border-border bg-surface p-5 shadow-soft"
          key={item.title}
        >
          <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
            {index + 1}
          </span>
          <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
