/**
 * Content for the guided tour.
 *
 * Steps are data, not JSX, so the tour component stays a single renderer and
 * adding or reordering a step is a one-line edit here. Each step names a CSS
 * selector to spotlight; the tour resolves it at display time and quietly
 * skips any step whose target isn't on the current page (the right rail is
 * hidden below 1100px, for instance), so the tour never highlights nothing.
 */

export interface TourStep {
  /** Element to spotlight. null centres the card with no highlight. */
  target: string | null;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: "Welcome! 👋",
    body:
      "This is a Duolingo-style Korean course. Here's a quick tour of what everything does — it takes about 30 seconds.",
  },
  {
    target: "[title='Day streak']",
    title: "Your streak 🔥",
    body:
      "Counts consecutive days you've finished a lesson. It advances once per calendar day, and resets if you skip one.",
  },
  {
    target: "[title='Total XP']",
    title: "XP ⚡",
    body:
      "You earn 10 XP for every correct answer. XP feeds your daily goal and your weekly league ranking.",
  },
  {
    target: "[title='Hearts']",
    title: "Hearts ❤️",
    body:
      "You start with 5. A wrong answer costs one, and at zero the lesson ends. Hearts regenerate over time, or you can spend gems to refill instantly.",
  },
  {
    target: "[title='Gems']",
    title: "Gems 💎",
    body:
      "The mocked currency. Spend 350 to refill your hearts when you run out mid-lesson.",
  },
  {
    target: ".node-complete, .node-available",
    title: "The learning path 🗺️",
    body:
      "Skills unlock in order. Green is available now, gold with a crown is complete, and grey is still locked. The ring around each node fills as you finish its lessons.",
  },
  {
    target: "[aria-label='Daily goal']",
    title: "Daily goal 🎯",
    body:
      "50 XP a day — about one clean lesson. It resets automatically each day.",
  },
  {
    target: "[aria-label='Leaderboard']",
    title: "Weekly leagues 🏆",
    body:
      "You compete against others in your league on XP earned this week. Top 3 get promoted, bottom 2 drop down, and everything resets Monday.",
  },
  {
    target: null,
    title: "That's it — go learn! 🎓",
    body:
      "Tap the green node on the path to start a lesson. You'll meet five exercise types: multiple choice, word bank, matching, fill in the blank, and typing.",
  },
];
