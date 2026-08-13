"use client";

import { useCallback, useEffect, useState } from "react";
import { Mascot } from "@/components/mascot/Mascot";
import { TOUR_STEPS, type TourStep } from "./tourSteps";

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
}

interface Spotlight {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const DIM = { background: "rgba(0,0,0,0.65)" } as const;

/**
 * Step-by-step walkthrough of the interface.
 *
 * Rather than a static help page, this dims the screen and cuts a hole over the
 * element being described, so the explanation is anchored to the real UI.
 *
 * The dim is drawn as four plain rectangles around the target rather than one
 * div with a huge `box-shadow` spread. The shadow trick is tempting because
 * it's a single element, but it puts the cutout's geometry inside an animated
 * property, and a re-measure mid-transition leaves the hole in the wrong place.
 * Four explicitly positioned rects have no such coupling — each one is just a
 * box at known coordinates.
 *
 * Measurement deliberately avoids listening for scroll events: `scrollIntoView`
 * fires a continuous stream of them, and setting state on each one re-renders
 * fast enough to lock up the page. Scrolling is instant and measured once
 * afterwards instead.
 *
 * The step list is filtered to what's actually on screen when the tour opens,
 * rather than skipped over during navigation. Several targets (the right rail)
 * are hidden below 1100px, and filtering up front means the progress dots and
 * the "step N of M" counter describe the tour the user is actually getting.
 */
export function GuidedTour({ open, onClose }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>(TOUR_STEPS);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

  const step: TourStep | undefined = steps[index];

  // Recompute which steps apply each time the tour opens, since the viewport
  // may have changed since last time. Existence isn't enough to count as
  // visible: the rail is `display:none` below 1100px but still in the DOM, so
  // querySelector finds it while it measures 0x0 — spotlighting an empty point.
  useEffect(() => {
    if (!open) return;

    setSteps(
      TOUR_STEPS.filter(({ target }) => {
        if (target === null) return true;
        const element = document.querySelector(target);
        return !!element && element.getBoundingClientRect().width > 0;
      })
    );
    setIndex(0);
  }, [open]);

  const advance = useCallback(
    (direction: 1 | -1) => {
      const next = index + direction;
      if (next < 0) return;
      if (next >= steps.length) onClose();
      else setIndex(next);
    },
    [index, steps.length, onClose]
  );

  // Measure the current target. Re-measures on resize because the dim rects are
  // positioned in viewport coordinates, so a resize invalidates them. Scrolls
  // the target into view first for steps below the fold.
  useEffect(() => {
    if (!open || !step) return;

    if (step.target === null) {
      setSpotlight(null);
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      setSpotlight(null);
      return;
    }

    // Instant, not smooth: smooth scrolling emits scroll events for hundreds of
    // milliseconds, and re-measuring on each one re-renders the overlay fast
    // enough to hang the page.
    element.scrollIntoView({ block: "center" });

    const measure = () => {
      const rect = element.getBoundingClientRect();
      setSpotlight({
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") advance(1);
      if (event.key === "ArrowLeft") advance(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, advance, onClose]);

  if (!open || !step) return null;

  const isLast = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Dim. With a target, four rects leave a hole over it; without one, a
          single full-screen panel. */}
      {spotlight ? (
        <>
          <div className="pointer-events-none absolute" style={{ ...DIM, top: 0, left: 0, right: 0, height: Math.max(spotlight.top, 0) }} />
          <div className="pointer-events-none absolute" style={{ ...DIM, top: spotlight.top + spotlight.height, left: 0, right: 0, bottom: 0 }} />
          <div className="pointer-events-none absolute" style={{ ...DIM, top: spotlight.top, left: 0, width: Math.max(spotlight.left, 0), height: spotlight.height }} />
          <div className="pointer-events-none absolute" style={{ ...DIM, top: spotlight.top, left: spotlight.left + spotlight.width, right: 0, height: spotlight.height }} />
          <div
            className="pointer-events-none absolute rounded-2xl"
            style={{
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              border: "3px solid var(--green)",
            }}
          />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0" style={DIM} />
      )}

      {/* Click-anywhere-to-dismiss, behind the card. */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close tour"
        onClick={onClose}
      />

      {/* Card. Pinned to the bottom on all sizes: it never collides with a
          spotlight near the top, which is where most targets are, and it keeps
          the layout identical on mobile. */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border-2 border-stone-light bg-paper-raised p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <Mascot size={56} happy={isLast} />
            <div className="flex-1">
              <h2 className="font-display text-lg font-extrabold text-ink">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex gap-1.5" aria-hidden="true">
              {steps.map((_, dotIndex) => (
                <span
                  key={dotIndex}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: dotIndex === index ? 20 : 8,
                    background: dotIndex === index ? "var(--green)" : "var(--stone-light)",
                  }}
                />
              ))}
            </div>

            <div className="flex shrink-0 gap-2">
              {index > 0 && (
                <button type="button" onClick={() => advance(-1)} className="btn btn-ghost !px-4 !py-2">
                  Back
                </button>
              )}
              <button type="button" onClick={() => advance(1)} className="btn btn-green !px-5 !py-2">
                {isLast ? "Finish" : "Next"}
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-ink-soft">
            Step {index + 1} of {steps.length} · Esc to exit
          </p>
        </div>
      </div>
    </div>
  );
}
