"use client";

import {
  adjustToCropInteraction,
  cropInteractionToAdjust,
} from "@/lib/visual-crop-mapping";
import type { S1DemoSlotAdjust, S1DemoSlotId } from "@/lib/salonx-config";
import {
  S1_CURVE_MASK_URL,
  S1_CURVE_STRIP_CONTENT_MASK_URL,
  S1_MASK_POS_PROMO,
  S1_MASK_POS_STACK,
  S1_MASK_SIZE,
  S1_SLOT_FRAME_RADIUS_PX,
  STYLIST_HERO_CROP_MASK_POS_Y,
  hexToRgbTriplet,
} from "@/lib/s1-slot-geometry";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };

type Props = {
  open: boolean;
  title: string;
  imageUrl: string;
  /** Width / height of the on-device slot (matches `SLOT_DISPLAY_BOX`). */
  aspect: number;
  /**
   * When set (Build Station stylist tab), the preview uses the same corner radii / curve-strip
   * mask as `screen1.css` so crop framing matches the device.
   */
  stylistSlot?: S1DemoSlotId;
  /** Brand primary — hero crop outline glow matches device neon. */
  primaryHex?: string;
  /**
   * Marquee tab: same primary edge + glow as stylist hero/promo, on the full handset crop frame
   * (no curve mask — marquee is a full-bleed band on device).
   */
  handsetCropGlow?: boolean;
  /** When `video`, preview uses `<video>` with the same pan/zoom/rotate as images. */
  mediaKind?: "image" | "video";
  initialAdjust: S1DemoSlotAdjust;
  onClose: () => void;
  /** May return a Promise so the dialog can wait for server persistence before closing. */
  onApply: (next: S1DemoSlotAdjust) => void | Promise<void>;
  /** Stylist slots: clear image and close (saved by parent). */
  onRemoveImage?: () => void | Promise<void>;
};

/**
 * Pointer delta → tx/ty % — keep in sync with `Screen1DemoImage.jsx` pan:
 * `(dx / rect.width) * 110` (slot element rect).
 */
const DRAG_GAIN = 1.1;

