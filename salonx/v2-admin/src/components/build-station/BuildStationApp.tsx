"use client";

import { VisualImageAdjustModal } from "@/components/build-station/VisualImageAdjustModal";
import { S1CurveMaskPreviewIframe } from "@/components/s1-preview/S1CurveMaskPreviewIframe";
import {
  HANDSET_FRAME_ASPECT,
  MARQUEE_SLOT_ASPECT,
  MARQUEE_SLOT_H,
  S1_FRAME_H,
  S1_FRAME_W,
  SLOT_DISPLAY_BOX,
  slotImageTransform,
} from "@/lib/s1-slot-geometry";
import { uploadToCloudinaryFromBrowser } from "@/lib/cloudinary-browser-upload";
import {
  BUILD_SCREEN_IDS,
  BUILD_SCREEN_LABELS,
  MAX_BRANDS,
  type BrandProfile,
  type BuildScreenId,
  type SalonxV2AdminConfig,
  type S1DemoSlotId,
  clampAdjust,
  getActiveBrand,
  mergeWithDefaults,
  normalizePrimaryHex,
  previewConfigForBrand,
  SALONX_THEME_PRESETS,
} from "@/lib/salonx-config";
import { DeviceMobile, CheckCircle, Info } from "phosphor-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

const S1_SLOT_LABELS: Record<S1DemoSlotId, string> = {
  topBar: "Top bar",
  hero: "Hero",
  promo: "Promo",
  curveStrip: "Curve strip",
};

function cloneBrand(b: BrandProfile): BrandProfile {
  return structuredClone(b);
}

function fileLooksLikeVideo(f: File): boolean {
  return (
    f.type.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v|avi)$/i.test(f.name)
  );
}

type AdjustModalTarget =
  | { kind: "s1"; slot: S1DemoSlotId }
  | { kind: "simple"; screen: "s2" | "s4" | "s5" };

function UploadSpinner() {
  return (
    <span
      className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90"
      aria-hidden
    />
  );
}

function ScreenLockRow({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex justify-end">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-zinc-300"
        />
        Lock this screen
      </label>
    </div>
  );
}

