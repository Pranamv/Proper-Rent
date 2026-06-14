type Testimonial = {
  quote: string;
  name: string;
  role: "Renter" | "Landlord";
};

// TODO: add real quotes once available
const TESTIMONIALS: Testimonial[] = [];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Testimonials() {
  if (TESTIMONIALS.length === 0) {
    return null;
  }

  return (
    <section className="py-10" aria-labelledby="testimonials-title">
      <h2
        id="testimonials-title"
        className="text-2xl font-bold text-foreground sm:text-3xl"
      >
        What renters and landlords say
      </h2>
      <div
        className="mt-6 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {TESTIMONIALS.map((testimonial) => (
          <figure
            key={testimonial.name}
            className="flex w-[85%] shrink-0 flex-col gap-4 rounded-md bg-surface p-6 shadow-soft sm:w-[42%]"
            style={{ scrollSnapAlign: "start" }}
          >
            <blockquote className="text-sm leading-6 text-foreground">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {initials(testimonial.name)}
              </span>
              <span className="text-sm">
                <span className="font-bold text-foreground">{testimonial.name}</span>
                <span className="block text-muted">{testimonial.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
