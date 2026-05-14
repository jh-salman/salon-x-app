"use client";

import { useEffect, useState } from "react";

/** Same paths as `salonx-web-v2` `CurvedLine.jsx` (body + stroke). */
function CurvedLineMock() {
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
      <path
        d="M38.0749 377.503C40.2632 368.048 41.483 362.743 43.5986 353.252C43.5986 353.252 68.8256 287.211 72.8383 223.827L72.8598 217.5V192.646C72.1107 182.231 70.5056 172.232 67.8085 163C63.6493 148.763 60.061 143.055 52.163 130.5C48.4975 124.673 45.3306 121.059 40.663 116C34.2897 109.092 30.4741 106.465 24.163 99.5C-1.3427 71.3515 2.16299 2 2.16299 2H72.8598V192.646C73.5868 202.753 73.5077 213.253 72.8383 223.827L70.2967 972C70.2967 972 65.8077 950.628 62.9317 936.933L55.5667 901.866C55.5667 901.866 51.2177 879.297 48.4319 864.833C45.6452 850.371 44.0138 842.29 41.2971 827.8L40.4447 823.256C35.4621 796.696 32.417 780.465 27.9481 752.423C23.5632 724.91 21.2141 709.353 17.8213 681.634C13.7903 648.701 10.7518 630.376 9.53567 597.08C8.28362 562.803 8.4079 543.224 11.8372 509.25C14.9692 478.217 18.8533 461.278 25.1862 431.251C29.666 410.009 33.1984 398.568 38.0749 377.503Z"
        fill="#000000"
      />
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

function IconScissors({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M216 92a28 28 0 1 1-28-28 28 28 0 0 1 28 28ZM184 128a27.76 27.76 0 0 1-17.09-5.86L128 114.71 89.09 122.14A28 28 0 1 1 80 72.52l43-8.6a12 12 0 0 1 4.7.57l38.91 7.43A28 28 0 1 1 184 128ZM128 176.71l-43 8.6a12 12 0 0 1-4.7-.57L41.39 177.31A28 28 0 1 1 72 204.52l43-8.6a12 12 0 0 1 4.7-.57l38.91-7.43A28 28 0 1 1 128 176.71Z" />
    </svg>
  );
}

function IconUser({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M230.93 220a12 12 0 0 1-10.93 7H36a12 12 0 0 1-10.93-7 123.69 123.69 0 0 1 20.58-49.48A84.13 84.13 0 0 1 128 136a84.13 84.13 0 0 1 82.35 34.52 123.69 123.69 0 0 1 20.58 49.48ZM128 120a48 48 0 1 0-48-48 48 48 0 0 0 48 48Z" />
    </svg>
  );
}

function IconBolt({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="m213.65 122.35-144-80A12 12 0 0 0 52 54v68a12 12 0 0 0 2.35 7.17L136 212h56a12 12 0 0 0 8.88-19.92L151.87 122l69.78-38.76a12 12 0 0 0 0-21Z" />
    </svg>
  );
}

function IconCalendar({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M208 36h-28V24a12 12 0 0 0-24 0v12H100V24a12 12 0 0 0-24 0v12H48a20 20 0 0 0-20 20v160a20 20 0 0 0 20 20h160a20 20 0 0 0 20-20V56a20 20 0 0 0-20-20ZM76 204H52a4 4 0 0 1-4-4V100h28Zm56 0H100V100h32Zm56 0h-24V100h28v100a4 4 0 0 1-4 4Z" />
    </svg>
  );
}

function IconGear({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden>
      <path d="M128 80a48 48 0 1 0 48 48 48 48 0 0 0-48-48Zm106.79 62.88-9.56 28a19.9 19.9 0 0 1-24.5 12.8l-26.57-9.63a77.57 77.57 0 0 1-8.21 7.08l5.91 27.35a20 20 0 0 1-15.36 23.73l-29.67 6.12A19.88 19.88 0 0 1 117 222.62L108 194a81.2 81.2 0 0 1-10.32 0l-9 28.62a19.88 19.88 0 0 1-19.19 13.93h-4.72a19.9 19.9 0 0 1-19.89-19.29l5.92-27.35a77.57 77.57 0 0 1-8.21-7.08l-26.57 9.63a19.9 19.9 0 0 1-24.5-12.8l-9.56-28A20 20 0 0 1 18 123.47l21.53-19.17a76.48 76.48 0 0 1 0-10.6L18 74.53a20 20 0 0 1-7.79-26.25l9.56-28a19.9 19.9 0 0 1 24.5-12.8l26.57 9.63a77.57 77.57 0 0 1 8.21-7.08l-5.91-27.35a20 20 0 0 1 15.36-23.73l29.67-6.12A19.88 19.88 0 0 1 139 33.38l9 28.62a81.2 81.2 0 0 1 10.32 0l9-28.62A19.88 19.88 0 0 1 177.48 19h4.72a19.9 19.9 0 0 1 19.89 19.29l-5.92 27.35a77.57 77.57 0 0 1 8.21 7.08l26.57-9.63a19.9 19.9 0 0 1 24.5 12.8l9.56 28A20 20 0 0 1 238 132.53l-21.53 19.17a76.48 76.48 0 0 1 0 10.6L238 181.47a20 20 0 0 1 7.79 26.25ZM128 168a40 40 0 1 1 40-40 40 40 0 0 1-40 40Z" />
    </svg>
  );
}

const TOOLBAR = [
  { Icon: IconScissors, label: "Stylist", active: true },
  { Icon: IconUser, label: "Clients", active: false },
  { Icon: IconBolt, label: "Checkout", active: false },
  { Icon: IconCalendar, label: "Calendar", active: false },
  { Icon: IconGear, label: "Settings", active: false },
];

function MockProfileBlock() {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        position: "relative",
        width: "360px",
        height: "206px",
        margin: "0 auto",
        borderTopRightRadius: "50px",
        borderBottomRightRadius: "51px",
        padding: "53px 16px 0 16px",
        textAlign: "center",
        isolation: "isolate",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          borderTopRightRadius: "50px",
          borderBottomRightRadius: "51px",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(5px)",
        }}
      />
      <div className="relative z-[1]" style={{ position: "relative", zIndex: 1 }}>
        <div
          className="mx-auto block rounded-[14px] bg-zinc-700"
          style={{
            width: "190px",
            height: "120px",
          }}
        />
        <p className="mt-2 text-[10px] font-bold text-white/40">Profile · mock</p>
      </div>
    </div>
  );
}

