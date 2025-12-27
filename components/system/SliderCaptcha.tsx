"use client";

import React from "react";

export function SliderCaptcha({
  locale,
  onChange
}: {
  locale: "zh" | "en";
  onChange: (ok: boolean) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const knobRef = React.useRef<HTMLButtonElement | null>(null);

  const [dragging, setDragging] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const [offset, setOffset] = React.useState(0);

  const startX = React.useRef(0);
  const startOffset = React.useRef(0);

  React.useEffect(() => {
    onChange(verified);
  }, [onChange, verified]);

  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  const maxOffset = React.useCallback(() => {
    const track = trackRef.current;
    const knob = knobRef.current;
    if (!track || !knob) return 0;
    const trackWidth = track.getBoundingClientRect().width;
    const knobWidth = knob.getBoundingClientRect().width;
    return Math.max(0, trackWidth - knobWidth - 6); // padding
  }, []);

  const reset = React.useCallback(() => {
    setVerified(false);
    setDragging(false);
    setOffset(0);
  }, []);

  const finish = React.useCallback(() => {
    const max = maxOffset();
    setOffset(max);
    setVerified(true);
    setDragging(false);
  }, [maxOffset]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (verified) return;
    setDragging(true);
    startX.current = e.clientX;
    startOffset.current = offset;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || verified) return;
    const max = maxOffset();
    const next = clamp(startOffset.current + (e.clientX - startX.current), 0, max);
    setOffset(next);
  };

  const onPointerUp = () => {
    if (!dragging || verified) return;
    const max = maxOffset();
    const pass = max > 0 && offset >= max * 0.95;
    if (pass) finish();
    else {
      setDragging(false);
      setOffset(0);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2">
        <div className="text-xs text-white/55">
          {verified
            ? locale === "zh"
              ? "已验证"
              : "Verified"
            : locale === "zh"
              ? "拖动滑块完成验证"
              : "Drag the slider to verify"}
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={!verified && !offset}
          className="ml-auto text-xs text-white/50 hover:text-white disabled:opacity-40"
        >
          {locale === "zh" ? "重置" : "Reset"}
        </button>
      </div>

      <div ref={trackRef} className="mt-3 relative h-10 rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
        <div
          className={[
            "absolute inset-y-0 left-0 rounded-2xl transition-colors",
            verified ? "bg-emerald-400/20" : "bg-white/10"
          ].join(" ")}
          style={{ width: `${Math.max(0, offset + 40)}px` }}
        />

        <button
          ref={knobRef}
          type="button"
          disabled={verified}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={[
            "absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl border",
            verified
              ? "bg-emerald-400/20 border-emerald-400/30 text-emerald-100 cursor-default"
              : "bg-white/10 border-white/20 text-white/80 cursor-grab active:cursor-grabbing"
          ].join(" ")}
          style={{ left: `${offset}px` }}
          aria-label={locale === "zh" ? "滑块验证" : "Slider captcha"}
        >
          {verified ? "✓" : "»"}
        </button>

        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40 pointer-events-none select-none">
          {verified ? (locale === "zh" ? "验证通过" : "Passed") : locale === "zh" ? "向右拖动" : "Slide right"}
        </div>
      </div>
    </div>
  );
}

