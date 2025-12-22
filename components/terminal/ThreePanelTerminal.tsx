"use client";

import React from "react";

type PanelLabels = {
  expand: string;
  collapse: string;
  handle: string;
  edge: string;
};

type TerminalLabels = {
  title: React.ReactNode;
  tagline?: React.ReactNode;
  left: PanelLabels;
  right: PanelLabels;
};

type ThreePanelTerminalProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  labels: TerminalLabels;
  storageKey?: string;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function useHeaderHeight() {
  const [height, setHeight] = React.useState(72);

  React.useEffect(() => {
    const el = document.querySelector("header");
    if (!el) return;

    const update = () => setHeight(el.getBoundingClientRect().height || 72);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return height;
}

export function ThreePanelTerminal({
  left,
  center,
  right,
  labels,
  storageKey = "fxlocus:markets:terminalLayout",
  className = ""
}: ThreePanelTerminalProps) {
  const headerHeight = useHeaderHeight();

  const [leftWidth, setLeftWidth] = React.useState(320);
  const [rightWidth, setRightWidth] = React.useState(360);
  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [rightCollapsed, setRightCollapsed] = React.useState(false);
  const [dragging, setDragging] = React.useState<"left" | "right" | null>(null);

  const dragRef = React.useRef({
    startX: 0,
    startLeft: 0,
    startRight: 0
  });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.leftWidth === "number") setLeftWidth(data.leftWidth);
      if (typeof data.rightWidth === "number") setRightWidth(data.rightWidth);
      if (typeof data.leftCollapsed === "boolean") setLeftCollapsed(data.leftCollapsed);
      if (typeof data.rightCollapsed === "boolean") setRightCollapsed(data.rightCollapsed);
    } catch {
      // ignore storage read errors
    }
  }, [storageKey]);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          leftWidth,
          rightWidth,
          leftCollapsed,
          rightCollapsed
        })
      );
    } catch {
      // ignore storage write errors
    }
  }, [leftWidth, rightWidth, leftCollapsed, rightCollapsed, storageKey]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  React.useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const dx = event.clientX - dragRef.current.startX;
      const leftMin = 240;
      const leftMax = 520;
      const rightMin = 280;
      const rightMax = 560;

      if (dragging === "left") {
        setLeftWidth(clamp(dragRef.current.startLeft + dx, leftMin, leftMax));
      }

      if (dragging === "right") {
        setRightWidth(clamp(dragRef.current.startRight - dx, rightMin, rightMax));
      }
    };

    const onUp = () => setDragging(null);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  const onPointerDownLeft = (event: React.PointerEvent) => {
    if (leftCollapsed) return;
    dragRef.current = {
      startX: event.clientX,
      startLeft: leftWidth,
      startRight: rightWidth
    };
    setDragging("left");
  };

  const onPointerDownRight = (event: React.PointerEvent) => {
    if (rightCollapsed) return;
    dragRef.current = {
      startX: event.clientX,
      startLeft: leftWidth,
      startRight: rightWidth
    };
    setDragging("right");
  };

  const leftSize = leftCollapsed ? 0 : leftWidth;
  const rightSize = rightCollapsed ? 0 : rightWidth;
  const leftHandleSize = leftCollapsed ? 0 : 10;
  const rightHandleSize = rightCollapsed ? 0 : 10;

  return (
    <div
      className={`relative w-screen ${className}`}
      style={{ height: `calc(100vh - ${headerHeight}px)` }}
    >
      <div className="h-14 border-b border-white/10 bg-white/5 px-3">
        <div className="flex h-full items-center gap-3">
          <div className="text-sm font-semibold text-slate-50">{labels.title}</div>
          {labels.tagline ? (
            <div className="hidden text-xs text-slate-200/60 md:block">{labels.tagline}</div>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100/85 hover:bg-white/10"
              onClick={() => setLeftCollapsed((prev) => !prev)}
            >
              {leftCollapsed ? labels.left.expand : labels.left.collapse}
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100/85 hover:bg-white/10"
              onClick={() => setRightCollapsed((prev) => !prev)}
            >
              {rightCollapsed ? labels.right.expand : labels.right.collapse}
            </button>
          </div>
        </div>
      </div>

      <div
        className="grid h-[calc(100%-56px)]"
        style={{
          gridTemplateColumns: `${leftSize}px ${leftHandleSize}px minmax(0, 1fr) ${rightHandleSize}px ${rightSize}px`
        }}
      >
        <div className="h-full overflow-hidden">
          <div className="h-full overflow-y-auto border-r border-white/10 bg-white/5">
            {left}
          </div>
        </div>

        <div
          className="h-full cursor-col-resize touch-none hover:bg-white/10"
          onPointerDown={onPointerDownLeft}
          role="separator"
          aria-label={labels.left.handle}
          title={labels.left.handle}
        />

        <div className="h-full overflow-hidden">
          <div className="h-full overflow-hidden bg-white/5">{center}</div>
        </div>

        <div
          className="h-full cursor-col-resize touch-none hover:bg-white/10"
          onPointerDown={onPointerDownRight}
          role="separator"
          aria-label={labels.right.handle}
          title={labels.right.handle}
        />

        <div className="h-full overflow-hidden">
          <div className="h-full overflow-y-auto border-l border-white/10 bg-white/5">
            {right}
          </div>
        </div>
      </div>

      {leftCollapsed ? (
        <button
          type="button"
          className="absolute left-2 top-20 rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-xs text-slate-100/80 hover:bg-white/20"
          onClick={() => setLeftCollapsed(false)}
          title={labels.left.edge}
          aria-label={labels.left.edge}
        >
          &gt;
        </button>
      ) : null}
      {rightCollapsed ? (
        <button
          type="button"
          className="absolute right-2 top-20 rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-xs text-slate-100/80 hover:bg-white/20"
          onClick={() => setRightCollapsed(false)}
          title={labels.right.edge}
          aria-label={labels.right.edge}
        >
          &lt;
        </button>
      ) : null}
    </div>
  );
}
