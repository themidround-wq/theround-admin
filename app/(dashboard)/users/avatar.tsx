import type { AppUser } from "@/lib/types";

/** Google photo when there is one, otherwise an initial on the brand lime. */
export function Avatar({ user, size = 36 }: { user: Pick<AppUser, "name" | "email" | "pictureUrl">; size?: number }) {
  const initial = (user.name || user.email).slice(0, 1).toUpperCase();
  if (user.pictureUrl) {
    return (
      // Google avatar hosts vary; a plain img avoids configuring remotePatterns.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.pictureUrl} alt="" width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-lime font-black text-ink"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  );
}
