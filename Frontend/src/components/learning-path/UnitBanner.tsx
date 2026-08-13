interface UnitBannerProps {
  title: string;
  order: number;
}

/** Full-width unit header, styled like the reference Duolingo green banners.
 * Uses green for Unit 1, blue for Unit 2, etc. to visually distinguish
 * units while staying within the design palette. */
const UNIT_COLORS = [
  { bg: "var(--green)", text: "#fff" },
  { bg: "var(--blue)", text: "#fff" },
  { bg: "var(--gold)", text: "#fff" },
  { bg: "var(--red)", text: "#fff" },
];

export function UnitBanner({ title, order }: UnitBannerProps) {
  const palette = UNIT_COLORS[(order - 1) % UNIT_COLORS.length];

  return (
    <div
      className="w-full rounded-2xl px-6 py-5 shadow-md"
      style={{ background: palette.bg, color: palette.text }}
    >
      <p className="font-sans text-xs font-bold uppercase tracking-widest opacity-80">
        Unit {order}
      </p>
      <h2 className="font-display text-xl font-bold mt-0.5">{title}</h2>
    </div>
  );
}