"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { ApiError, getUser } from "@/services/api";
import type { UserResponse } from "@/types/api";
import { AppShell } from "@/components/layout/AppShell";
import { HeartsRefill } from "@/components/gamification/HeartsRefill";
import { GemIcon, HeartIcon } from "@/components/learning-path/icons";

/** Shop page.
 *
 * The hearts refill at the top is the real thing: it spends real gems through
 * POST /users/{id}/hearts/refill and the balance below updates from the
 * server's response. Everything under it is a placeholder, which the brief
 * allows for in-app purchases.
 *
 * Reusing HeartsRefill here rather than writing a shop-specific button is the
 * point of having it as a component — it already owns the gem affordability
 * check and the live regen countdown, and both are exactly as correct on this
 * page as on the one it was written for. */
export default function ShopPage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getUser(CURRENT_USER_ID)
      .then((data) => {
        setUser(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't reach the server. Is the backend running?"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="font-display text-ink-soft">Loading shop…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !user) {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-lg font-bold text-ink">
            Couldn&apos;t load the shop
          </p>
          <p className="max-w-sm text-sm text-ink-soft">{error}</p>
        </div>
      </AppShell>
    );
  }

  const heartsFull = user.hearts >= user.max_hearts;

  return (
    <AppShell>
      <header className="border-b-2 border-stone-light bg-paper-raised px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="font-display text-lg font-extrabold text-ink">Shop</h1>
          <span
            className="flex items-center gap-2 font-display text-base font-extrabold"
            style={{ color: "var(--blue)" }}
          >
            <GemIcon size={22} />
            {user.gems.toLocaleString()}
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
        {/* Hearts — the one section that spends real gems. */}
        <section aria-label="Hearts">
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Hearts
          </h2>

          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-stone-light px-5 py-6">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: user.max_hearts }, (_, index) => (
                <span
                  key={index}
                  style={{
                    color:
                      index < user.hearts ? "var(--red)" : "var(--stone-light)",
                  }}
                >
                  <HeartIcon size={26} />
                </span>
              ))}
            </span>

            <p className="text-center text-sm text-ink-soft">
              {heartsFull
                ? "Your hearts are full — nothing to buy right now."
                : `${user.hearts} of ${user.max_hearts} hearts left.`}
            </p>

            {!heartsFull && (
              <HeartsRefill
                userId={user.id}
                gems={user.gems}
                cost={user.heart_refill_gem_cost}
                secondsUntilNextHeart={user.seconds_until_next_heart}
                onRefilled={load}
              />
            )}
          </div>
        </section>

        {/* Everything below is mocked, per the brief. */}
        <section aria-label="Other items">
          <h2 className="mb-3 font-display text-sm font-extrabold uppercase tracking-wide text-ink-soft">
            Power-ups
          </h2>

          <div className="flex flex-col gap-3">
            {MOCKED_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-2xl border-2 border-stone-light px-5 py-4"
              >
                <span className="text-2xl" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-ink">
                    {item.title}
                  </p>
                  <p className="text-xs text-ink-soft">{item.description}</p>
                </div>
                <span
                  className="rounded-full px-3 py-1 font-display text-xs font-bold"
                  style={{ background: "var(--stone-light)", color: "var(--badge-ink)" }}
                >
                  SOON
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-ink-soft">
          Gems are mocked: they&apos;re seeded rather than earned, and refilling
          hearts is the only thing that spends them.
        </p>
      </div>
    </AppShell>
  );
}

const MOCKED_ITEMS = [
  {
    icon: "🦉",
    title: "Super",
    description: "Unlimited hearts and no ads — subscriptions aren't in this build.",
  },
  {
    icon: "❄️",
    title: "Streak freeze",
    description: "Skip a day without losing your streak.",
  },
  {
    icon: "💎",
    title: "Gem bundle",
    description: "Top up your balance — there's no payment flow here.",
  },
];
