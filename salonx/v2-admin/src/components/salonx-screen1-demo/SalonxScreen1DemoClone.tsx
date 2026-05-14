"use client";

import { S1_EMBED_SLOT_CLICK } from "@/lib/s1-embed-protocol";
import type { S1DemoSlotAdjust, SalonxV2AdminConfig, S1DemoSlotId } from "@/lib/salonx-config";
import { getActiveBrand } from "@/lib/salonx-config";
import { S1_FRAME_H, S1_FRAME_W, slotImageTransform } from "@/lib/s1-slot-geometry";
import { salonxThemeInlineVars } from "@/lib/salonx-primary-theme";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

import "@/salonx-clone/screen1.css";
import "@/salonx-clone/screen1-admin-preview.css";

/** From `salonx-web-v2/src/component/CurvedLine.jsx`. */
function CurvedLineClone({ hideBodyFill = false }: { hideBodyFill?: boolean }) {
  return (
    <svg
      className="curvedline-svg"
      width="100%"
      height="100%"
      viewBox="0 0 76 973"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden
    >
      {hideBodyFill ? null : (
        <>
          <path
            d="M38.0749 377.503C40.2632 368.048 41.483 362.743 43.5986 353.252C43.5986 353.252 68.8256 287.211 72.8383 223.827L72.8598 217.5V192.646C72.1107 182.231 70.5056 172.232 67.8085 163C63.6493 148.763 60.061 143.055 52.163 130.5C48.4975 124.673 45.3306 121.059 40.663 116C34.2897 109.092 30.4741 106.465 24.163 99.5C-1.3427 71.3515 2.16299 2 2.16299 2H72.8598V192.646C73.5868 202.753 73.5077 213.253 72.8383 223.827L70.2967 972C70.2967 972 65.8077 950.628 62.9317 936.933L55.5667 901.866C55.5667 901.866 51.2177 879.297 48.4319 864.833C45.6452 850.371 44.0138 842.29 41.2971 827.8L40.4447 823.256C35.4621 796.696 32.417 780.465 27.9481 752.423C23.5632 724.91 21.2141 709.353 17.8213 681.634C13.7903 648.701 10.7518 630.376 9.53567 597.08C8.28362 562.803 8.4079 543.224 11.8372 509.25C14.9692 478.217 18.8533 461.278 25.1862 431.251C29.666 410.009 33.1984 398.568 38.0749 377.503Z"
            fill="#000000"
          />
        </>
      )}
      <path
        d="M40.663 116C45.3306 121.059 48.4975 124.673 52.163 130.5C60.061 143.055 63.6493 148.763 67.8085 163C88.8108 234.892 43.5986 353.252 43.5986 353.252C41.483 362.743 40.2632 368.048 38.0749 377.503C33.1984 398.568 29.666 410.009 25.1862 431.251C18.8533 461.278 14.9692 478.217 11.8372 509.25C8.4079 543.224 8.28362 562.803 9.53567 597.08C10.7518 630.376 13.7903 648.701 17.8213 681.634C21.2141 709.353 23.5632 724.91 27.9481 752.423C32.6663 782.029 35.7973 798.47 41.2971 827.8C44.0138 842.29 45.6452 850.371 48.4319 864.833C51.2177 879.297 55.5667 901.866 55.5667 901.866C55.5667 901.866 60.0557 923.24 62.9317 936.933C65.8077 950.628 70.2967 972 70.2967 972L72.8598 217.5V2H2.16299C2.16299 2 -1.3427 71.3515 24.163 99.5C30.4741 106.465 34.2897 109.092 40.663 116Z"
        fill="none"
        stroke="var(--salonx-primary)"
        strokeWidth="3"
        vectorEffect="nonScalingStroke"
      />
    </svg>
  );
}

const EMBED_SLOT_ARIA: Record<S1DemoSlotId, string> = {
  topBar: "Top bar — upload or adjust image",
  hero: "Hero — upload or adjust image",
  promo: "Promo — upload or adjust image",
  curveStrip: "Curve strip — upload or adjust image or video",
};

