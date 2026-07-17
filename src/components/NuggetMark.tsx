export interface NuggetMarkProps {
  className?: string;
  size?: number;
}

export function NuggetMark({ className, size = 24 }: NuggetMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M7 2.8 17.2 2l4.5 6.6-2 9.1-7.8 4.5-8.3-4.7L2 8.8 7 2.8Z" fill="#E5A11A" />
      <path d="m7 2.8 5 3.7L2 8.8 7 2.8Z" fill="#FFD66B" />
      <path d="m17.2 2 4.5 6.6-9.7-2.1L17.2 2Z" fill="#F7BB31" />
      <path d="m2 8.8 10-2.3-2.1 8.1L2 8.8Z" fill="#F3B11F" />
      <path d="m12 6.5 9.7 2.1-5.8 6.6-6-0.6L12 6.5Z" fill="#CF8500" />
      <path d="m2 8.8 7.9 5.8 2 7.6-8.3-4.7L2 8.8Z" fill="#D68C00" />
      <path d="m9.9 14.6 6 .6-4 7-2-7.6Z" fill="#F0A300" />
      <path d="m21.7 8.6-2 9.1-3.8-2.5 5.8-6.6Z" fill="#B97700" />
      <path d="m15.9 15.2 3.8 2.5-7.8 4.5 4-7Z" fill="#D98D00" />
      <path d="m7 2.8 5 3.7 5.2-4.5" fill="none" stroke="#FFF2D4" strokeWidth="0.7" />
    </svg>
  );
}