function EditBrandCard({
  working,
  setWorking,
  isActive,
  busy,
  uploadBusy,
  onApply,
}: {
  working: BrandProfile;
  setWorking: (next: BrandProfile) => void;
  isActive: boolean;
  busy: boolean;
  uploadBusy: boolean;
  onApply: () => void;
}) {
  const primaryNorm = normalizePrimaryHex(working.primaryHex);
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Edit brand</h3>
        {isActive ? (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Currently live in app
          </span>
        ) : (
          <span className="rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-400">
            Not active
          </span>
        )}
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Brand name</label>
          <input
            type="text"
            value={working.name}
            onChange={(e) => setWorking({ ...working, name: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <button
          type="button"
          disabled={busy || uploadBusy}
          onClick={onApply}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Applying…" : "Apply to App"}
        </button>
        <div className="space-y-3">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Theme (primary color)
          </label>
          <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
            Same controls as <strong className="font-medium">salonx-web-v2</strong> Settings → Theme.
            Pushes to the app after <strong className="font-medium">Apply to App</strong>.
          </p>
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Presets
            </div>
            <div className="flex flex-wrap gap-2">
              {SALONX_THEME_PRESETS.map(({ label, hex }) => {
                const active = normalizePrimaryHex(hex) === primaryNorm;
                return (
                  <button
                    key={hex}
                    type="button"
                    title={label}
                    aria-label={`${label} ${hex}`}
                    aria-pressed={active}
                    disabled={busy || uploadBusy}
                    onClick={() =>
                      setWorking({ ...working, primaryHex: normalizePrimaryHex(hex) })
                    }
                    className={`h-10 w-10 shrink-0 rounded-full shadow-inner ring-2 ring-offset-2 transition ring-offset-white dark:ring-offset-zinc-950 disabled:opacity-50 ${
                      active
                        ? "ring-zinc-900 dark:ring-zinc-100"
                        : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-600"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Custom
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={primaryNorm}
                onChange={(e) =>
                  setWorking({
                    ...working,
                    primaryHex: normalizePrimaryHex(e.target.value),
                  })
                }
                disabled={busy || uploadBusy}
                aria-label="Primary color"
                className="h-10 w-14 cursor-pointer rounded border border-zinc-200 dark:border-zinc-600 disabled:opacity-50"
              />
              <span className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                {primaryNorm}
              </span>
              <button
                type="button"
                disabled={busy || uploadBusy}
                onClick={() =>
                  setWorking({
                    ...working,
                    primaryHex: normalizePrimaryHex(undefined),
                  })
                }
                className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Reset to default blue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-sky-200/90 bg-sky-50 p-4 dark:border-sky-800/60 dark:bg-sky-950/35">
      <Info
        className="size-5 shrink-0 text-sky-600 dark:text-sky-400"
        weight="fill"
        aria-hidden
      />
      <div className="text-sm leading-snug text-sky-950 dark:text-sky-100">{children}</div>
    </div>
  );
}

export function BuildStationApp() {
  const [store, setStore] = useState<SalonxV2AdminConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [working, setWorking] = useState<BrandProfile | null>(null);
  const [screenTab, setScreenTab] = useState<BuildScreenId>("s2");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<AdjustModalTarget | null>(null);
  /** Slot / screen currently uploading — shows spinner; on success opens Position & zoom. */
  const [uploading, setUploading] = useState<AdjustModalTarget | null>(null);
  const s1FileInputRef = useRef<HTMLInputElement>(null);
  const s1PickSlotRef = useRef<S1DemoSlotId | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("load");
    const raw = await res.json();
    return mergeWithDefaults(raw);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cfg = await load();
        if (cancelled) return;
        setStore(cfg);
        const id = cfg.activeBrandId;
        setSelectedId(id);
        const b = cfg.brands.find((x) => x.id === id) ?? cfg.brands[0];
        setWorking(cloneBrand(b));
      } catch {
        if (!cancelled) setError("Could not load config");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const selectBrand = useCallback(
    async (id: string) => {
      setError(null);
      setMessage(null);
      setSelectedId(id);
      try {
        const cfg = await load();
        setStore(cfg);
        const b = cfg.brands.find((x) => x.id === id);
        if (b) setWorking(cloneBrand(b));
      } catch {
        setError("Could not load brand");
      }
    },
    [load],
  );

  /** Persist brand to server. `activate: true` also sets this brand as live for salonx-web-v2. */
  const persistBrandToServer = useCallback(
    async (brand: BrandProfile, options: { activate: boolean }) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        const body: Record<string, unknown> = {
          saveBrand: brand,
          /** Only true for "Apply to App" — draft framing saves do not push to salonx-web-v2. */
          publishToApp: options.activate,
        };
        if (options.activate) {
          body.activeBrandId = brand.id;
        }
        const res = await fetch("/api/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("save");
        const raw = await res.json();
        const cfg = mergeWithDefaults(raw);
        setStore(cfg);
        const b = cfg.brands.find((x) => x.id === brand.id);
        if (b && selectedId === brand.id) {
          setWorking(cloneBrand(b));
        }
        setMessage(
          options.activate
            ? "Applied to app — this brand is now live"
            : "Framing saved — persists after reload",
        );
        setTimeout(() => setMessage(null), 2800);
      } catch {
        setError(
          options.activate ? "Could not apply to app" : "Could not save framing",
        );
        throw new Error("persist");
      } finally {
        setBusy(false);
      }
    },
    [selectedId],
  );

  const applyToApp = useCallback(async () => {
    if (!working) return;
    await persistBrandToServer(working, { activate: true });
  }, [working, persistBrandToServer]);

  const addBrand = useCallback(async () => {
    if (!store || store.brands.length >= MAX_BRANDS) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addBrand: { name: `Brand ${store.brands.length + 1}` },
          publishToApp: true,
        }),
      });
      if (!res.ok) throw new Error("add");
      const raw = await res.json();
      const cfg = mergeWithDefaults(raw);
      setStore(cfg);
      const newest = cfg.brands[cfg.brands.length - 1];
      if (newest) {
        setSelectedId(newest.id);
        setWorking(cloneBrand(newest));
      }
    } catch {
      setError("Could not add brand");
    } finally {
      setBusy(false);
    }
  }, [store]);

  const removeBrand = useCallback(async () => {
    if (!selectedId || !store || store.brands.length <= 1) return;
    if (!confirm("Remove this brand? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeBrandId: selectedId, publishToApp: true }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "remove");
      }
      const raw = await res.json();
      const cfg = mergeWithDefaults(raw);
      setStore(cfg);
      const a = getActiveBrand(cfg);
      setSelectedId(a.id);
      setWorking(cloneBrand(a));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }, [selectedId, store]);

  const uploadFor = useCallback(async (file: File): Promise<string> => {
    if (fileLooksLikeVideo(file)) {
      try {
        return await uploadToCloudinaryFromBrowser(file, "video");
      } catch {
        /* Large videos must not hit the Next route body limit; fall back only helps tiny clips / non-Cloudinary dev. */
      }
    }
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      let detail = "";
      try {
        const j = (await res.json()) as { error?: string };
        if (typeof j.error === "string" && j.error.trim())
          detail = `: ${j.error.trim()}`;
      } catch {
        /* ignore */
      }
      throw new Error(`Upload failed${detail}`);
    }
    const data = (await res.json()) as { url?: string; path?: string };
    const u = data.url || data.path;
    if (!u) throw new Error("Upload failed: no URL in response");
    return u;
  }, []);

  /** Logical handset preview scale in admin (was 0.5; 1.5× → 0.75). */
  const previewScale = 0.75;
  const scaledW = S1_FRAME_W * previewScale;

  const previewConfig = useMemo(
    () => (working ? previewConfigForBrand(working) : null),
    [working],
  );

  const locked = working ? working.screenLocks[screenTab] : false;
  const uploadBusy = uploading !== null;

  const handleS1PreviewSlotClick = useCallback(
    (slot: S1DemoSlotId) => {
      if (busy || locked || uploadBusy || !working) return;
      const input = s1FileInputRef.current;
      if (input) {
        input.accept =
          slot === "curveStrip"
            ? "image/*,video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v,.heic,.heif"
            : "image/*,.heic,.heif";
      }
      const url = working.s1Demo.images[slot]?.trim();
      if (url) {
        setAdjustModal({ kind: "s1", slot });
        return;
      }
      s1PickSlotRef.current = slot;
      queueMicrotask(() => s1FileInputRef.current?.click());
    },
    [busy, locked, uploadBusy, working],
  );

  const onS1SlotFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const f = input.files?.[0];
      const slot = s1PickSlotRef.current;
      input.value = "";
      if (!f || !slot || locked || uploadBusy) return;
      void (async () => {
        setUploading({ kind: "s1", slot });
        setError(null);
        try {
          const url = await uploadFor(f);
          const isVideo = slot === "curveStrip" && fileLooksLikeVideo(f);
          setWorking((prev) => {
            if (!prev) return prev;
            const next: BrandProfile = {
              ...prev,
              s1Demo: {
                ...prev.s1Demo,
                images: {
                  ...prev.s1Demo.images,
                  [slot]: url,
                },
                mediaKinds: {
                  ...prev.s1Demo.mediaKinds,
                  ...(slot === "curveStrip"
                    ? { curveStrip: isVideo ? ("video" as const) : ("image" as const) }
                    : {}),
                },
              },
            };
            queueMicrotask(() => {
              void persistBrandToServer(next, { activate: false });
            });
            return next;
          });
          setAdjustModal({ kind: "s1", slot });
        } catch (e) {
          setError(
            e instanceof Error ? e.message.slice(0, 220) : "Upload failed",
          );
        } finally {
          setUploading(null);
        }
      })();
    },
    [locked, uploadBusy, uploadFor, persistBrandToServer],
  );

  if (!store || !working || !selectedId) {
    return (
      <p
        className={`text-sm ${error ? "text-red-600" : "text-zinc-500 dark:text-zinc-400"}`}
      >
        {error ?? "Loading…"}
      </p>
    );
  }

  const isActive = store.activeBrandId === selectedId;

  return (
    <div className="flex min-h-[70vh] flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="w-full shrink-0 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:w-64">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Brands
          </h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {store.brands.length}/{MAX_BRANDS}
          </span>
        </div>
        <ul className="space-y-1">
          {store.brands.map((b) => {
            const sel = b.id === selectedId;
            const live = b.id === store.activeBrandId;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => void selectBrand(b.id)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    sel
                      ? "bg-blue-600 text-white"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate font-medium">{b.name}</span>
                  {live ? (
                    <span
                      className={`shrink-0 rounded px-1.5 text-[10px] font-semibold uppercase ${
                        sel ? "bg-white/20 text-white" : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      Live
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            disabled={busy || store.brands.length >= MAX_BRANDS}
            onClick={() => void addBrand()}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            Add brand
          </button>
          <button
            type="button"
            disabled={busy || store.brands.length <= 1}
            onClick={() => void removeBrand()}
            className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:text-red-400"
          >
            Remove brand
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {BUILD_SCREEN_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setScreenTab(id)}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                screenTab === id
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {BUILD_SCREEN_LABELS[id]}
              {working.screenLocks[id] ? " · locked" : ""}
            </button>
          ))}
        </div>

        {screenTab === "s1" && previewConfig ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:items-start">
            <div className="min-w-0 space-y-3">
              <input
                ref={s1FileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                aria-hidden
                tabIndex={-1}
                disabled={busy || locked || uploadBusy}
                onChange={onS1SlotFileSelected}
                className="fixed top-0 left-[-9999px] h-px w-px overflow-hidden opacity-0"
              />
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <DeviceMobile className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
                Preview
              </div>
              <div className="flex justify-center lg:justify-start">
                <div
                  className={`rounded-2xl bg-zinc-900 p-2 shadow-lg ring-1 ring-white/10 ${
                    uploading?.kind === "s1"
                      ? "ring-2 ring-blue-500/40 shadow-md dark:ring-blue-400/45"
                      : ""
                  }`}
                  style={{ width: scaledW + 16 }}
                >
                  <S1CurveMaskPreviewIframe
                    config={previewConfig}
                    scale={previewScale}
                    roundedClassName="rounded-xl"
                    onSlotClick={handleS1PreviewSlotClick}
                    disabled={busy || locked || uploadBusy}
                  />
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <ScreenLockRow
                checked={working.screenLocks.s1}
                onChange={(v) => {
                  const next: BrandProfile = {
                    ...working,
                    screenLocks: { ...working.screenLocks, s1: v },
                  };
                  setWorking(next);
                  void persistBrandToServer(next, { activate: false });
                }}
              />

              <EditBrandCard
                working={working}
                setWorking={setWorking}
                isActive={isActive}
                busy={busy}
                uploadBusy={uploadBusy}
                onApply={() => void applyToApp()}
              />

              <HowItWorksPanel>
                <p>
                  Tap a slot on the phone preview to upload, or use{" "}
                  <strong className="font-semibold">Position &amp; Zoom</strong> to adjust.{" "}
                  <strong className="font-semibold">Curve strip</strong> accepts image or video (MP4,
                  WebM, MOV) like Marquee — videos use the same resize dialog. Use{" "}
                  <strong className="font-semibold">Remove image</strong> in the dialog to clear a
                  slot.
                </p>
              </HowItWorksPanel>
            </div>
          </div>
        ) : screenTab !== "s1" ? (
          (() => {
            const key = screenTab as "s2" | "s4" | "s5";
            const block = working[key];
            const t = slotImageTransform(
              key === "s2" ? { ...block.adjust, tx: 0, ty: 0 } : block.adjust,
            );
            const simpleUploading =
              uploading?.kind === "simple" && uploading.screen === key;
            const howItWorks =
              key === "s2" ? (
                <>
                  Upload a <strong className="font-semibold">Marquee</strong>{" "}
                  <strong className="font-semibold">image or video</strong> (MP4, WebM, MOV). Images
                  use <strong className="font-semibold">Position &amp; zoom</strong>; videos play
                  full-frame on the app.{" "}
                  <strong className="font-semibold">Apply to App</strong> syncs to salonx-web-v2.
                </>
              ) : key === "s4" ? (
                <>
                  <strong className="font-semibold">Climax</strong> is the checkout background
                  (full-bleed behind the glass card). Upload, tune with{" "}
                  <strong className="font-semibold">Position &amp; zoom</strong>, then{" "}
                  <strong className="font-semibold">Apply to App</strong> to sync.
                </>
              ) : (
                <>
                  One image for <strong className="font-semibold">Screen 5</strong>. Use{" "}
                  <strong className="font-semibold">Position &amp; zoom</strong> after upload, then{" "}
                  <strong className="font-semibold">Apply to App</strong>. Wired in salonx-web-v2 via{" "}
                  <code className="rounded bg-sky-200/60 px-1 text-xs dark:bg-sky-900/50">
                    GET /api/config
                  </code>
                  .
                </>
              );
            return (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:items-start">
                <div className="min-w-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    <DeviceMobile className="size-5 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden />
                    Preview · {BUILD_SCREEN_LABELS[key]}
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div
                      className={`relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 transition-shadow dark:border-zinc-700 ${
                        simpleUploading
                          ? "ring-2 ring-blue-500/40 shadow-md dark:ring-blue-400/45"
                          : ""
                      }`}
                      style={{
                        width: Math.min(360, S1_FRAME_W * previewScale),
                        /* Same handset frame mockup as Climax / Screen 5; marquee art still crops to band in Position & zoom. */
                        aspectRatio: HANDSET_FRAME_ASPECT,
                      }}
                    >
                      {block.image ? (
                        block.mediaKind === "video" ? (
                          // eslint-disable-next-line jsx-a11y/media-has-caption
                          <video
                            className="h-full w-full"
                            src={block.image}
                            muted
                            playsInline
                            loop
                            autoPlay
                            style={{
                              objectFit: key === "s2" ? "cover" : block.adjust.fit,
                              transform: t,
                            }}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={block.image}
                            alt=""
                            className="h-full w-full"
                            style={{
                              objectFit: key === "s2" ? "cover" : block.adjust.fit,
                              transform: t,
                            }}
                          />
                        )
                      ) : (
                        <div className="flex h-full min-h-[200px] items-center justify-center text-xs text-zinc-500">
                          No image or video
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        className={`inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white ${locked || uploadBusy ? "cursor-not-allowed bg-zinc-500 opacity-70" : "cursor-pointer bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"}`}
                      >
                        {simpleUploading ? (
                          <>
                            <UploadSpinner />
                            <span>Uploading…</span>
                          </>
                        ) : key === "s2" ? (
                          "Upload image or video"
                        ) : (
                          "Upload image"
                        )}
                        <input
                          type="file"
                          accept={
                            key === "s2"
                              ? "image/*,video/mp4,video/webm,video/quicktime,video/*,.mp4,.webm,.mov,.m4v"
                              : "image/*"
                          }
                          className="sr-only"
                          disabled={busy || locked || uploadBusy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (!f || locked || uploadBusy) return;
                            void (async () => {
                              setUploading({ kind: "simple", screen: key });
                              setError(null);
                              try {
                                const url = await uploadFor(f);
                                const isVideo = key === "s2" && fileLooksLikeVideo(f);
                                setWorking((prev) => {
                                  if (!prev) return prev;
                                  const nextBlock = {
                                    ...prev[key],
                                    image: url,
                                    ...(key === "s2"
                                      ? {
                                          mediaKind: isVideo
                                            ? ("video" as const)
                                            : ("image" as const),
                                        }
                                      : {}),
                                  };
                                  const next: BrandProfile = {
                                    ...prev,
                                    [key]: nextBlock,
                                  };
                                  queueMicrotask(() => {
                                    void persistBrandToServer(next, {
                                      activate: false,
                                    });
                                  });
                                  return next;
                                });
                                if (!(key === "s2" && isVideo)) {
                                  setAdjustModal({ kind: "simple", screen: key });
                                }
                              } catch (e) {
                                setError(
                                  e instanceof Error
                                    ? e.message.slice(0, 220)
                                    : "Upload failed",
                                );
                              } finally {
                                setUploading(null);
                              }
                            })();
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busy || locked || uploadBusy || !block.image}
                        onClick={() => {
                          const next: BrandProfile = {
                            ...working,
                            [key]:
                              key === "s2"
                                ? { ...block, image: "", mediaKind: "image" }
                                : { ...block, image: "" },
                          };
                          setWorking(next);
                          void persistBrandToServer(next, { activate: false });
                        }}
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        disabled={
                          busy ||
                          locked ||
                          uploadBusy ||
                          !block.image ||
                          (key === "s2" && block.mediaKind === "video")
                        }
                        onClick={() => setAdjustModal({ kind: "simple", screen: key })}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200 disabled:opacity-40"
                        title={
                          key === "s2" && block.mediaKind === "video"
                            ? "Position & zoom is for images only"
                            : undefined
                        }
                      >
                        Position & zoom
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Scale {block.adjust.scale.toFixed(2)} · rot {block.adjust.rotate}° · fit{" "}
                    {block.adjust.fit}
                  </p>
                </div>

                <div className="min-w-0 space-y-4">
                  <ScreenLockRow
                    checked={working.screenLocks[key]}
                    onChange={(v) => {
                      const next: BrandProfile = {
                        ...working,
                        screenLocks: { ...working.screenLocks, [key]: v },
                      };
                      setWorking(next);
                      void persistBrandToServer(next, { activate: false });
                    }}
                  />
                  <EditBrandCard
                    working={working}
                    setWorking={setWorking}
                    isActive={isActive}
                    busy={busy}
                    uploadBusy={uploadBusy}
                    onApply={() => void applyToApp()}
                  />
                  <HowItWorksPanel>{howItWorks}</HowItWorksPanel>
                </div>
              </div>
            );
          })()
        ) : null}

        <p className="flex items-center justify-center gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <CheckCircle className="size-4 shrink-0 text-emerald-500 dark:text-emerald-400" weight="fill" aria-hidden />
          Uploads, framing saves, and locks sync to the demo in a few seconds. Theme &amp; brand name
          need <strong className="font-medium text-zinc-600 dark:text-zinc-300">Apply to App</strong>.
        </p>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        ) : null}
      </div>

      {adjustModal && working ? (
        <VisualImageAdjustModal
          open
          title={
            adjustModal.kind === "s1"
              ? `${S1_SLOT_LABELS[adjustModal.slot]} — match device slot`
              : adjustModal.screen === "s2"
                ? `${BUILD_SCREEN_LABELS.s2} — slot (${S1_FRAME_W}×${Math.round(MARQUEE_SLOT_H)})`
                : `${BUILD_SCREEN_LABELS[adjustModal.screen]} — full screen (${S1_FRAME_W}×${S1_FRAME_H})`
          }
          imageUrl={
            adjustModal.kind === "s1"
              ? working.s1Demo.images[adjustModal.slot]
              : working[adjustModal.screen].image
          }
          aspect={
            adjustModal.kind === "s1"
              ? SLOT_DISPLAY_BOX[adjustModal.slot].w / SLOT_DISPLAY_BOX[adjustModal.slot].h
              : adjustModal.screen === "s2"
                ? MARQUEE_SLOT_ASPECT
                : HANDSET_FRAME_ASPECT
          }
          stylistSlot={adjustModal.kind === "s1" ? adjustModal.slot : undefined}
          primaryHex={working.primaryHex}
          handsetCropGlow={
            adjustModal.kind === "simple" && adjustModal.screen === "s2"
          }
          mediaKind={
            adjustModal.kind === "s1" &&
            adjustModal.slot === "curveStrip" &&
            working.s1Demo.mediaKinds?.curveStrip === "video"
              ? "video"
              : "image"
          }
          initialAdjust={
            adjustModal.kind === "s1"
              ? working.s1Demo.adjust[adjustModal.slot]
              : working[adjustModal.screen].adjust
          }
          onClose={() => setAdjustModal(null)}
          onApply={async (next) => {
            const clamped = clampAdjust(next);
            if (!working) return;
            let updated: BrandProfile;
            if (adjustModal.kind === "s1") {
              const slot = adjustModal.slot;
              updated = {
                ...working,
                s1Demo: {
                  ...working.s1Demo,
                  adjust: { ...working.s1Demo.adjust, [slot]: clamped },
                },
              };
            } else {
              const sk = adjustModal.screen;
              updated = { ...working, [sk]: { ...working[sk], adjust: clamped } };
            }
            setWorking(updated);
            await persistBrandToServer(updated, { activate: false });
          }}
          onRemoveImage={
            adjustModal.kind === "s1"
              ? async () => {
                  const slot = adjustModal.slot;
                  if (!working) return;
                  const cleared = clampAdjust({
                    scale: 1,
                    rotate: 0,
                    tx: 0,
                    ty: 0,
                    fit: "contain",
                  });
                  const updated: BrandProfile = {
                    ...working,
                    s1Demo: {
                      ...working.s1Demo,
                      images: { ...working.s1Demo.images, [slot]: "" },
                      adjust: { ...working.s1Demo.adjust, [slot]: cleared },
                      mediaKinds: {
                        ...working.s1Demo.mediaKinds,
                        ...(slot === "curveStrip" ? { curveStrip: "image" as const } : {}),
                      },
                    },
                  };
                  setWorking(updated);
                  setAdjustModal(null);
                  await persistBrandToServer(updated, { activate: false });
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
