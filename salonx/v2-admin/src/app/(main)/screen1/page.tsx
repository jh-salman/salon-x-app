import { Screen1MediaForm } from "@/components/Screen1MediaForm";

export default function Screen1Page() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Stylist media</h1>
      <p className="mb-8 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Slots for the stylist home screen (top bar, hero, promo, curve). The login{" "}
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">marquee</strong> is a
        full-bleed image in Build Station under the Marquee tab.
      </p>
      <Screen1MediaForm />
    </div>
  );
}
