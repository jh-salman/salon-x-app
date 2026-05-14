import { S1ScreenMockup } from "@/components/s1-mockup/S1ScreenMockup";
import "./s1-screen-mockup.css";

export default function S1MockupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stylist screen mockup</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Structural copy of{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">
            salonx-web-v2
          </code>{" "}
          stylist home (Screen 1 in the app): 393×852 frame, curve-masked company row and client list,
          right-edge <code className="text-xs">CurvedLine</code> SVG, and bottom toolbar
          layout (placeholders replace real Profile / stats / data).
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <S1ScreenMockup />
      </div>
    </div>
  );
}