function MockTopStats() {
  return (
    <div
      className="flex items-center justify-center gap-3 opacity-30"
      style={{ width: "100%", height: "100%" }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-full border border-white/20"
          style={{ width: 56, height: 56 }}
        />
      ))}
    </div>
  );
}

function MockCompanyHeader() {
  const grad =
    "linear-gradient(to right, var(--salonx-primary) 0%, rgba(59, 130, 246, 0.8) 18%, rgba(59, 130, 246, 0.4) 45%, transparent 85%)";
  return (
    <div
      style={{
        position: "relative",
        padding: "1.5px",
        background: grad,
        borderRadius: "11.5px",
        width: "100%",
        height: "70px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="flex h-full w-full items-center justify-between rounded-[10px] bg-[#1A1A1A] px-6 text-white"
        style={{ boxSizing: "border-box" }}
      >
        <div className="h-10 w-28 rounded bg-zinc-700" />
        <span className="text-lg text-white/50">+</span>
        <div className="h-10 w-12 rounded bg-zinc-600" />
      </div>
    </div>
  );
}

function MockClientRows() {
  return (
    <div className="flex flex-col gap-2 px-1 py-2">
      {["Client A", "Client B", "Waiting · 1", "Needs attention"].map((label) => (
        <div
          key={label}
          className="rounded-xl border border-white/10 bg-zinc-900/90 px-3 py-3"
        >
          <div className="h-3 w-24 rounded bg-zinc-600" />
          <div className="mt-2 h-2 w-40 rounded bg-zinc-700" />
        </div>
      ))}
    </div>
  );
}

/**
 * Static structural copy of salonx-web-v2 `Screen1.jsx` (393×852, masks, toolbar, curve).
 */
export function S1ScreenMockup() {
  const [dateLabel, setDateLabel] = useState("…");

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setDateLabel(
        new Date().toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="s1-mockup-scope inline-block text-left">
      <div className="screen1-container">
        <div className="date-screen1">{dateLabel}</div>
        <div id="screen1-modal-root" className="screen1-modal-root" />

        <div className="layout-wrapper">
          <div className="screen1-background">
            <div>
              <div className="profile-panel">
                <MockProfileBlock />
              </div>

              <div className="topstats-panel">
                <MockTopStats />
              </div>

              <div className="company-header">
                <MockCompanyHeader />
              </div>

              <div className="client-list-wrapper client-list">
                <MockClientRows />
              </div>

              <div
                className="timer-panel"
                style={{ transform: "translateX(-100%)" }}
                aria-hidden
              />

              <div className="screen1-toolbar" role="toolbar" aria-label="Screen toolbar">
                {TOOLBAR.map(({ Icon, label, active }) => (
                  <button
                    key={label}
                    type="button"
                    className={`screen1-toolbar__btn${active ? " screen1-toolbar__btn--solid" : ""}`}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    disabled
                  >
                    <Icon size={active ? 26 : 24} />
                  </button>
                ))}
              </div>
            </div>

            <div className="curvedline-container" aria-hidden>
              <CurvedLineMock />
            </div>
          </div>
        </div>

        <div className="screen1-blackBelow" aria-hidden />
      </div>
    </div>
  );
}
