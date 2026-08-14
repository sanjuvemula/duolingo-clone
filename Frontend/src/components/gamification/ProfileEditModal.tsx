"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, updateUser } from "@/services/api";
import type { UserResponse } from "@/types/api";

/** Avatar colours offered in the picker.
 *
 * This list mirrors user_service.AVATAR_COLORS on the backend, which is the
 * authority — it rejects anything outside its own allow-list, so a drift here
 * surfaces as a 400 shown in the modal rather than a silently broken avatar.
 * The values are token *names*, resolved to CSS variables at render time so a
 * chosen colour still follows the active theme.
 *
 * They are also exactly the accent tokens defined in globals.css, all of which
 * keep their value in dark mode — so a picked colour stays legible whichever
 * theme the learner is in. */
const AVATAR_COLORS = ["blue", "green", "purple", "red", "gold"] as const;

/** Resolve a stored colour name to its CSS variable, falling back to blue for
 * anything unrecognised so an unknown value can't render a transparent
 * avatar. Exported because the profile page paints the same avatar. */
export function avatarColorVar(name: string): string {
  return (AVATAR_COLORS as readonly string[]).includes(name)
    ? `var(--${name})`
    : "var(--blue)";
}

interface ProfileEditModalProps {
  user: UserResponse;
  onClose: () => void;
  /** Called with the server's refreshed user so the page can swap its state
   * for authoritative values rather than the ones typed into the form. */
  onSaved: (user: UserResponse) => void;
}

export function ProfileEditModal({ user, onClose, onSaved }: ProfileEditModalProps) {
  const [name, setName] = useState(user.name);
  const [color, setColor] = useState(user.avatar_color);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the name field on open, and let Escape close — a dialog that traps
  // you until you find the Cancel button is worse than no dialog.
  useEffect(() => {
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const trimmed = name.trim();
  const changed = trimmed !== user.name || color !== user.avatar_color;
  const valid = trimmed.length > 0 && trimmed.length <= 40;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !changed || saving) return;

    setSaving(true);
    setError(null);

    // Send only what changed: the endpoint takes a partial, so an unchanged
    // name shouldn't travel just because the colour was clicked.
    updateUser(user.id, {
      ...(trimmed !== user.name ? { name: trimmed } : {}),
      ...(color !== user.avatar_color ? { avatar_color: color } : {}),
    })
      .then((updated) => {
        onSaved(updated);
        onClose();
      })
      .catch((err: unknown) => {
        setError(
          err instanceof ApiError ? err.message : "Couldn't save your changes."
        );
      })
      .finally(() => setSaving(false));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      // Only a click that both starts and ends on the backdrop dismisses.
      // Checking the target alone would also fire when a drag-select inside
      // the form happens to release out here, closing the modal mid-edit.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        className="w-full max-w-sm rounded-3xl border-2 border-stone-light bg-paper-raised p-6 shadow-xl"
      >
        <h2
          id="profile-edit-title"
          className="mb-5 text-center font-display text-xl font-extrabold text-ink"
        >
          Edit profile
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="profile-name"
              className="font-display text-xs font-bold uppercase tracking-wide text-ink-soft"
            >
              Display name
            </label>
            <input
              id="profile-name"
              ref={inputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              className="rounded-2xl border-2 border-stone-light bg-paper px-4 py-3 font-display text-base font-bold text-ink outline-none focus:border-blue"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-display text-xs font-bold uppercase tracking-wide text-ink-soft">
              Avatar colour
            </span>
            <div className="flex flex-wrap gap-3">
              {AVATAR_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  aria-label={option}
                  aria-pressed={color === option}
                  className={`h-11 w-11 rounded-full transition ${
                    color === option
                      ? "ring-4 ring-blue/40 ring-offset-2 ring-offset-paper-raised"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ background: `var(--${option})` }}
                />
              ))}
            </div>
          </div>

          {/* Email is shown but not editable — it's the unique key on the
              users table and there's no auth to verify a change of address. */}
          <p className="text-xs text-ink-soft">
            Signed in as {user.email} — email can&apos;t be changed in this build.
          </p>

          {error && (
            <p className="text-xs font-bold text-red" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border-2 border-stone-light px-4 py-3 font-display text-sm font-bold text-ink-soft transition hover:bg-stone-light"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={!valid || !changed || saving}
              className="flex-1 rounded-2xl bg-green px-4 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "SAVING…" : "SAVE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
