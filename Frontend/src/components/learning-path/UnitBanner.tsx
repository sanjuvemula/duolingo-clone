interface UnitBannerProps {
  title: string;
  order: number;
}

export function UnitBanner({ title, order }: UnitBannerProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm items-center justify-between rounded-2xl bg-indigo px-5 py-4 text-white shadow-sm">
      <div>
        <p className="font-sans text-xs font-semibold uppercase tracking-wide text-white/70">
          Unit {order}
        </p>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
    </div>
  );
}