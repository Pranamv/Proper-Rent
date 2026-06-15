type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 18 L18 9 L28 18 V28 H8 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M15 28 V21 H21 V28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M31 11 C 26 15, 22 18, 18 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1 5"
        opacity="0.7"
      />
      <circle cx="18" cy="21" r="1.75" fill="rgb(var(--color-accent-spark))" />
    </svg>
  );
}
