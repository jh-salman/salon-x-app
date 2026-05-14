import { AdminNav } from "@/components/AdminNav";

/**
 * Routes under this group keep the admin chrome. Embed routes (`/embed/*`) use only
 * `app/layout.tsx` so iframes (e.g. stylist curve preview) do not inherit `AdminNav`.
 */
export default function MainAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminNav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </>
  );
}
