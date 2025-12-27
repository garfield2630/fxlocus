"use client";

import React from "react";

type Props = {
  locale: "zh" | "en";
  onChange: (ok: boolean) => void;
  disabled?: boolean;
  resetSignal?: string | number;
};

type Puzzle = {
  width: number;
  height: number;
  piece: number;
  gapX: number;
  gapY: number;
  bgUrl: string;
  pieceUrl: string;
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function generatePuzzle(): Puzzle {
  const width = 320;
  const height = 160;
  const piece = 52;

  const gapX = randInt(90, width - piece - 16);
  const gapY = randInt(18, height - piece - 18);

  const bg = document.createElement("canvas");
  bg.width = width;
  bg.height = height;
  const ctx = bg.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");

  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, `hsl(${randInt(190, 215)} 85% 55%)`);
  g.addColorStop(1, `hsl(${randInt(220, 255)} 80% 45%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 14; i += 1) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = `hsl(${randInt(190, 255)} 90% ${randInt(45, 70)}%)`;
    ctx.beginPath();
    ctx.arc(randInt(0, width), randInt(0, height), randInt(12, 56), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let i = 0; i < 10; i += 1) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = `rgba(255,255,255,${randInt(8, 22) / 100})`;
    ctx.lineWidth = randInt(1, 3);
    ctx.beginPath();
    ctx.moveTo(randInt(0, width), randInt(0, height));
    ctx.lineTo(randInt(0, width), randInt(0, height));
    ctx.stroke();
    ctx.restore();
  }

  const pieceCanvas = document.createElement("canvas");
  pieceCanvas.width = piece;
  pieceCanvas.height = piece;
  const pctx = pieceCanvas.getContext("2d");
  if (!pctx) throw new Error("CANVAS_UNAVAILABLE");
  pctx.drawImage(bg, gapX, gapY, piece, piece, 0, 0, piece, piece);
  pctx.save();
  pctx.globalAlpha = 0.14;
  pctx.fillStyle = "#fff";
  pctx.fillRect(0, 0, piece, piece);
  pctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(gapX, gapY, piece, piece);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(gapX + 1, gapY + 1, piece - 2, piece - 2);
  ctx.restore();

  return {
    width,
    height,
    piece,
    gapX,
    gapY,
    bgUrl: bg.toDataURL("image/png"),
    pieceUrl: pieceCanvas.toDataURL("image/png")
  };
}

export function SliderCaptcha({ locale, onChange, disabled, resetSignal }: Props) {
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const knobRef = React.useRef<HTMLButtonElement | null>(null);
  const timerRef = React.useRef<number | null>(null);

  const [open, setOpen] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const [puzzle, setPuzzle] = React.useState<Puzzle | null>(null);
  const [scale, setScale] = React.useState(1);
  const [maxKnob, setMaxKnob] = React.useState(0);
  const [knobWidth, setKnobWidth] = React.useState(44);
  const [dragging, setDragging] = React.useState(false);
  const [knobOffset, setKnobOffset] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const startX = React.useRef(0);
  const startOffset = React.useRef(0);

  React.useEffect(() => {
    onChange(verified);
  }, [onChange, verified]);

  React.useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
    setVerified(false);
    setPuzzle(null);
    setKnobOffset(0);
    setDragging(false);
    setError(null);
  }, [resetSignal]);

  const refreshLayout = React.useCallback(() => {
    if (!puzzle) return;

    const box = boxRef.current;
    if (box) {
      const w = box.getBoundingClientRect().width;
      setScale(w > 0 ? w / puzzle.width : 1);
    }

    const track = trackRef.current;
    const knob = knobRef.current;
    if (track && knob) {
      const trackWidth = track.getBoundingClientRect().width;
      const kWidth = knob.getBoundingClientRect().width;
      const max = Math.max(0, trackWidth - kWidth - 6);
      setKnobWidth(kWidth);
      setMaxKnob(max);
      setKnobOffset((prev) => clamp(prev, 0, max));
    }
  }, [puzzle]);

  React.useEffect(() => {
    if (!open || !puzzle) return;
    refreshLayout();

    const ro = new ResizeObserver(() => refreshLayout());
    if (boxRef.current) ro.observe(boxRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [open, puzzle, refreshLayout]);

  const reset = React.useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVerified(false);
    setOpen(false);
    setPuzzle(null);
    setKnobOffset(0);
    setDragging(false);
    setError(null);
  }, []);

  const openPuzzle = () => {
    if (verified || disabled) return;
    setOpen(true);
    setError(null);
    setKnobOffset(0);
    setDragging(false);
    setPuzzle(generatePuzzle());
  };

  const regenerate = () => {
    if (verified) return;
    setError(null);
    setKnobOffset(0);
    setDragging(false);
    setPuzzle(generatePuzzle());
  };

  const maxPiece = puzzle ? Math.max(0, puzzle.width - puzzle.piece) : 0;
  const pieceX = puzzle && maxKnob > 0 ? (maxPiece * knobOffset) / maxKnob : 0;
  const tolerance = 6;

  const finishOk = React.useCallback(() => {
    if (!puzzle) return;
    const targetKnob = maxPiece > 0 && maxKnob > 0 ? (puzzle.gapX / maxPiece) * maxKnob : 0;
    setKnobOffset(clamp(targetKnob, 0, maxKnob));
    setVerified(true);
    setDragging(false);
    timerRef.current = window.setTimeout(() => {
      setOpen(false);
      timerRef.current = null;
    }, 320);
  }, [maxKnob, maxPiece, puzzle]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!open || verified || !puzzle || disabled) return;
    setError(null);
    setDragging(true);
    startX.current = e.clientX;
    startOffset.current = knobOffset;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || verified || !open) return;
    const next = clamp(startOffset.current + (e.clientX - startX.current), 0, maxKnob);
    setKnobOffset(next);
  };

  const onPointerUp = () => {
    if (!dragging || verified || !puzzle) return;
    setDragging(false);

    const pass = Math.abs(pieceX - puzzle.gapX) <= tolerance && knobOffset > 6;
    if (pass) {
      finishOk();
      return;
    }

    setError(locale === "zh" ? "未对齐，请重试" : "Not aligned. Try again.");
    setKnobOffset(0);
  };

  const statusText = verified
    ? locale === "zh"
      ? "已验证"
      : "Verified"
    : disabled
      ? locale === "zh"
        ? "请先选择账号类型并填写账号密码"
        : "Fill account type, email and password first"
      : locale === "zh"
        ? "点击开始图形验证"
        : "Click to start verification";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2">
        <div className="text-xs text-white/55">{statusText}</div>
        <button
          type="button"
          onClick={reset}
          disabled={!verified}
          className="ml-auto text-xs text-white/50 hover:text-white disabled:opacity-40"
        >
          {locale === "zh" ? "重置" : "Reset"}
        </button>
      </div>

      <button
        type="button"
        onClick={openPuzzle}
        disabled={disabled || verified}
        className={[
          "mt-3 w-full rounded-2xl border px-4 py-2.5 text-sm transition-colors text-left",
          verified
            ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-100"
            : disabled
              ? "bg-white/5 border-white/10 text-white/40 cursor-not-allowed"
              : "bg-white/10 border-white/20 text-white hover:bg-white/15"
        ].join(" ")}
      >
        {verified ? (locale === "zh" ? "验证通过 ✓" : "Verified ✓") : locale === "zh" ? "点击进行图形拖动验证" : "Click to verify"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#050a14] p-6 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="text-white/90 font-semibold">
                {locale === "zh" ? "图形拖动验证" : "Drag verification"}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
              >
                {locale === "zh" ? "关闭" : "Close"}
              </button>
            </div>

            <div className="mt-3 text-xs text-white/60 leading-5">
              {locale === "zh"
                ? "拖动下方滑块，让拼图块对齐上方缺口。"
                : "Drag the slider to align the piece with the gap."}
            </div>

            <div className="mt-4 space-y-4">
              <div
                ref={boxRef}
                className="relative mx-auto w-full max-w-[360px] aspect-[2/1] rounded-2xl border border-white/10 bg-black/30 overflow-hidden"
              >
                {puzzle ? (
                  <>
                    {/* background */}
                    <img
                      src={puzzle.bgUrl}
                      alt="captcha"
                      className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                      draggable={false}
                    />

                    {/* gap highlight */}
                    <div
                      className="absolute rounded-lg border-2 border-white/70 bg-black/30"
                      style={{
                        left: `${puzzle.gapX * scale}px`,
                        top: `${puzzle.gapY * scale}px`,
                        width: `${puzzle.piece * scale}px`,
                        height: `${puzzle.piece * scale}px`
                      }}
                    />

                    {/* movable piece */}
                    <img
                      src={puzzle.pieceUrl}
                      alt="piece"
                      className="absolute rounded-lg shadow-xl select-none pointer-events-none"
                      style={{
                        left: `${pieceX * scale}px`,
                        top: `${puzzle.gapY * scale}px`,
                        width: `${puzzle.piece * scale}px`,
                        height: `${puzzle.piece * scale}px`
                      }}
                      draggable={false}
                    />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                    {locale === "zh" ? "生成中…" : "Generating…"}
                  </div>
                )}
              </div>

              <div ref={trackRef} className="relative h-10 rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
                <div
                  className={[
                    "absolute inset-y-0 left-0 rounded-2xl transition-colors",
                    verified ? "bg-emerald-400/20" : "bg-white/10"
                  ].join(" ")}
                  style={{ width: `${Math.max(0, knobOffset + knobWidth)}px` }}
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
                    "absolute top-1/2 -translate-y-1/2 h-10 w-11 rounded-2xl border",
                    verified
                      ? "bg-emerald-400/20 border-emerald-400/30 text-emerald-100 cursor-default"
                      : "bg-white/10 border-white/20 text-white/80 cursor-grab active:cursor-grabbing"
                  ].join(" ")}
                  style={{ left: `${knobOffset}px` }}
                  aria-label={locale === "zh" ? "拖动滑块" : "Drag slider"}
                >
                  {verified ? "✓" : "»"}
                </button>

                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40 pointer-events-none select-none">
                  {verified ? (locale === "zh" ? "验证通过" : "Passed") : locale === "zh" ? "向右拖动" : "Slide right"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={regenerate}
                  disabled={verified}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50"
                >
                  {locale === "zh" ? "换一张" : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="ml-auto px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                >
                  {locale === "zh" ? "取消" : "Cancel"}
                </button>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