function DemoSlotStatic({
  className,
  hintEmpty,
  src,
  adjust,
  slotId,
  interactive = false,
  mediaKind = "image",
}: {
  className: string;
  hintEmpty: string;
  src: string;
  adjust: S1DemoSlotAdjust;
  slotId?: S1DemoSlotId;
  interactive?: boolean;
  mediaKind?: "image" | "video";
}) {
  const transform = slotImageTransform(adjust);
  const cls = [
    "s1demo-slot",
    className,
    src ? "s1demo-slot--committed" : "",
    interactive ? "s1demo-slot--embedInteractive" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const imgLayerStyle: CSSProperties = {
    ["--s1-slot-fit" as string]: adjust.fit,
  };

  const notifyParent = () => {
    if (!interactive || !slotId) return;
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        { type: S1_EMBED_SLOT_CLICK, slot: slotId },
        window.location.origin,
      );
    }
  };

  return (
    <div
      className={cls}
      aria-hidden={interactive ? undefined : true}
      aria-label={interactive && slotId ? EMBED_SLOT_ARIA[slotId] : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? notifyParent : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                notifyParent();
              }
            }
          : undefined
      }
    >
      {src ? (
        <div className="s1demo-slot__imgLayer" style={imgLayerStyle}>
          {mediaKind === "video" ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={src}
              muted
              playsInline
              loop
              autoPlay
              draggable={false}
              style={{ transform }}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={src}
              alt=""
              draggable={false}
              style={{ transform }}
            />
          )}
        </div>
      ) : (
        <span className="s1demo-slot__hint">{hintEmpty}</span>
      )}
    </div>
  );
}

const S1_CARD_STACK_GAP_PX = 8;

const waitingContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 0,
  paddingBottom: "14px",
  gap: S1_CARD_STACK_GAP_PX,
};

const waitingListHeaderStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 14px",
  width: "100%",
  background: "#0a0a0c",
  boxShadow: "0 6px 10px -10px rgba(0, 0, 0, 0.55)",
  boxSizing: "border-box",
};

const innerFlexStyle: CSSProperties = { display: "flex", alignItems: "center" };

const headerCountStyle: CSSProperties = {
  fontSize: "9px",
  fontWeight: 600,
  color: "rgba(245, 245, 247, 0.55)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const clientsContainerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  padding: "0 0 4px",
  boxSizing: "border-box",
  gap: S1_CARD_STACK_GAP_PX,
};

const emptyStyle: CSSProperties = {
  padding: "18px 14px",
  fontSize: "11px",
  color: "rgba(245, 245, 247, 0.5)",
  fontStyle: "italic",
  textAlign: "center",
};

function WaitingListStatic({ primaryHex }: { primaryHex: string }) {
  const headerStyles = useMemo(() => {
    const h = primaryHex;
    return {
      indicatorDotStyle: {
        width: "10px",
        height: "10px",
        background: h,
        borderRadius: "50%",
        boxShadow: `0 0 8px ${h}`,
      } satisfies CSSProperties,
      waitingListHeaderTextStyle: {
        color: h,
        fontSize: "0.72rem",
        fontWeight: "bold",
        paddingLeft: "10px",
        margin: 0,
        letterSpacing: "0.04em",
      } satisfies CSSProperties,
    };
  }, [primaryHex]);

  return (
    <div style={waitingContainerStyle}>
      <div style={waitingListHeaderStyle}>
        <div style={innerFlexStyle}>
          <div style={headerStyles.indicatorDotStyle} />
          <h1 style={headerStyles.waitingListHeaderTextStyle}>Waiting List</h1>
        </div>
        <span style={headerCountStyle} aria-label="0 entries">
          0
        </span>
      </div>
      <div style={clientsContainerStyle}>
        <div style={emptyStyle}>No parked appointments or waitlist clients</div>
      </div>
    </div>
  );
}

function ClientListStatic() {
  return <div style={{ width: "100%", padding: 0, boxSizing: "border-box" }} />;
}

const dayNumberStyle: CSSProperties = {
  fontWeight: "bold",
  margin: 0,
  cursor: "default",
};

