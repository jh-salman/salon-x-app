import { SettingsForm } from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Theme</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Controls the primary accent used across toolbars, checkout highlights, and
          brand-tinted UI in salonx-web-v2.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
