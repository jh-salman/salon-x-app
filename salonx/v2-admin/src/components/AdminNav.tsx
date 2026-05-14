import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/station", label: "Build Station" },
  { href: "/settings", label: "Theme" },
  { href: "/screen1", label: "Stylist media" },
  { href: "/mockup/s1", label: "Stylist mockup" },
];

export function AdminNav() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          SalonX v2 Admin
        </Link>
        <nav className="flex gap-4 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