/** Read-only stand-in for `DynamicDate` (no router). */
function DateClone() {
  const [parts, setParts] = useState<{ day: string; num: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const today = new Date();
      setParts({
        day: today.toLocaleDateString("en-US", { weekday: "short" }),
        num: today.getDate(),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!parts) {
    return <span style={{ opacity: 0.4 }}>···</span>;
  }
  return (
    <>
      {parts.day}
      <br />
      <p style={dayNumberStyle}>{parts.num}</p>
    </>
  );
}

type CloneProps = {
  config: SalonxV2AdminConfig;
  /**
   * Admin preview: one handset-high frame (omit scroll filler + use definite height
   * so `%` heights and masks align; avoids giant clipped scroll area under `overflow:hidden`).
   */
  embed?: boolean;
};

/**
 * Structural clone of salonx-web-v2 `Screen1DemoImage.jsx` (view-only, no upload).
 * Imports the real `screen1.css` bundle copied from the Vite app.
 */
export function SalonxScreen1DemoClone({ config, embed = false }: CloneProps) {
  const brand = getActiveBrand(config);
  const themeStyle = salonxThemeInlineVars(brand.primaryHex);
  const { images, adjust, mediaKinds } = brand.s1Demo;

  return (
    <div
      className="text-left"
      style={{
        ...themeStyle,
        width: S1_FRAME_W,
        minHeight: S1_FRAME_H,
        ...(embed ? { height: S1_FRAME_H } : {}),
        display: "inline-block",
        verticalAlign: "top",
      }}
    >
      <div
        className="screen1-container screen1-container--demoImage screen1-container--adminPreview"
        style={
          embed
            ? { height: S1_FRAME_H, minHeight: S1_FRAME_H }
            : { height: "100%", minHeight: S1_FRAME_H }
        }
      >
        <div className="date-screen1">
          <DateClone />
        </div>
        <div className="screen1-modal-root" id="v2-admin-screen1-modal-root" />

        <div className="layout-wrapper">
          <div className="screen1-background">
            <div>
              <div
                className="profile-panel s1demo-panelSlot"
                style={{ transform: "translateX(0)" }}
              >
                <div className="s1demo-grayStack">
                  <DemoSlotStatic
                    className="s1demo-grayStack__topBar s1demo-slot--compact"
                    hintEmpty="Tap"
                    src={images.topBar}
                    adjust={adjust.topBar}
                    slotId="topBar"
                    interactive={embed}
                  />
                  <DemoSlotStatic
                    className="s1demo-grayStack__hero"
                    hintEmpty="Tap to add image"
                    src={images.hero}
                    adjust={adjust.hero}
                    slotId="hero"
                    interactive={embed}
                  />
                </div>
              </div>

              <DemoSlotStatic
                className="s1demo-grayPromo s1demo-slot--promo"
                hintEmpty="Tap"
                src={images.promo}
                adjust={adjust.promo}
                slotId="promo"
                interactive={embed}
              />
              <a
                href="https://youtu.be/O-6GcaV833c"
                className="screen1-promoYoutubeLink"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Danger Jones — watch on YouTube (opens in new tab)"
              />

              <div
                className="client-list-wrapper client-list"
                style={{ transform: "translateX(0%)" }}
              >
                <ClientListStatic />
                <WaitingListStatic primaryHex={brand.primaryHex} />
              </div>

              <div
                className="timer-panel"
                style={{ transform: "translateX(-100%)" }}
                aria-hidden
              />
            </div>

            <div className="curvedline-container curvedline-container--demoSlot">
              <div className="s1demo-curveStripLayer">
                <DemoSlotStatic
                  className="s1demo-curveStripSlot"
                  hintEmpty="Tap"
                  src={images.curveStrip}
                  adjust={adjust.curveStrip}
                  slotId="curveStrip"
                  interactive={embed}
                  mediaKind={mediaKinds?.curveStrip === "video" ? "video" : "image"}
                />
              </div>
              <CurvedLineClone hideBodyFill={!!images.curveStrip} />
            </div>
          </div>
        </div>

        {embed ? null : <div className="screen1-blackBelow" aria-hidden />}
      </div>
    </div>
  );
}