export function VisualImageAdjustModal({
  open,
  title,
  imageUrl,
  aspect,
  stylistSlot,
  primaryHex,
  handsetCropGlow,
  mediaKind = "image",
  initialAdjust,
  onClose,
  onApply,
  onRemoveImage,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fit, setFit] = useState<"cover" | "contain">(initialAdjust.fit);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const applyBusyRef = useRef(false);

  useEffect(() => {
    applyBusyRef.current = applyBusy;
  }, [applyBusy]);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startCrop: Point;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const { crop: c, zoom: z, rotation: r } = adjustToCropInteraction(initialAdjust);
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setCrop(c);
      setZoom(z);
      setRotation(r);
      setFit(initialAdjust.fit);
    });
    return () => {
      cancelled = true;
    };
  }, [open, initialAdjust]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
    };
  }, [crop]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      const vp = viewportRef.current;
      if (!d || e.pointerId !== d.pointerId || !vp) return;
      const rect = vp.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const pctX = (dx / rect.width) * 100 * DRAG_GAIN;
      const pctY = (dy / rect.height) * 100 * DRAG_GAIN;
      setCrop({
        x: d.startCrop.x + pctX,
        y: d.startCrop.y + pctY,
      });
    },
    [],
  );

  const endDrag = useCallback((e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !open) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0018;
      setZoom((z) => Math.min(8, Math.max(1, +(z + delta).toFixed(3))));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [open]);

  async function apply(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (applyBusy) return;
    setApplyBusy(true);
    try {
      await Promise.resolve(
        onApply(cropInteractionToAdjust(crop, zoom, rotation, fit)),
      );
      onClose();
    } catch {
      /* Parent shows error; keep dialog open */
    } finally {
      setApplyBusy(false);
    }
  }

  function resetFraming() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  }

  useEffect(() => {
    if (!open) return;
    setApplyBusy(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !applyBusyRef.current) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** Portrait slots: limit height so width follows real handset ratio. Wide slots: cap height. */
  const viewportStyle: CSSProperties = useMemo(() => {
    let base: CSSProperties;
    if (stylistSlot === "hero" || stylistSlot === "promo") {
      /* Match mask canvas width so `curve-mask.svg` (398×852) aligns with hero / promo bands. */
      base = {
        aspectRatio: aspect,
        width: "min(100%, 398px)",
        maxWidth: "100%",
        height: "auto",
      };
    } else if (aspect < 1) {
      base = {
        aspectRatio: aspect,
        maxWidth: "100%",
        height: "min(75vh, 720px)",
        width: "auto",
      };
    } else {
      base = {
        aspectRatio: aspect,
        maxWidth: "100%",
        height: "min(260px, 34vh)",
        width: "auto",
      };
    }

    if (!stylistSlot) {
      if (handsetCropGlow && primaryHex) {
        const { r, g, b } = hexToRgbTriplet(primaryHex);
        const edge = `rgb(${r}, ${g}, ${b})`;
        const glow = `rgba(${r}, ${g}, ${b}, 0.4)`;
        return {
          ...base,
          borderRadius: 16,
          isolation: "isolate",
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
          filter: `drop-shadow(0 0 1px ${edge}) drop-shadow(0 0 5px ${glow})`,
        };
      }
      return { ...base, borderRadius: 8 };
    }

    if (stylistSlot === "hero") {
      const mask = `url(${S1_CURVE_MASK_URL})`;
      const { r, g, b } = hexToRgbTriplet(primaryHex ?? "#3b82f6");
      const edge = `rgb(${r}, ${g}, ${b})`;
      const glow = `rgba(${r}, ${g}, ${b}, 0.4)`;
      return {
        ...base,
        borderRadius: S1_SLOT_FRAME_RADIUS_PX.hero,
        isolation: "isolate",
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
        maskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: `${S1_MASK_POS_STACK.x}px ${STYLIST_HERO_CROP_MASK_POS_Y}px`,
        maskPosition: `${S1_MASK_POS_STACK.x}px ${STYLIST_HERO_CROP_MASK_POS_Y}px`,
        WebkitMaskMode: "alpha",
        maskMode: "alpha",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        filter: `drop-shadow(0 0 1px ${edge}) drop-shadow(0 0 5px ${glow})`,
      };
    }

    if (stylistSlot === "promo") {
      const mask = `url(${S1_CURVE_MASK_URL})`;
      const { r, g, b } = hexToRgbTriplet(primaryHex ?? "#3b82f6");
      const edge = `rgb(${r}, ${g}, ${b})`;
      const glow = `rgba(${r}, ${g}, ${b}, 0.4)`;
      return {
        ...base,
        borderRadius: S1_SLOT_FRAME_RADIUS_PX.promo,
        isolation: "isolate",
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
        maskSize: `${S1_MASK_SIZE.w}px ${S1_MASK_SIZE.h}px`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: `${S1_MASK_POS_PROMO.x}px ${S1_MASK_POS_PROMO.y}px`,
        maskPosition: `${S1_MASK_POS_PROMO.x}px ${S1_MASK_POS_PROMO.y}px`,
        WebkitMaskMode: "alpha",
        maskMode: "alpha",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        filter: `drop-shadow(0 0 1px ${edge}) drop-shadow(0 0 5px ${glow})`,
      };
    }

    if (stylistSlot === "curveStrip") {
      const mask = `url(${S1_CURVE_STRIP_CONTENT_MASK_URL})`;
      return {
        ...base,
        borderRadius: 0,
        isolation: "isolate",
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskMode: "alpha",
        maskMode: "alpha",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      };
    }

    return {
      ...base,
      borderRadius: S1_SLOT_FRAME_RADIUS_PX[stylistSlot],
    };
  }, [aspect, stylistSlot, primaryHex, handsetCropGlow]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="visual-adjust-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-[301] flex max-h-[min(92vh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-zinc-700 bg-zinc-950 shadow-2xl sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 id="visual-adjust-title" className="text-sm font-semibold text-white">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Drag to pan · Scroll to zoom · ±15° rotate ·
              {stylistSlot === "hero"
                ? " Blue glow traces the hero slot (rounded + curve). Pan/zoom so the art fills that shape, then Apply."
                : stylistSlot === "promo"
                  ? " Blue glow traces the promo slot (rounded + curve). Pan/zoom so the art fills that shape, then Apply."
                  : handsetCropGlow
                    ? " Primary glow outlines the Marquee frame (same edge treatment as stylist hero/promo). Pan/zoom to frame the art, then Apply."
                    : stylistSlot === "curveStrip" && mediaKind === "video"
                      ? " Preview outline matches the curve strip on device. Pan/zoom/rotate to frame the video, then Apply."
                    : stylistSlot
                      ? " Preview outline matches the stylist slot shape on device."
                      : " Frame uses the same width÷height as the target screen."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
        </header>

        <div className="flex min-h-[240px] flex-1 items-center justify-center bg-zinc-900 p-3 sm:min-h-[380px]">
          <div
            ref={viewportRef}
            className="relative overflow-hidden bg-zinc-950 ring-1 ring-white/10"
            style={viewportStyle}
          >
            {/* Rule-of-thirds grid */}
            <div
              className="pointer-events-none absolute inset-0 z-10 opacity-[0.22]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255,255,255,0.55) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.55) 1px, transparent 1px)
                `,
                backgroundSize: "33.333% 33.333%",
              }}
              aria-hidden
            />
            {/*
              Mirror `screen1.css` `.s1demo-slot__imgLayer` + img: 100%×100% so
              `translate(%…%)` uses the same bounding box as the handset slot (hero, promo, etc.).
              The old minWidth/minHeight "cover the viewport" img made % pan/zoom unrelated to Apply.
            */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ zIndex: 1 }}
            >
              {mediaKind === "video" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  key={imageUrl}
                  src={imageUrl}
                  className="select-none"
                  muted
                  playsInline
                  loop
                  autoPlay
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: fit,
                    transform: `translate(${crop.x}%, ${crop.y}%) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: "center center",
                    touchAction: "none",
                    cursor: dragging ? "grabbing" : "grab",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt=""
                  draggable={false}
                  className="select-none"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: fit,
                    transform: `translate(${crop.x}%, ${crop.y}%) rotate(${rotation}deg) scale(${zoom})`,
                    transformOrigin: "center center",
                    touchAction: "none",
                    cursor: dragging ? "grabbing" : "grab",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                />
              )}
            </div>
          </div>
        </div>

        <footer className="shrink-0 space-y-3 border-t border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Zoom</span>
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="min-w-[3rem] text-center font-mono text-xs text-zinc-300">
              {zoom.toFixed(2)}×
            </span>
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
              onClick={() => setZoom((z) => Math.min(8, +(z + 0.1).toFixed(2)))}
              aria-label="Zoom in"
            >
              +
            </button>
            <span className="mx-2 hidden h-4 w-px bg-zinc-700 sm:inline" />
            <span className="text-xs font-medium text-zinc-500">Rotate</span>
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
              onClick={() => setRotation((r) => r - 15)}
            >
              −15°
            </button>
            <button
              type="button"
              className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
              onClick={() => setRotation((r) => r + 15)}
            >
              +15°
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900"
              onClick={resetFraming}
            >
              Reset move & zoom
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Object fit in app</span>
              <button
                type="button"
                onClick={() => setFit("contain")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  fit === "contain"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                Contain
              </button>
              <button
                type="button"
                onClick={() => setFit("cover")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  fit === "cover"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                Cover
              </button>
              {stylistSlot && onRemoveImage ? (
                <button
                  type="button"
                  disabled={applyBusy}
                  onClick={() => void onRemoveImage()}
                  className="rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-950/80 disabled:opacity-50"
                >
                  Remove image
                </button>
              ) : null}
            </div>
            <button
              type="button"
              disabled={applyBusy}
              onClick={(e) => void apply(e)}
              className="relative z-[2] rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applyBusy ? "Saving…" : "Apply to slot"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
